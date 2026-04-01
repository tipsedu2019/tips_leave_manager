import { UserRole } from "../types"
import { getRoleLabel as getDisplayRoleLabel } from "./display-labels"

export function isPrivilegedRole(role: UserRole) {
  return role === "ADMIN" || role === "MANAGER"
}

export function canViewLeaveReason(role: UserRole) {
  return isPrivilegedRole(role)
}

export function getRoleLabel(role: UserRole) {
  return getDisplayRoleLabel(role)
}
