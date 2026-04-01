import React from "react"

import { Badge } from "@/components/ui/badge"
import { cn, getStatusLabel } from "../lib/utils"
import { getRoleLabel } from "../lib/roles"
import { AdminLog, LeaveRequest, User } from "../types"

export function formatDays(value: number) {
  return Number.isInteger(value) ? `${value}` : value.toFixed(1)
}

export function getDisplayInitial(name: string) {
  return name.trim().charAt(0) || "?"
}

export function getNavButtonClassName(active: boolean) {
  return cn(
    "group/nav inline-flex min-h-11 items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-all duration-200",
    "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
    active
      ? "border-black bg-black text-white shadow-[0_14px_30px_-18px_rgba(0,0,0,0.9)]"
      : "border-black/10 bg-transparent text-muted-foreground hover:bg-white hover:text-black hover:shadow-[0_10px_24px_-20px_rgba(0,0,0,0.7)]"
  )
}

export function NavButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
}) {
  return (
    <button onClick={onClick} className={getNavButtonClassName(active)}>
      <span
        className={cn(
          "inline-flex size-6 items-center justify-center rounded-full transition-colors",
          active ? "bg-white/14 text-white" : "bg-black/5 text-muted-foreground group-hover/nav:text-black"
        )}
      >
        {icon}
      </span>
      <span>{label}</span>
    </button>
  )
}

export function StatCard({
  title,
  value,
  unit,
  description,
  highlight = false,
}: {
  title: string
  value: number
  unit: string
  description: string
  highlight?: boolean
}) {
  return (
    <div
      className={cn(
        "rounded-[28px] border px-5 py-5 shadow-[0_24px_70px_-42px_rgba(15,23,42,0.42)] backdrop-blur-sm",
        highlight
          ? "border-black bg-black text-white"
          : "border-black/10 bg-white/88 text-black"
      )}
    >
      <p
        className={cn(
          "text-[11px] font-semibold uppercase tracking-[0.22em]",
          highlight ? "text-white/70" : "text-muted-foreground"
        )}
      >
        {title}
      </p>
      <div className="mt-4 flex items-end gap-1">
        <span className="text-4xl font-semibold tracking-[-0.05em]">{formatDays(value)}</span>
        <span className={cn("pb-1 text-sm", highlight ? "text-white/70" : "text-muted-foreground")}>
          {unit}
        </span>
      </div>
      <p
        className={cn(
          "mt-4 text-sm leading-6",
          highlight ? "text-white/75" : "text-muted-foreground"
        )}
      >
        {description}
      </p>
    </div>
  )
}

export function getStatusBadgeClassName(status: LeaveRequest["status"]) {
  switch (status) {
    case "PENDING":
      return "border-amber-200 bg-amber-50 text-amber-700"
    case "APPROVED":
      return "border-emerald-200 bg-emerald-50 text-emerald-700"
    case "REJECTED":
      return "border-rose-200 bg-rose-50 text-rose-700"
    default:
      return "border-border bg-transparent text-foreground"
  }
}

export function StatusBadge({ status }: { status: LeaveRequest["status"] }) {
  return (
    <Badge variant="secondary" className={cn("font-normal", getStatusBadgeClassName(status))}>
      {getStatusLabel(status)}
    </Badge>
  )
}

export function getRoleBadgeClassName(role: User["role"]) {
  switch (role) {
    case "ADMIN":
      return "border-black bg-black text-white"
    case "MANAGER":
      return "border-border bg-secondary text-foreground"
    default:
      return "border-border bg-transparent text-muted-foreground"
  }
}

export function RoleBadge({ role }: { role: User["role"] }) {
  return (
    <Badge variant="outline" className={cn("font-normal", getRoleBadgeClassName(role))}>
      {getRoleLabel(role)}
    </Badge>
  )
}

export function getAdminActionLabel(action: AdminLog["action"]) {
  switch (action) {
    case "GRANT_COMP":
      return "대체휴일 부여"
    case "ADJUST_LEAVE":
      return "연차 조정"
    case "APPROVE_LEAVE":
      return "휴가 승인"
    case "REJECT_LEAVE":
      return "휴가 반려"
    case "CANCEL_APPROVAL":
      return "승인 취소"
    case "DELETE_USER":
      return "직원 삭제"
    case "SET_ROLE":
      return "권한 변경"
    default:
      return action
  }
}
