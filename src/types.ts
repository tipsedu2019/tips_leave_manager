export type LeaveType =
  | "ANNUAL"
  | "HALF_DAY"
  | "SICK"
  | "SPECIAL"
  | "COMPENSATORY"
  | "OTHER"

export type LeaveStatus = "PENDING" | "APPROVED" | "REJECTED"

export type UserRole = "ADMIN" | "MANAGER" | "EMPLOYEE"

export type AppTab = "dashboard" | "history" | "admin"

export interface CarryoverLeave {
  year: number
  remainingDays: number
}

export interface CarryoverUsage {
  year: number
  days: number
}

export interface LeaveApprovalAdjustment {
  currentYearDays?: number
  carryoverUsage?: CarryoverUsage[]
  compDays?: number
}

export interface LeaveAccrualHistoryEntry {
  accrualDate: string
  grantedDays: number
  kind: "INITIAL" | "ANNIVERSARY"
}

export interface LeaveAccrualEvent extends LeaveAccrualHistoryEntry {
  carriedOverDays: number
}

export interface CompLeaveGrant {
  id: string
  userId: string
  amount: number
  workDate: string
  grantedAt: string
  grantedBy: string
  grantedByName: string
}

export interface LeaveGrantHistoryEntry {
  id: string
  date: string
  createdAt: string
  category: "ANNUAL" | "COMPENSATORY"
  days: number
  description: string
  workDate?: string
}

export interface User {
  uid: string
  email: string
  displayName: string
  role: UserRole
  totalLeave: number
  usedLeave: number
  totalCompLeave: number
  usedCompLeave: number
  joinDate: string
  carryoverLeaves: CarryoverLeave[]
  nextLeaveAccrualDate: string
}

export interface LeaveRequest {
  id: string
  userId: string
  userName: string
  type: LeaveType
  startDate: string
  endDate: string
  reason?: string
  status: LeaveStatus
  createdAt: string
  adminComment?: string
  daysCount: number
  approvalAdjustment?: LeaveApprovalAdjustment
}

export interface AppNotification {
  id: string
  userId: string
  actorId: string
  title: string
  message: string
  createdAt: string
  readAt?: string
  linkTab?: AppTab
}

export interface AdminLog {
  id: string
  adminId: string
  adminName: string
  targetUserId: string
  targetUserName: string
  action:
    | "GRANT_COMP"
    | "ADJUST_LEAVE"
    | "APPROVE_LEAVE"
    | "REJECT_LEAVE"
    | "CANCEL_APPROVAL"
    | "SET_ROLE"
  details: string
  createdAt: string
}
