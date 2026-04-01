import React, { useMemo, useState } from "react"
import {
  addDays,
  addMonths,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns"
import { ko } from "date-fns/locale"
import { ChevronLeft, ChevronRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  getCalendarDayClassName,
  getMobileCalendarDaySummary,
  getTodayBadgeClassName,
} from "../lib/history-calendar"
import { getRequestsForDate } from "../lib/leave-calendar"
import { formatDate, getLeaveTypeLabel } from "../lib/utils"
import { LeaveRequest } from "../types"
import { StatusBadge, formatDays } from "./leave-common"

const DAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"]

function getCalendarItems(requests: LeaveRequest[], isoDate: string) {
  return getRequestsForDate(requests, isoDate).slice(0, 3)
}

function getCalendarItemClass(status: LeaveRequest["status"]) {
  switch (status) {
    case "APPROVED":
      return "border-emerald-200 bg-emerald-50 text-emerald-700"
    case "PENDING":
      return "border-amber-200 bg-amber-50 text-amber-700"
    default:
      return "border-border bg-muted/60 text-foreground"
  }
}

export function HistorySection({
  allRequests,
  requestReasons,
  showLeaveReason,
}: {
  allRequests: LeaveRequest[]
  requestReasons: Record<string, string>
  showLeaveReason: boolean
}) {
  const [visibleMonth, setVisibleMonth] = useState(() => startOfMonth(new Date()))

  const calendarDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(visibleMonth), { weekStartsOn: 0 })
    const end = endOfWeek(endOfMonth(visibleMonth), { weekStartsOn: 0 })
    const days: Date[] = []

    let current = start
    while (current <= end) {
      days.push(current)
      current = addDays(current, 1)
    }

    return days
  }, [visibleMonth])

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            전사 캘린더
          </p>
          <h2 className="text-3xl font-semibold tracking-[-0.04em]">전사 휴가 현황</h2>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
            팀 전체 휴가 일정을 달력과 목록으로 함께 확인할 수 있습니다. 사유는 권한이
            있는 관리자만 볼 수 있습니다.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-2 py-2 shadow-sm">
          <Button
            variant="outline"
            size="icon-sm"
            className="rounded-full"
            onClick={() => setVisibleMonth((current) => subMonths(current, 1))}
          >
            <ChevronLeft size={16} />
          </Button>
          <div className="min-w-32 px-2 text-center text-sm font-semibold">
            {format(visibleMonth, "yyyy년 M월", { locale: ko })}
          </div>
          <Button
            variant="outline"
            size="icon-sm"
            className="rounded-full"
            onClick={() => setVisibleMonth((current) => addMonths(current, 1))}
          >
            <ChevronRight size={16} />
          </Button>
        </div>
      </div>

      <Card className="border border-border/70 bg-card/92 shadow-sm">
        <CardHeader>
          <CardTitle className="text-2xl tracking-[-0.04em]">월간 캘린더</CardTitle>
          <CardDescription>승인 대기와 승인 완료 휴가를 같은 달력에서 확인할 수 있습니다.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2.5">
            {DAY_LABELS.map((label) => (
              <div
                key={label}
                className="rounded-2xl bg-secondary px-1.5 py-2 text-center text-xs font-medium text-muted-foreground sm:px-3 sm:text-sm"
              >
                {label}
              </div>
            ))}

            {calendarDays.map((day) => {
              const isoDate = format(day, "yyyy-MM-dd")
              const calendarItems = getRequestsForDate(allRequests, isoDate)
              const visibleItems = getCalendarItems(allRequests, isoDate)
              const mobileSummary = getMobileCalendarDaySummary(calendarItems)

              return (
                <div
                  key={isoDate}
                  className={getCalendarDayClassName(isSameMonth(day, visibleMonth), isToday(day))}
                >
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <span
                      className={`text-xs font-semibold sm:text-sm ${
                        isSameMonth(day, visibleMonth) ? "text-foreground" : "text-muted-foreground"
                      }`}
                    >
                      {format(day, "d")}
                    </span>
                    {isToday(day) && <span className={getTodayBadgeClassName()}>오늘</span>}
                  </div>

                  <div className="hidden flex-1 space-y-1.5 sm:block">
                    {visibleItems.map((request) => (
                      <div
                        key={`${isoDate}-${request.id}`}
                        className={`rounded-2xl border px-2 py-1.5 text-[11px] leading-4 ${getCalendarItemClass(request.status)}`}
                      >
                        <div className="truncate font-medium">{request.userName}</div>
                        <div>{getLeaveTypeLabel(request.type)}</div>
                      </div>
                    ))}
                    {calendarItems.length > visibleItems.length && (
                      <div className="px-1 text-[11px] text-muted-foreground">
                        +{calendarItems.length - visibleItems.length}건 더 있음
                      </div>
                    )}
                  </div>

                  {mobileSummary && (
                    <div className="sm:hidden">
                      <div className="rounded-2xl bg-secondary px-1.5 py-2 text-center text-[10px] leading-4 text-muted-foreground">
                        <span className="block truncate whitespace-nowrap">{mobileSummary}</span>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <Card className="border border-border/70 bg-card/92 shadow-sm">
        <CardHeader>
          <CardTitle className="text-2xl tracking-[-0.04em]">휴가 신청 목록</CardTitle>
          <CardDescription>전사 휴가 현황을 표 형태로도 빠르게 훑어볼 수 있습니다.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>신청일</TableHead>
                <TableHead>신청자</TableHead>
                <TableHead>종류</TableHead>
                <TableHead>기간</TableHead>
                <TableHead>일수</TableHead>
                {showLeaveReason && <TableHead>사유</TableHead>}
                <TableHead>상태</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allRequests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell className="text-xs text-muted-foreground">
                    {formatDate(request.createdAt)}
                  </TableCell>
                  <TableCell className="font-medium">{request.userName}</TableCell>
                  <TableCell>{getLeaveTypeLabel(request.type)}</TableCell>
                  <TableCell className="text-xs">
                    {request.startDate} ~ {request.endDate}
                  </TableCell>
                  <TableCell>{formatDays(request.daysCount)}일</TableCell>
                  {showLeaveReason && (
                    <TableCell className="max-w-[240px] truncate text-xs">
                      {requestReasons[request.id] ?? request.reason ?? "-"}
                    </TableCell>
                  )}
                  <TableCell>
                    <StatusBadge status={request.status} />
                  </TableCell>
                </TableRow>
              ))}
              {allRequests.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={showLeaveReason ? 7 : 6}
                    className="h-32 text-center text-muted-foreground"
                  >
                    등록된 휴가 내역이 없습니다.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </section>
  )
}
