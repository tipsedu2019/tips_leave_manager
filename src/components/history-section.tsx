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
      return "bg-green-50 text-green-700"
    case "PENDING":
      return "bg-yellow-50 text-yellow-700"
    default:
      return "bg-muted text-foreground"
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
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">전사 휴가 현황</h2>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => setVisibleMonth((current) => subMonths(current, 1))}
          >
            <ChevronLeft size={16} />
          </Button>
          <div className="min-w-32 text-center text-sm font-medium">
            {format(visibleMonth, "yyyy년 M월", { locale: ko })}
          </div>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => setVisibleMonth((current) => addMonths(current, 1))}
          >
            <ChevronRight size={16} />
          </Button>
        </div>
      </div>

      <div className="rounded-3xl border bg-white p-4 shadow-sm">
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
          {DAY_LABELS.map((label) => (
            <div
              key={label}
              className="rounded-2xl bg-muted/50 px-1.5 py-2 text-center text-xs font-medium text-muted-foreground sm:px-3 sm:text-sm"
            >
              {label}
            </div>
          ))}

          {calendarDays.map((day) => {
            const isoDate = format(day, "yyyy-MM-dd")
            const visibleItems = getCalendarItems(allRequests, isoDate)
            const totalItems = getRequestsForDate(allRequests, isoDate).length
            const calendarItems = getRequestsForDate(allRequests, isoDate)

            return (
              <div
                key={isoDate}
                className={getCalendarDayClassName(
                  isSameMonth(day, visibleMonth),
                  isToday(day)
                )}
              >
                <div className="mb-1.5 flex items-center justify-between sm:mb-2">
                  <span
                    className={`text-xs font-medium sm:text-sm ${
                      isSameMonth(day, visibleMonth)
                        ? "text-foreground"
                        : "text-muted-foreground"
                    }`}
                  >
                    {format(day, "d")}
                  </span>
                  {isToday(day) && (
                    <span className="rounded-full bg-black px-2 py-0.5 text-[10px] text-white">
                      오늘
                    </span>
                  )}
                </div>

                <div className="hidden space-y-1 sm:block">
                  {visibleItems.map((request) => (
                    <div
                      key={`${isoDate}-${request.id}`}
                      className={`rounded-xl px-2 py-1 text-[11px] leading-4 ${getCalendarItemClass(request.status)}`}
                    >
                      <div className="font-medium">{request.userName}</div>
                      <div>{getLeaveTypeLabel(request.type)}</div>
                    </div>
                  ))}
                  {totalItems > visibleItems.length && (
                    <div className="px-1 text-[11px] text-muted-foreground">
                      +{totalItems - visibleItems.length}건 더 있음
                    </div>
                  )}
                  {totalItems === 0 && (
                    <div className="px-1 text-[11px] text-muted-foreground">
                      일정 없음
                    </div>
                  )}
                </div>

                <div className="sm:hidden">
                  <div className="rounded-xl bg-muted/50 px-1.5 py-2 text-center text-[10px] leading-4 text-muted-foreground">
                    {getMobileCalendarDaySummary(calendarItems)}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="rounded-3xl border bg-white shadow-sm">
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
                  <TableCell className="max-w-[220px] truncate text-xs">
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
      </div>
    </section>
  )
}
