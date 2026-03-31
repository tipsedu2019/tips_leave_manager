import { CarryoverLeave, User } from "../types"
import { calculateAnnualLeave } from "./utils"
import { getNextLeaveAccrualDate } from "./leave-management"

type UserRecordInput = Partial<User> &
  Pick<User, "uid" | "email" | "displayName" | "role"> & {
    joinDate?: string
  }

type UserRecordOverrides = Partial<
  Pick<
    User,
    | "displayName"
    | "role"
    | "totalLeave"
    | "usedLeave"
    | "totalCompLeave"
    | "usedCompLeave"
    | "joinDate"
    | "carryoverLeaves"
    | "nextLeaveAccrualDate"
  >
>

function getNumberOrFallback(value: number | undefined, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback
}

function normalizeCarryoverLeaves(carryoverLeaves: CarryoverLeave[] | undefined) {
  if (!Array.isArray(carryoverLeaves)) {
    return []
  }

  return carryoverLeaves
    .filter(
      (entry) =>
        typeof entry?.year === "number" &&
        Number.isFinite(entry.year) &&
        typeof entry?.remainingDays === "number" &&
        Number.isFinite(entry.remainingDays) &&
        entry.remainingDays > 0
    )
    .sort((left, right) => left.year - right.year)
}

export function normalizeUserRecord(user: UserRecordInput): User {
  const joinDate = user.joinDate ?? new Date().toISOString().split("T")[0]

  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    role: user.role,
    joinDate,
    totalLeave: getNumberOrFallback(
      user.totalLeave,
      calculateAnnualLeave(joinDate)
    ),
    usedLeave: getNumberOrFallback(user.usedLeave, 0),
    totalCompLeave: getNumberOrFallback(user.totalCompLeave, 0),
    usedCompLeave: getNumberOrFallback(user.usedCompLeave, 0),
    carryoverLeaves: normalizeCarryoverLeaves(user.carryoverLeaves),
    nextLeaveAccrualDate:
      user.nextLeaveAccrualDate ?? getNextLeaveAccrualDate(joinDate),
  }
}

export function mergeUserRecord(user: User, overrides: UserRecordOverrides): User {
  return normalizeUserRecord({
    ...user,
    ...overrides,
  })
}
