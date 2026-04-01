import test from "node:test"
import assert from "node:assert/strict"

import { APP_TAB_LABELS, getAvailableAppTabs } from "../src/lib/app-tabs"

test("employees only see dashboard and history tabs", () => {
  assert.deepEqual(getAvailableAppTabs(false), ["dashboard", "history"])
})

test("privileged users also see the admin tab", () => {
  assert.deepEqual(getAvailableAppTabs(true), ["dashboard", "history", "admin"])
})

test("tab labels are localized for the app shell", () => {
  assert.deepEqual(APP_TAB_LABELS, {
    dashboard: "대시보드",
    history: "휴가 현황",
    admin: "관리 도구",
  })
})
