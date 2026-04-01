import React from "react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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
      ? "border-transparent bg-primary text-primary-foreground shadow-md"
      : "border-border/80 bg-background/80 text-muted-foreground hover:bg-accent hover:text-foreground"
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
          active
            ? "bg-primary-foreground/14 text-primary-foreground"
            : "bg-accent text-muted-foreground group-hover/nav:text-foreground"
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
    <Card
      className={cn(
        "border border-border/70 bg-card/92 shadow-sm",
        highlight && "bg-primary text-primary-foreground"
      )}
    >
      <CardHeader className="gap-2">
        <CardDescription
          className={cn(
            "text-[11px] font-semibold uppercase tracking-[0.2em]",
            highlight ? "text-primary-foreground/72" : "text-muted-foreground"
          )}
        >
          {title}
        </CardDescription>
        <CardTitle className={cn("text-4xl tracking-[-0.06em]", highlight && "text-primary-foreground")}>
          <span>{formatDays(value)}</span>
          <span
            className={cn(
              "ml-1 text-sm font-medium",
              highlight ? "text-primary-foreground/72" : "text-muted-foreground"
            )}
          >
            {unit}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p
          className={cn(
            "text-sm leading-6",
            highlight ? "text-primary-foreground/76" : "text-muted-foreground"
          )}
        >
          {description}
        </p>
      </CardContent>
    </Card>
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
      return "border-border bg-background text-foreground"
  }
}

export function StatusBadge({ status }: { status: LeaveRequest["status"] }) {
  return (
    <Badge variant="outline" className={cn("rounded-full font-normal", getStatusBadgeClassName(status))}>
      {getStatusLabel(status)}
    </Badge>
  )
}

export function getRoleBadgeClassName(role: User["role"]) {
  switch (role) {
    case "ADMIN":
      return "border-transparent bg-primary text-primary-foreground"
    case "MANAGER":
      return "border-border bg-secondary text-secondary-foreground"
    default:
      return "border-border bg-background text-muted-foreground"
  }
}

export function RoleBadge({ role }: { role: User["role"] }) {
  return (
    <Badge variant="outline" className={cn("rounded-full font-normal", getRoleBadgeClassName(role))}>
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
