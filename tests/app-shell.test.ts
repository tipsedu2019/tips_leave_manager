import test from "node:test"
import assert from "node:assert/strict"

import {
  getHeaderActionGroupClassName,
  getUserMetaClassName,
  getUserNameClassName,
  getUserRoleClassName,
} from "../src/lib/app-shell"

test("header action group keeps tight spacing on mobile without losing width", () => {
  const className = getHeaderActionGroupClassName()

  assert.match(className, /min-w-0/)
  assert.match(className, /gap-2/)
  assert.match(className, /sm:gap-4/)
})

test("user meta block stays compact in the mobile header", () => {
  assert.match(getUserMetaClassName(), /leading-tight/)
  assert.match(getUserNameClassName(), /truncate/)
  assert.match(getUserRoleClassName(), /whitespace-nowrap/)
  assert.match(getUserRoleClassName(), /text-\[11px\]/)
})
