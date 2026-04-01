import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

import { getLeaveTypeLabel as getDisplayLeaveTypeLabel } from "./display-labels"

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

export function formatDateTime(date: string | Date) {
  const value = new Date(date)

  return value.toLocaleString("ko-KR", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function getLeaveTypeLabel(type: string) {
  return getDisplayLeaveTypeLabel(type)
}

export function getStatusLabel(status: string) {
  switch (status) {
    case "PENDING":
      return "승인 대기 중"
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
