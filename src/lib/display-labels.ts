import { LeaveType, UserRole } from "../types"

export const LEAVE_TYPE_OPTIONS: Array<{ value: LeaveType; label: string }> = [
  { value: "ANNUAL", label: "연차" },
  { value: "HALF_DAY", label: "반차" },
  { value: "COMPENSATORY", label: "대체휴일" },
  { value: "SICK", label: "병가" },
  { value: "SPECIAL", label: "경조사" },
  { value: "OTHER", label: "기타" },
]

export const ROLE_OPTIONS: Array<{ value: UserRole; label: string }> = [
  { value: "ADMIN", label: "최고관리자" },
  { value: "MANAGER", label: "관리자" },
  { value: "EMPLOYEE", label: "직원" },
]

export function getLeaveTypeLabel(type: string) {
  return LEAVE_TYPE_OPTIONS.find((option) => option.value === type)?.label ?? "기타"
}

export function getRoleLabel(role: UserRole) {
  return ROLE_OPTIONS.find((option) => option.value === role)?.label ?? "직원"
}
