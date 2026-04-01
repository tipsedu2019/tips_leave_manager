import { LeaveRequest } from "../types"

export function getMobileCalendarDaySummary(requests: LeaveRequest[]) {
  if (requests.length === 0) {
    return ""
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

export function getTodayBadgeClassName() {
  return [
    "inline-flex",
    "whitespace-nowrap",
    "rounded-full",
    "bg-black",
    "px-1.5",
    "py-0.5",
    "text-[9px]",
    "leading-none",
    "text-white",
    "sm:px-2",
    "sm:text-[10px]",
  ].join(" ")
}
