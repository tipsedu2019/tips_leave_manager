import test from "node:test"
import assert from "node:assert/strict"

import { getStatusLabel } from "../src/lib/utils"

test("getStatusLabel shows pending requests as approval pending", () => {
  assert.equal(getStatusLabel("PENDING"), "승인 대기 중")
})
