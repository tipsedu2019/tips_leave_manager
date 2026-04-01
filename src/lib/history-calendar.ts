import { LeaveRequest } from "../types"

export function getMobileCalendarDaySummary(requests: LeaveRequest[]) {
  if (requests.length === 0) {
    return "일정 없음"
  }

  if (requests.length === 1) {
    return requests[0].userName
  }

  return `${requests.length}명`
}

export function getCalendarDayClassName(isCurrentMonth: boolean, isCurrentDay: boolean) {
  return [
    "rounded-2xl border p-2 sm:p-3",
    "min-h-24 sm:min-h-36",
    isCurrentMonth ? "bg-white" : "bg-muted/20",
    isCurrentDay ? "border-black" : "border-border",
  ].join(" ")
}
