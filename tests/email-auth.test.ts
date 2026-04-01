import test from "node:test"
import assert from "node:assert/strict"

import {
  canLinkEmailPassword,
  getEmailAuthErrorMessage,
  getEmailAuthModeDescription,
  getEmailAuthSubmitLabel,
  hasPasswordProvider,
} from "../src/lib/email-auth"

test("password provider detection works from provider ids", () => {
  assert.equal(hasPasswordProvider(["google.com"]), false)
  assert.equal(hasPasswordProvider(["google.com", "password"]), true)
})

test("email-password linking is available only when email exists and password is not linked", () => {
  assert.equal(canLinkEmailPassword("user@example.com", ["google.com"]), true)
  assert.equal(canLinkEmailPassword("user@example.com", ["google.com", "password"]), false)
  assert.equal(canLinkEmailPassword("", ["google.com"]), false)
})

test("email auth labels stay localized", () => {
  assert.equal(getEmailAuthSubmitLabel("SIGN_IN"), "이메일로 로그인하기")
  assert.equal(getEmailAuthSubmitLabel("SIGN_UP"), "이메일로 가입하기")
  assert.equal(
    getEmailAuthModeDescription("SIGN_IN"),
    "Google 로그인 없이 이메일과 비밀번호로 바로 로그인합니다."
  )
})

test("email auth error messages stay user-friendly", () => {
  assert.equal(
    getEmailAuthErrorMessage("auth/operation-not-allowed", "SIGN_IN"),
    "Firebase Authentication에서 이메일/비밀번호 로그인을 먼저 활성화해 주세요."
  )
  assert.equal(
    getEmailAuthErrorMessage("auth/email-already-in-use", "SIGN_UP"),
    "이미 가입된 이메일입니다. 로그인하거나 비밀번호 재설정을 이용해 주세요."
  )
  assert.equal(
    getEmailAuthErrorMessage("auth/provider-already-linked", "LINK"),
    "이미 이메일 로그인이 설정된 계정입니다."
  )
})
