import { UserRole } from "../types"

export function isPrivilegedRole(role: UserRole) {
  return role === "ADMIN" || role === "MANAGER"
}

export function canViewLeaveReason(role: UserRole) {
  return isPrivilegedRole(role)
}

export function getRoleLabel(role: UserRole) {
  switch (role) {
    case "ADMIN":
      return "최고관리자"
    case "MANAGER":
      return "부관리자"
    default:
      return "직원"
  }
}
