import React from "react"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatDate, getLeaveTypeLabel } from "../lib/utils"
import { LeaveRequest } from "../types"
import { StatusBadge, formatDays } from "./leave-common"

export function HistorySection({
  allRequests,
  requestReasons,
  showLeaveReason,
}: {
  allRequests: LeaveRequest[]
  requestReasons: Record<string, string>
  showLeaveReason: boolean
}) {
  return (
    <section className="space-y-6">
      <h2 className="text-2xl font-bold tracking-tight">전사 휴가 현황</h2>
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
