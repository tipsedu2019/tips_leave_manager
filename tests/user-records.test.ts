import test from "node:test"
import assert from "node:assert/strict"

import { mergeUserRecord, normalizeUserRecord } from "../src/lib/user-records"

test("normalizeUserRecord defaults missing compensatory leave fields to zero", () => {
  const normalized = normalizeUserRecord({
    uid: "user-1",
    email: "user@example.com",
    displayName: "Tester",
    role: "EMPLOYEE",
    totalLeave: 15,
    usedLeave: 3,
    joinDate: "2025-01-01",
  })

  assert.equal(normalized.totalCompLeave, 0)
  assert.equal(normalized.usedCompLeave, 0)
  assert.deepEqual(normalized.carryoverLeaves, [])
  assert.match(normalized.nextLeaveAccrualDate, /^\d{4}-\d{2}-\d{2}$/)
})

test("normalizeUserRecord preserves existing leave balances", () => {
  const normalized = normalizeUserRecord({
    uid: "user-2",
    email: "user2@example.com",
    displayName: "Tester 2",
    role: "ADMIN",
    totalLeave: 18,
    usedLeave: 4,
    totalCompLeave: 2,
    usedCompLeave: 0.5,
    joinDate: "2023-03-01",
  })

  assert.equal(normalized.totalLeave, 18)
  assert.equal(normalized.usedLeave, 4)
  assert.equal(normalized.totalCompLeave, 2)
  assert.equal(normalized.usedCompLeave, 0.5)
})

test("mergeUserRecord preserves required firestore fields when changing role", () => {
  const existing = normalizeUserRecord({
    uid: "user-3",
    email: "user3@example.com",
    displayName: "Tester 3",
    role: "EMPLOYEE",
    joinDate: "2024-04-01",
    totalLeave: 15,
    usedLeave: 2,
  })

  const merged = mergeUserRecord(existing, {
    role: "MANAGER",
  })

  assert.equal(merged.role, "MANAGER")
  assert.equal(merged.uid, existing.uid)
  assert.equal(merged.email, existing.email)
  assert.equal(merged.displayName, existing.displayName)
  assert.equal(merged.totalLeave, existing.totalLeave)
  assert.equal(merged.usedLeave, existing.usedLeave)
  assert.equal(merged.totalCompLeave, 0)
  assert.equal(merged.usedCompLeave, 0)
  assert.deepEqual(merged.carryoverLeaves, [])
  assert.match(merged.nextLeaveAccrualDate, /^\d{4}-\d{2}-\d{2}$/)
})

test("mergeUserRecord keeps prior balances when adjusting join date and totals", () => {
  const existing = normalizeUserRecord({
    uid: "user-4",
    email: "user4@example.com",
    displayName: "Tester 4",
    role: "EMPLOYEE",
    joinDate: "2023-04-01",
    totalLeave: 16,
    usedLeave: 4,
    totalCompLeave: 3,
    usedCompLeave: 1,
    carryoverLeaves: [{ year: 2024, remainingDays: 2 }],
    nextLeaveAccrualDate: "2026-04-01",
  })

  const merged = mergeUserRecord(existing, {
    joinDate: "2022-04-01",
    totalLeave: 17,
    totalCompLeave: 5,
    nextLeaveAccrualDate: "2027-04-01",
  })

  assert.equal(merged.joinDate, "2022-04-01")
  assert.equal(merged.totalLeave, 17)
  assert.equal(merged.totalCompLeave, 5)
  assert.equal(merged.usedLeave, 4)
  assert.equal(merged.usedCompLeave, 1)
  assert.deepEqual(merged.carryoverLeaves, [{ year: 2024, remainingDays: 2 }])
  assert.equal(merged.nextLeaveAccrualDate, "2027-04-01")
})
