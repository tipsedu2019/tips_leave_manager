import test from "node:test"
import assert from "node:assert/strict"

import { canViewLeaveReason, getRoleLabel, isPrivilegedRole } from "../src/lib/roles"

test("manager has the same privileged access as admin", () => {
  assert.equal(isPrivilegedRole("ADMIN"), true)
  assert.equal(isPrivilegedRole("MANAGER"), true)
  assert.equal(isPrivilegedRole("EMPLOYEE"), false)
})

test("leave reasons are visible only to admin and manager", () => {
  assert.equal(canViewLeaveReason("ADMIN"), true)
  assert.equal(canViewLeaveReason("MANAGER"), true)
  assert.equal(canViewLeaveReason("EMPLOYEE"), false)
})

test("role labels are localized for display", () => {
  assert.equal(getRoleLabel("ADMIN"), "최고관리자")
  assert.equal(getRoleLabel("MANAGER"), "부관리자")
  assert.equal(getRoleLabel("EMPLOYEE"), "직원")
})
