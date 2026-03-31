import {
  CarryoverLeave,
  CarryoverUsage,
  LeaveAccrualEvent,
  LeaveAccrualHistoryEntry,
  LeaveApprovalAdjustment,
  User,
} from "../types"
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

export function getAvailableAnnualLeave(
  user: Pick<User, "carryoverLeaves" | "totalLeave" | "usedLeave">
) {
  return getCarryoverBalance(user) + Math.max(0, user.totalLeave - user.usedLeave)
}

export function getAccrualHistory(
  user: Pick<User, "joinDate" | "nextLeaveAccrualDate">
) {
  const entries: LeaveAccrualHistoryEntry[] = [
    {
      accrualDate: user.joinDate,
      grantedDays: calculateAnnualLeave(user.joinDate, user.joinDate),
      kind: "INITIAL",
    },
  ]

  let nextAccrualDate = getNextLeaveAccrualDate(user.joinDate, user.joinDate)

  while (nextAccrualDate < user.nextLeaveAccrualDate) {
    entries.push({
      accrualDate: nextAccrualDate,
      grantedDays: calculateAnnualLeave(user.joinDate, nextAccrualDate),
      kind: "ANNIVERSARY",
    })
    nextAccrualDate = formatIsoDate(addYears(parseIsoDate(nextAccrualDate), 1))
  }

  return entries.sort((left, right) => right.accrualDate.localeCompare(left.accrualDate))
}

export function syncAnnualLeaveIfNeeded(
  user: User,
  today = new Date().toISOString().split("T")[0]
) {
  let nextUser = {
    ...user,
    carryoverLeaves: sortCarryovers(user.carryoverLeaves),
  }
  let changed = false
  let nextAccrualDate = parseIsoDate(nextUser.nextLeaveAccrualDate)
  const todayDate = parseIsoDate(today)
  const events: LeaveAccrualEvent[] = []

  while (nextAccrualDate <= todayDate) {
    const carryoverYear = nextAccrualDate.getFullYear() - 1
    const remainingLeave = Math.max(0, nextUser.totalLeave - nextUser.usedLeave)
    const accrualDate = formatIsoDate(nextAccrualDate)
    const grantedDays = calculateAnnualLeave(nextUser.joinDate, accrualDate)

    events.push({
      accrualDate,
      grantedDays,
      carriedOverDays: remainingLeave,
      kind: "ANNIVERSARY",
    })

    nextUser = {
      ...nextUser,
      carryoverLeaves: mergeCarryoverLeave(
        nextUser.carryoverLeaves,
        carryoverYear,
        remainingLeave
      ),
      totalLeave: grantedDays,
      usedLeave: 0,
      nextLeaveAccrualDate: formatIsoDate(addYears(nextAccrualDate, 1)),
    }
    nextAccrualDate = parseIsoDate(nextUser.nextLeaveAccrualDate)
    changed = true
  }

  return { user: nextUser, changed, events }
}

export function consumeAnnualLeaveWithAdjustment(user: User, days: number) {
  let remainingDays = days
  const carryoverLeaves = sortCarryovers(user.carryoverLeaves).map((entry) => ({
    ...entry,
  }))
  const carryoverUsage: CarryoverUsage[] = []

  for (const entry of carryoverLeaves) {
    if (remainingDays <= 0) {
      break
    }

    const usedFromCarryover = Math.min(entry.remainingDays, remainingDays)
    if (usedFromCarryover > 0) {
      entry.remainingDays -= usedFromCarryover
      remainingDays -= usedFromCarryover
      carryoverUsage.push({
        year: entry.year,
        days: usedFromCarryover,
      })
    }
  }

  const currentYearAvailable = Math.max(0, user.totalLeave - user.usedLeave)
  if (remainingDays > currentYearAvailable) {
    throw new Error("Insufficient annual leave balance")
  }

  const adjustment: LeaveApprovalAdjustment = {
    currentYearDays: remainingDays,
    carryoverUsage,
  }

  return {
    user: {
      ...user,
      carryoverLeaves: sortCarryovers(carryoverLeaves),
      usedLeave: user.usedLeave + remainingDays,
    },
    adjustment,
  }
}

export function consumeAnnualLeave(user: User, days: number) {
  return consumeAnnualLeaveWithAdjustment(user, days).user
}

export function restoreAnnualLeave(
  user: User,
  adjustment: LeaveApprovalAdjustment | undefined
) {
  const currentYearDays = adjustment?.currentYearDays ?? 0
  const carryoverUsage = adjustment?.carryoverUsage ?? []

  let carryoverLeaves = sortCarryovers(user.carryoverLeaves)

  for (const entry of carryoverUsage) {
    carryoverLeaves = mergeCarryoverLeave(carryoverLeaves, entry.year, entry.days)
  }

  return {
    ...user,
    carryoverLeaves,
    usedLeave: Math.max(0, user.usedLeave - currentYearDays),
  }
}
