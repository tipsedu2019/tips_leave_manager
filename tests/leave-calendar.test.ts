import test from "node:test"
import assert from "node:assert/strict"

import { getRequestsForDate } from "../src/lib/leave-calendar"
import { LeaveRequest } from "../src/types"

const requests: LeaveRequest[] = [
  {
    id: "1",
    userId: "a",
    userName: "Kim",
    type: "ANNUAL",
    startDate: "2026-04-01",
    endDate: "2026-04-03",
    status: "APPROVED",
    createdAt: "2026-03-20T00:00:00.000Z",
    daysCount: 3,
  },
  {
    id: "2",
    userId: "b",
    userName: "Lee",
    type: "HALF_DAY",
    startDate: "2026-04-02",
    endDate: "2026-04-02",
    status: "PENDING",
    createdAt: "2026-03-21T00:00:00.000Z",
    daysCount: 0.5,
  },
  {
    id: "3",
    userId: "c",
    userName: "Park",
    type: "SICK",
    startDate: "2026-04-02",
    endDate: "2026-04-04",
    status: "REJECTED",
    createdAt: "2026-03-22T00:00:00.000Z",
    daysCount: 3,
  },
]

test("getRequestsForDate returns overlapping approved and pending requests only", () => {
  assert.deepEqual(
    getRequestsForDate(requests, "2026-04-02").map((request) => request.id),
    ["1", "2"]
  )
  assert.deepEqual(
    getRequestsForDate(requests, "2026-04-05").map((request) => request.id),
    []
  )
})
