import test from "node:test"
import assert from "node:assert/strict"

import {
  consumeAnnualLeave,
  consumeAnnualLeaveWithAdjustment,
  getAccrualHistory,
  getAvailableAnnualLeave,
  getLeaveGrantHistory,
  restoreAnnualLeave,
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

test("consumeAnnualLeaveWithAdjustment records oldest-first usage and restoreAnnualLeave reverts it", () => {
  const user = normalizeUserRecord({
    uid: "user-4",
    email: "user4@example.com",
    displayName: "Tester 4",
    role: "EMPLOYEE",
    joinDate: "2023-04-01",
    totalLeave: 16,
    usedLeave: 2,
    carryoverLeaves: [
      { year: 2024, remainingDays: 1 },
      { year: 2025, remainingDays: 2 },
    ],
  })

  const approved = consumeAnnualLeaveWithAdjustment(user, 4)

  assert.deepEqual(approved.adjustment, {
    currentYearDays: 1,
    carryoverUsage: [
      { year: 2024, days: 1 },
      { year: 2025, days: 2 },
    ],
  })
  assert.deepEqual(approved.user.carryoverLeaves, [])
  assert.equal(approved.user.usedLeave, 3)

  const restored = restoreAnnualLeave(approved.user, approved.adjustment)

  assert.deepEqual(restored.carryoverLeaves, [
    { year: 2024, remainingDays: 1 },
    { year: 2025, remainingDays: 2 },
  ])
  assert.equal(restored.usedLeave, 2)
  assert.equal(getAvailableAnnualLeave(restored), getAvailableAnnualLeave(user))
})

test("getAccrualHistory lists the initial grant and each anniversary grant", () => {
  const user = normalizeUserRecord({
    uid: "user-5",
    email: "user5@example.com",
    displayName: "Tester 5",
    role: "EMPLOYEE",
    joinDate: "2023-04-01",
    nextLeaveAccrualDate: "2026-04-01",
  })

  assert.deepEqual(getAccrualHistory(user), [
    { accrualDate: "2025-04-01", grantedDays: 15, kind: "ANNIVERSARY" },
    { accrualDate: "2024-04-01", grantedDays: 15, kind: "ANNIVERSARY" },
    { accrualDate: "2023-04-01", grantedDays: 11, kind: "INITIAL" },
  ])
})

test("getLeaveGrantHistory merges annual accruals with compensatory grants in descending order", () => {
  const user = normalizeUserRecord({
    uid: "user-6",
    email: "user6@example.com",
    displayName: "Tester 6",
    role: "EMPLOYEE",
    joinDate: "2023-04-01",
    nextLeaveAccrualDate: "2025-04-01",
  })

  const grantHistory = getLeaveGrantHistory(user, [
    {
      id: "grant-1",
      userId: user.uid,
      amount: 1,
      workDate: "2024-05-03",
      grantedAt: "2024-05-04T09:00:00.000Z",
      grantedBy: "manager-1",
      grantedByName: "Manager",
    },
  ])

  assert.deepEqual(grantHistory, [
    {
      id: "grant-1",
      date: "2024-05-04",
      createdAt: "2024-05-04T09:00:00.000Z",
      category: "COMPENSATORY",
      days: 1,
      description: "대체휴일 부여",
      workDate: "2024-05-03",
    },
    {
      id: "annual-2024-04-01",
      date: "2024-04-01",
      createdAt: "2024-04-01T00:00:00.000Z",
      category: "ANNUAL",
      days: 15,
      description: "입사일 기준 자동 발생",
    },
    {
      id: "annual-2023-04-01",
      date: "2023-04-01",
      createdAt: "2023-04-01T00:00:00.000Z",
      category: "ANNUAL",
      days: 11,
      description: "입사 초기 부여",
    },
  ])
})
