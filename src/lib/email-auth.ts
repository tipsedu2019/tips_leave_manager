export type EmailAuthMode = "SIGN_IN" | "SIGN_UP"
export type EmailAuthAction = "SIGN_IN" | "SIGN_UP" | "RESET" | "LINK"

export function hasPasswordProvider(providerIds: string[]) {
  return providerIds.includes("password")
}

export function canLinkEmailPassword(email: string | null | undefined, providerIds: string[]) {
  return Boolean(email) && !hasPasswordProvider(providerIds)
}

export function getEmailAuthSubmitLabel(mode: EmailAuthMode) {
  return mode === "SIGN_UP" ? "이메일로 가입하기" : "이메일로 로그인하기"
}

export function getEmailAuthModeDescription(mode: EmailAuthMode) {
  return mode === "SIGN_UP"
    ? "이름, 이메일, 비밀번호를 입력해 새 계정을 만듭니다."
    : "Google 로그인 없이 이메일과 비밀번호로 바로 로그인합니다."
}

export function getEmailAuthErrorMessage(code: string, action: EmailAuthAction) {
  switch (code) {
    case "auth/invalid-email":
      return "이메일 형식이 올바르지 않습니다."
    case "auth/operation-not-allowed":
      return "Firebase Authentication에서 이메일/비밀번호 로그인을 먼저 활성화해 주세요."
    case "auth/email-already-in-use":
      return action === "LINK"
        ? "이미 다른 계정에서 사용 중인 이메일입니다."
        : "이미 가입된 이메일입니다. 로그인하거나 비밀번호 재설정을 이용해 주세요."
    case "auth/weak-password":
      return "비밀번호는 6자 이상으로 입력해 주세요."
    case "auth/missing-password":
      return "비밀번호를 입력해 주세요."
    case "auth/user-disabled":
      return "비활성화된 계정입니다. 관리자에게 문의해 주세요."
    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-credential":
    case "auth/invalid-login-credentials":
      return action === "SIGN_IN"
        ? "이메일 또는 비밀번호가 올바르지 않습니다."
        : "인증 정보를 확인할 수 없습니다. 다시 시도해 주세요."
    case "auth/provider-already-linked":
      return "이미 이메일 로그인이 설정된 계정입니다."
    case "auth/network-request-failed":
      return "네트워크 상태를 확인한 뒤 다시 시도해 주세요."
    default:
      return action === "RESET"
        ? "비밀번호 재설정 메일을 보내지 못했습니다. 잠시 후 다시 시도해 주세요."
        : "이메일 로그인 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요."
  }
}
