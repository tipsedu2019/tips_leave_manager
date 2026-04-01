import test from "node:test"
import assert from "node:assert/strict"

import {
  getDefaultRequestDurationUnit,
  getLeaveRequestDaysCount,
} from "../src/lib/leave-requests"

test("half day annual leave stays at 0.5 day", () => {
  assert.equal(
    getLeaveRequestDaysCount({
      type: "HALF_DAY",
      startDate: "2026-04-01",
      endDate: "2026-04-01",
    }),
    0.5
  )
})

test("compensatory leave can also be submitted as a half day", () => {
  assert.equal(
    getLeaveRequestDaysCount({
      type: "COMPENSATORY",
      startDate: "2026-04-01",
      endDate: "2026-04-01",
      durationUnit: "HALF_DAY",
    }),
    0.5
  )
})

test("half day requests require a single date", () => {
  assert.throws(
    () =>
      getLeaveRequestDaysCount({
        type: "COMPENSATORY",
        startDate: "2026-04-01",
        endDate: "2026-04-02",
        durationUnit: "HALF_DAY",
      }),
    /SINGLE_DAY_ONLY/
  )
})

test("full day compensatory leave still uses the calendar range", () => {
  assert.equal(
    getLeaveRequestDaysCount({
      type: "COMPENSATORY",
      startDate: "2026-04-01",
      endDate: "2026-04-02",
      durationUnit: "FULL_DAY",
    }),
    2
  )
})

test("editing defaults a half-day compensatory request back to half-day mode", () => {
  assert.equal(
    getDefaultRequestDurationUnit({
      type: "COMPENSATORY",
      daysCount: 0.5,
    }),
    "HALF_DAY"
  )
})

test("editing keeps full-day mode for regular compensatory requests", () => {
  assert.equal(
    getDefaultRequestDurationUnit({
      type: "COMPENSATORY",
      daysCount: 1,
    }),
    "FULL_DAY"
  )
})
