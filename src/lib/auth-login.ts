const EMBEDDED_BROWSER_PATTERNS: Array<{ name: string; pattern: RegExp }> = [
  { name: "카카오톡", pattern: /KAKAOTALK/i },
  { name: "인스타그램", pattern: /Instagram/i },
  { name: "페이스북", pattern: /FBAN|FBAV/i },
  { name: "인앱 브라우저", pattern: /;\s*wv\)|Version\/4\.0/i },
]

export function getEmbeddedBrowserName(userAgent: string) {
  for (const embeddedBrowser of EMBEDDED_BROWSER_PATTERNS) {
    if (embeddedBrowser.pattern.test(userAgent)) {
      return embeddedBrowser.name
    }
  }

  return null
}

export function isUnsupportedEmbeddedBrowser(userAgent: string) {
  return getEmbeddedBrowserName(userAgent) !== null
}
