import test from "node:test"
import assert from "node:assert/strict"

import {
  getEmbeddedBrowserName,
  isUnsupportedEmbeddedBrowser,
} from "../src/lib/auth-login"

test("detects KakaoTalk in-app browser as unsupported for Google login", () => {
  const kakaoTalkUserAgent =
    "Mozilla/5.0 (Linux; Android 13; SM-S918N Build/TP1A.220624.014; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/131.0.0.0 Mobile Safari/537.36 KAKAOTALK 11.0.3"

  assert.equal(getEmbeddedBrowserName(kakaoTalkUserAgent), "카카오톡")
  assert.equal(isUnsupportedEmbeddedBrowser(kakaoTalkUserAgent), true)
})

test("detects generic Android webview as unsupported for Google login", () => {
  const webViewUserAgent =
    "Mozilla/5.0 (Linux; Android 14; Pixel 8 Build/UP1A.240105.004; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/135.0.0.0 Mobile Safari/537.36"

  assert.equal(getEmbeddedBrowserName(webViewUserAgent), "인앱 브라우저")
  assert.equal(isUnsupportedEmbeddedBrowser(webViewUserAgent), true)
})

test("does not flag regular Chrome mobile as unsupported", () => {
  const chromeMobileUserAgent =
    "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Mobile Safari/537.36"

  assert.equal(getEmbeddedBrowserName(chromeMobileUserAgent), null)
  assert.equal(isUnsupportedEmbeddedBrowser(chromeMobileUserAgent), false)
})
