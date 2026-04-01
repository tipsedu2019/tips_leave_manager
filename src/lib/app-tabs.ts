import { AppTab } from "../types"

export function getAvailableAppTabs(canManage: boolean): AppTab[] {
  return canManage ? ["dashboard", "history", "admin"] : ["dashboard", "history"]
}
