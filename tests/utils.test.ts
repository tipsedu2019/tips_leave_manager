import test from "node:test"
import assert from "node:assert/strict"

import { getLeaveTypeLabel, getStatusLabel } from "../src/lib/utils"

test("getStatusLabel shows pending requests as approval pending", () => {
  assert.equal(getStatusLabel("PENDING"), "승인 대기 중")
})

test("getLeaveTypeLabel localizes all leave types in Korean", () => {
  assert.equal(getLeaveTypeLabel("ANNUAL"), "연차")
  assert.equal(getLeaveTypeLabel("HALF_DAY"), "반차")
  assert.equal(getLeaveTypeLabel("COMPENSATORY"), "대체휴일")
  assert.equal(getLeaveTypeLabel("SICK"), "병가")
  assert.equal(getLeaveTypeLabel("SPECIAL"), "경조사")
  assert.equal(getLeaveTypeLabel("OTHER"), "기타")
})
