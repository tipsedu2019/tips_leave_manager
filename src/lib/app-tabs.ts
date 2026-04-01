import { AppTab } from "../types"

export const APP_TAB_LABELS: Record<AppTab, string> = {
  dashboard: "대시보드",
  history: "휴가 현황",
  admin: "관리 도구",
}

export function getAvailableAppTabs(canManage: boolean): AppTab[] {
  return canManage ? ["dashboard", "history", "admin"] : ["dashboard", "history"]
}
