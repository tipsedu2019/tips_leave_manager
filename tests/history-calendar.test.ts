import test from "node:test"
import assert from "node:assert/strict"

import {
  getCalendarDayHeaderClassName,
  getCalendarDayClassName,
  getCalendarMonthSwitcherWrapperClassName,
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
  assert.match(getCalendarDayClassName(true, false), /bg-white\/90/)
  assert.match(getCalendarDayClassName(false, false), /bg-\[#f5f1ea\]\/70/)
  assert.match(getCalendarDayClassName(true, true), /border-black/)
})

test("calendar month switcher stays centered on mobile", () => {
  const className = getCalendarMonthSwitcherWrapperClassName()

  assert.match(className, /justify-center/)
  assert.match(className, /lg:justify-end/)
})

test("calendar day header stacks date and today badge on mobile", () => {
  const className = getCalendarDayHeaderClassName()

  assert.match(className, /flex-col/)
  assert.match(className, /items-start/)
  assert.match(className, /sm:flex-row/)
})

test("today badge classes keep the label compact and horizontal on mobile", () => {
  const className = getTodayBadgeClassName()

  assert.match(className, /inline-flex/)
  assert.match(className, /self-start/)
  assert.match(className, /whitespace-nowrap/)
  assert.match(className, /text-\[8px\]/)
  assert.match(className, /sm:tracking-\[0\.08em\]/)
})
