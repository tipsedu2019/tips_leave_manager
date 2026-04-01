import test from "node:test"
import assert from "node:assert/strict"

import { getAvailableAppTabs } from "../src/lib/app-tabs"

test("employees only see dashboard and history tabs", () => {
  assert.deepEqual(getAvailableAppTabs(false), ["dashboard", "history"])
})

test("privileged users also see the admin tab", () => {
  assert.deepEqual(getAvailableAppTabs(true), ["dashboard", "history", "admin"])
})
