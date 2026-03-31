import test from "node:test"
import assert from "node:assert/strict"

import {
  consumeAnnualLeave,
  getAvailableAnnualLeave,
  syncAnnualLeaveIfNeeded,
} from "../src/lib/leave-management"
import { normalizeUserRecord } from "../src/lib/user-records"

test("syncAnnualLeaveIfNeeded carries over remaining leave and resets usedLeave on anniversary", () => {
  const user = normalizeUserRecord({
    uid: "user-1",
    email: "user@example.com",
    displayName: "Tester",
    role: "EMPLOYEE",
    joinDate: "2024-04-01",
    totalLeave: 15,
    usedLeave: 4,
    nextLeaveAccrualDate: "2025-04-01",
  })

  const result = syncAnnualLeaveIfNeeded(user, "2025-04-01")

  assert.equal(result.changed, true)
  assert.equal(result.user.usedLeave, 0)
  assert.deepEqual(result.user.carryoverLeaves, [{ year: 2024, remainingDays: 11 }])
  assert.equal(result.user.nextLeaveAccrualDate, "2026-04-01")
})

test("consumeAnnualLeave spends oldest carryover leave before current year leave", () => {
  const user = normalizeUserRecord({
    uid: "user-2",
    email: "user2@example.com",
    displayName: "Tester 2",
    role: "EMPLOYEE",
    joinDate: "2023-04-01",
    totalLeave: 15,
    usedLeave: 1,
    carryoverLeaves: [
      { year: 2024, remainingDays: 1 },
      { year: 2025, remainingDays: 2 },
    ],
  })

  const updated = consumeAnnualLeave(user, 2.5)

  assert.deepEqual(updated.carryoverLeaves, [{ year: 2025, remainingDays: 0.5 }])
  assert.equal(updated.usedLeave, 1)
  assert.equal(getAvailableAnnualLeave(updated), 14.5)
})

test("multi-year sync accrues each anniversary using that year's entitlement", () => {
  const user = normalizeUserRecord({
    uid: "user-3",
    email: "user3@example.com",
    displayName: "Tester 3",
    role: "EMPLOYEE",
    joinDate: "2021-04-01",
    totalLeave: 15,
    usedLeave: 0,
    nextLeaveAccrualDate: "2023-04-01",
  })

  const result = syncAnnualLeaveIfNeeded(user, "2026-04-02")

  assert.equal(result.changed, true)
  assert.deepEqual(result.user.carryoverLeaves, [
    { year: 2022, remainingDays: 15 },
    { year: 2023, remainingDays: 15 },
    { year: 2024, remainingDays: 16 },
    { year: 2025, remainingDays: 16 },
  ])
  assert.equal(result.user.totalLeave, 17)
  assert.equal(result.user.nextLeaveAccrualDate, "2027-04-01")
})
