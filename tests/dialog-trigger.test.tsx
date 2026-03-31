import test from "node:test"
import assert from "node:assert/strict"
import React from "react"
import { renderToStaticMarkup } from "react-dom/server"

import { Button } from "../components/ui/button"
import { Dialog, DialogTrigger } from "../components/ui/dialog"

test("DialogTrigger asChild renders a single button trigger", () => {
  const markup = renderToStaticMarkup(
    <Dialog>
      <DialogTrigger asChild>
        <Button>Open</Button>
      </DialogTrigger>
    </Dialog>
  )

  assert.equal((markup.match(/<button/g) ?? []).length, 1)
})
