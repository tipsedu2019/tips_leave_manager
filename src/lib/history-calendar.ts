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
    "relative flex flex-col rounded-[24px] border px-2.5 py-2.5 transition-colors sm:rounded-[28px] sm:px-3 sm:py-3",
    "min-h-[104px] sm:min-h-[164px]",
    isCurrentMonth ? "border-black/10 bg-white/90" : "border-black/6 bg-[#f5f1ea]/70",
    isCurrentDay
      ? "border-black shadow-[0_24px_45px_-34px_rgba(15,23,42,0.6)]"
      : "shadow-[0_18px_36px_-36px_rgba(15,23,42,0.35)]",
  ].join(" ")
}

export function getTodayBadgeClassName() {
  return [
    "inline-flex",
    "items-center",
    "justify-center",
    "whitespace-nowrap",
    "rounded-full",
    "bg-black",
    "px-1.5",
    "py-0.5",
    "text-[9px]",
    "font-medium",
    "leading-none",
    "tracking-[0.08em]",
    "text-white",
    "sm:px-2",
    "sm:text-[10px]",
  ].join(" ")
}
