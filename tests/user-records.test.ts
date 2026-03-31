import test from "node:test"
import assert from "node:assert/strict"

import { normalizeUserRecord } from "../src/lib/user-records"

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
