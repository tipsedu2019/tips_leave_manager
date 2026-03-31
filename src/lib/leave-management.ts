import { CarryoverLeave, User } from "../types"
import { calculateAnnualLeave } from "./utils"

function parseIsoDate(value: string) {
  const [year, month, day] = value.split("-").map(Number)
  return new Date(year, month - 1, day)
}

function formatIsoDate(date: Date) {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, "0")
  const day = `${date.getDate()}`.padStart(2, "0")
  return `${year}-${month}-${day}`
}

function addYears(date: Date, years: number) {
  const next = new Date(date)
  next.setFullYear(next.getFullYear() + years)
  return next
}

function sortCarryovers(carryoverLeaves: CarryoverLeave[]) {
  return [...carryoverLeaves]
    .filter((entry) => entry.remainingDays > 0)
    .sort((left, right) => left.year - right.year)
}

function mergeCarryoverLeave(
  carryoverLeaves: CarryoverLeave[],
  year: number,
  remainingDays: number
) {
  if (remainingDays <= 0) {
    return sortCarryovers(carryoverLeaves)
  }

  const nextCarryovers = [...carryoverLeaves]
  const existing = nextCarryovers.find((entry) => entry.year === year)

  if (existing) {
    existing.remainingDays += remainingDays
  } else {
    nextCarryovers.push({ year, remainingDays })
  }

  return sortCarryovers(nextCarryovers)
}

export function getNextLeaveAccrualDate(
  joinDate: string,
  fromDate = new Date().toISOString().split("T")[0]
) {
  const join = parseIsoDate(joinDate)
  const reference = parseIsoDate(fromDate)
  const candidate = new Date(reference.getFullYear(), join.getMonth(), join.getDate())

  if (candidate <= reference) {
    candidate.setFullYear(candidate.getFullYear() + 1)
  }

  return formatIsoDate(candidate)
}

export function getCarryoverBalance(user: Pick<User, "carryoverLeaves">) {
  return user.carryoverLeaves.reduce((sum, entry) => sum + entry.remainingDays, 0)
}

export function getAvailableAnnualLeave(user: Pick<User, "carryoverLeaves" | "totalLeave" | "usedLeave">) {
  return getCarryoverBalance(user) + Math.max(0, user.totalLeave - user.usedLeave)
}

export function syncAnnualLeaveIfNeeded(user: User, today = new Date().toISOString().split("T")[0]) {
  let nextUser = {
    ...user,
    carryoverLeaves: sortCarryovers(user.carryoverLeaves),
  }
  let changed = false
  let nextAccrualDate = parseIsoDate(nextUser.nextLeaveAccrualDate)
  const todayDate = parseIsoDate(today)

  while (nextAccrualDate <= todayDate) {
    const carryoverYear = nextAccrualDate.getFullYear() - 1
    const remainingLeave = Math.max(0, nextUser.totalLeave - nextUser.usedLeave)

    nextUser = {
      ...nextUser,
      carryoverLeaves: mergeCarryoverLeave(
        nextUser.carryoverLeaves,
        carryoverYear,
        remainingLeave
      ),
      totalLeave: calculateAnnualLeave(
        nextUser.joinDate,
        formatIsoDate(nextAccrualDate)
      ),
      usedLeave: 0,
      nextLeaveAccrualDate: formatIsoDate(addYears(nextAccrualDate, 1)),
    }
    nextAccrualDate = parseIsoDate(nextUser.nextLeaveAccrualDate)
    changed = true
  }

  return { user: nextUser, changed }
}

export function consumeAnnualLeave(user: User, days: number) {
  let remainingDays = days
  const carryoverLeaves = sortCarryovers(user.carryoverLeaves).map((entry) => ({
    ...entry,
  }))

  for (const entry of carryoverLeaves) {
    if (remainingDays <= 0) {
      break
    }

    const usedFromCarryover = Math.min(entry.remainingDays, remainingDays)
    entry.remainingDays -= usedFromCarryover
    remainingDays -= usedFromCarryover
  }

  const currentYearAvailable = Math.max(0, user.totalLeave - user.usedLeave)
  if (remainingDays > currentYearAvailable) {
    throw new Error("Insufficient annual leave balance")
  }

  return {
    ...user,
    carryoverLeaves: sortCarryovers(carryoverLeaves),
    usedLeave: user.usedLeave + remainingDays,
  }
}
