import test from "node:test"
import assert from "node:assert/strict"

import { filterActiveUsers } from "../src/lib/admin-users"
import { User } from "../src/types"

function createUser(uid: string, displayName: string): User {
  return {
    uid,
    email: `${uid}@example.com`,
    displayName,
    role: "EMPLOYEE",
    totalLeave: 11,
    usedLeave: 0,
    totalCompLeave: 0,
    usedCompLeave: 0,
    joinDate: "2026-04-01",
    carryoverLeaves: [],
    nextLeaveAccrualDate: "2027-04-01",
  }
}

test("filterActiveUsers leaves all users when no blocked ids exist", () => {
  const users = [createUser("a", "A"), createUser("b", "B")]

  assert.deepEqual(filterActiveUsers(users, []), users)
})

test("filterActiveUsers removes blocked users from the admin list", () => {
  const users = [createUser("a", "A"), createUser("b", "B"), createUser("c", "C")]

  assert.deepEqual(
    filterActiveUsers(users, ["b", "c"]).map((user) => user.uid),
    ["a"]
  )
})
