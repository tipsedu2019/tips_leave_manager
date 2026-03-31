export type LeaveType = 'ANNUAL' | 'HALF_DAY' | 'SICK' | 'SPECIAL' | 'COMPENSATORY' | 'OTHER';

export type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export type UserRole = 'ADMIN' | 'MANAGER' | 'EMPLOYEE';

export interface CarryoverLeave {
  year: number;
  remainingDays: number;
}

export interface User {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  totalLeave: number;
  usedLeave: number;
  totalCompLeave: number;
  usedCompLeave: number;
  joinDate: string;
  carryoverLeaves: CarryoverLeave[];
  nextLeaveAccrualDate: string;
}

export interface LeaveRequest {
  id: string;
  userId: string;
  userName: string;
  type: LeaveType;
  startDate: string;
  endDate: string;
  reason?: string;
  status: LeaveStatus;
  createdAt: string;
  adminComment?: string;
  daysCount: number;
}

export interface AdminLog {
  id: string;
  adminId: string;
  adminName: string;
  targetUserId: string;
  targetUserName: string;
  action: 'GRANT_COMP' | 'ADJUST_LEAVE' | 'APPROVE_LEAVE' | 'REJECT_LEAVE' | 'SET_ROLE';
  details: string;
  createdAt: string;
}
