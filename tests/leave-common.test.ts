import test from "node:test"
import assert from "node:assert/strict"

import {
  getNavButtonClassName,
  getRoleBadgeClassName,
  getStatusBadgeClassName,
} from "../src/components/leave-common"

test("active nav buttons use the primary token in a rounded pill treatment", () => {
  const className = getNavButtonClassName(true)

  assert.match(className, /rounded-full/)
  assert.match(className, /bg-primary/)
  assert.match(className, /text-primary-foreground/)
})

test("inactive nav buttons keep a softer accent hover treatment", () => {
  const className = getNavButtonClassName(false)

  assert.match(className, /text-muted-foreground/)
  assert.match(className, /hover:bg-accent/)
})

test("role badge tones differentiate privileged roles with semantic tokens", () => {
  assert.match(getRoleBadgeClassName("ADMIN"), /bg-primary/)
  assert.match(getRoleBadgeClassName("MANAGER"), /bg-secondary/)
  assert.match(getRoleBadgeClassName("EMPLOYEE"), /bg-background/)
})

test("status badge tones stay mapped to pending, approved, rejected", () => {
  assert.match(getStatusBadgeClassName("PENDING"), /bg-amber-50/)
  assert.match(getStatusBadgeClassName("APPROVED"), /bg-emerald-50/)
  assert.match(getStatusBadgeClassName("REJECTED"), /bg-rose-50/)
})
