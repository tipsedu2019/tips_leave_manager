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
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-black text-white"
          : "text-muted-foreground hover:bg-muted hover:text-black"
      )}
    >
      {icon}
      {label}
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
        "rounded-3xl border bg-white p-6 shadow-sm",
        highlight && "border-black"
      )}
    >
      <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
        {title}
      </p>
      <div className="mt-2 flex items-end gap-1">
        <span className="text-3xl font-bold tracking-tight">{formatDays(value)}</span>
        <span className="pb-1 text-sm text-muted-foreground">{unit}</span>
      </div>
      <p className="mt-2 text-xs leading-5 text-muted-foreground">{description}</p>
    </div>
  )
}

export function StatusBadge({ status }: { status: LeaveRequest["status"] }) {
  switch (status) {
    case "PENDING":
      return (
        <Badge
          variant="secondary"
          className="border-yellow-200 bg-yellow-50 font-normal text-yellow-700"
        >
          {getStatusLabel(status)}
        </Badge>
      )
    case "APPROVED":
      return (
        <Badge
          variant="secondary"
          className="border-green-200 bg-green-50 font-normal text-green-700"
        >
          {getStatusLabel(status)}
        </Badge>
      )
    case "REJECTED":
      return (
        <Badge
          variant="secondary"
          className="border-red-200 bg-red-50 font-normal text-red-700"
        >
          {getStatusLabel(status)}
        </Badge>
      )
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}

export function RoleBadge({ role }: { role: User["role"] }) {
  return (
    <Badge variant="outline" className="font-normal">
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
    case "SET_ROLE":
      return "권한 변경"
    default:
      return action
  }
}
