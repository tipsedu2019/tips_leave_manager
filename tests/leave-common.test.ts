import test from "node:test"
import assert from "node:assert/strict"

import {
  getNavButtonClassName,
  getRoleBadgeClassName,
  getStatusBadgeClassName,
} from "../src/components/leave-common"

test("active nav buttons use a solid rounded pill treatment", () => {
  const className = getNavButtonClassName(true)

  assert.match(className, /rounded-full/)
  assert.match(className, /bg-black/)
  assert.match(className, /text-white/)
})

test("inactive nav buttons keep a lighter hover treatment", () => {
  const className = getNavButtonClassName(false)

  assert.match(className, /text-muted-foreground/)
  assert.match(className, /hover:bg-white/)
})

test("role badge tones differentiate privileged roles", () => {
  assert.match(getRoleBadgeClassName("ADMIN"), /bg-black/)
  assert.match(getRoleBadgeClassName("MANAGER"), /bg-secondary/)
  assert.match(getRoleBadgeClassName("EMPLOYEE"), /bg-transparent/)
})

test("status badge tones stay mapped to pending, approved, rejected", () => {
  assert.match(getStatusBadgeClassName("PENDING"), /bg-amber-50/)
  assert.match(getStatusBadgeClassName("APPROVED"), /bg-emerald-50/)
  assert.match(getStatusBadgeClassName("REJECTED"), /bg-rose-50/)
})
