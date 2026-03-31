import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date) {
  const value = new Date(date)

  return value.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

export function getLeaveTypeLabel(type: string) {
  switch (type) {
    case "ANNUAL":
      return "연차"
    case "HALF_DAY":
      return "반차"
    case "SICK":
      return "병가"
    case "SPECIAL":
      return "특별휴가"
    case "COMPENSATORY":
      return "대체휴일"
    default:
      return "기타"
  }
}

export function getStatusLabel(status: string) {
  switch (status) {
    case "PENDING":
      return "대기 중"
    case "APPROVED":
      return "승인됨"
    case "REJECTED":
      return "반려됨"
    default:
      return status
  }
}

export function calculateAnnualLeave(
  joinDate: string,
  referenceDate = new Date().toISOString().split("T")[0]
): number {
  const join = new Date(joinDate)
  const now = new Date(referenceDate)

  let years = now.getFullYear() - join.getFullYear()
  const monthOffset = now.getMonth() - join.getMonth()

  if (monthOffset < 0 || (monthOffset === 0 && now.getDate() < join.getDate())) {
    years--
  }

  if (years < 1) {
    return 11
  }

  const extraDays = Math.floor((years - 1) / 2)
  return Math.min(25, 15 + extraDays)
}
