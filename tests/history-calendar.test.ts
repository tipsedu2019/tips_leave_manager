import test from "node:test"
import assert from "node:assert/strict"

import {
  getCalendarDayClassName,
  getMobileCalendarDaySummary,
  getTodayBadgeClassName,
} from "../src/lib/history-calendar"
import { LeaveRequest } from "../src/types"

test("mobile calendar summary stays compact when there are no requests", () => {
  assert.equal(getMobileCalendarDaySummary([]), "")
})

test("mobile calendar summary shows a single request name", () => {
  const requests: LeaveRequest[] = [
    {
      id: "request-1",
      userId: "user-1",
      userName: "강부희",
      type: "ANNUAL",
      startDate: "2026-04-01",
      endDate: "2026-04-01",
      status: "APPROVED",
      createdAt: "2026-03-31T00:00:00.000Z",
      daysCount: 1,
    },
  ]

  assert.equal(getMobileCalendarDaySummary(requests), "강부희")
})

test("mobile calendar summary collapses multiple requests into a count", () => {
  const requests: LeaveRequest[] = [
    {
      id: "request-1",
      userId: "user-1",
      userName: "강부희",
      type: "ANNUAL",
      startDate: "2026-04-01",
      endDate: "2026-04-01",
      status: "APPROVED",
      createdAt: "2026-03-31T00:00:00.000Z",
      daysCount: 1,
    },
    {
      id: "request-2",
      userId: "user-2",
      userName: "임현준",
      type: "HALF_DAY",
      startDate: "2026-04-01",
      endDate: "2026-04-01",
      status: "PENDING",
      createdAt: "2026-03-31T01:00:00.000Z",
      daysCount: 0.5,
    },
  ]

  assert.equal(getMobileCalendarDaySummary(requests), "2명")
})

test("calendar class names switch by month visibility and today state", () => {
  assert.match(getCalendarDayClassName(true, false), /bg-white/)
  assert.match(getCalendarDayClassName(false, false), /bg-muted\/20/)
  assert.match(getCalendarDayClassName(true, true), /border-black/)
})

test("today badge classes keep the label compact and horizontal on mobile", () => {
  assert.match(getTodayBadgeClassName(), /inline-flex/)
  assert.match(getTodayBadgeClassName(), /whitespace-nowrap/)
  assert.match(getTodayBadgeClassName(), /text-\[9px\]/)
})
