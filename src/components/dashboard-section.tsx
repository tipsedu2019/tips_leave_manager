import React from "react"

import { Edit2, Plus, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { LeaveGrantHistoryEntry, LeaveRequest, User } from "../types"
import { getLeaveTypeLabel } from "../lib/utils"
import { StatCard, StatusBadge, formatDays } from "./leave-common"

export function DashboardSection({
  user,
  requests,
  requestReasons,
  grantHistory,
  editingRequest,
  isRequestModalOpen,
  onRequestModalChange,
  onSubmitRequest,
  onEditRequest,
  onCancelRequest,
  availableAnnualLeave,
  carryoverBalance,
}: {
  user: User
  requests: LeaveRequest[]
  requestReasons: Record<string, string>
  grantHistory: LeaveGrantHistoryEntry[]
  editingRequest: LeaveRequest | null
  isRequestModalOpen: boolean
  onRequestModalChange: (open: boolean) => void
  onSubmitRequest: (event: React.FormEvent<HTMLFormElement>) => void
  onEditRequest: (request: LeaveRequest) => void
  onCancelRequest: (request: LeaveRequest) => void
  availableAnnualLeave: number
  carryoverBalance: number
}) {
  const isEditing = editingRequest !== null
  const editingReason = editingRequest ? requestReasons[editingRequest.id] ?? "" : ""

  return (
    <section className="space-y-8">
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          title="현재 기본 연차"
          value={user.totalLeave}
          unit="일"
          description="현재 연차 주기에서 부여된 기본 연차"
        />
        <StatCard
          title="사용한 기본 연차"
          value={user.usedLeave}
          unit="일"
          description="현재 연차 주기에서 차감된 기본 연차"
          highlight
        />
        <StatCard
          title="사용 가능한 연차"
          value={availableAnnualLeave}
          unit="일"
          description={`이월 연차 ${formatDays(carryoverBalance)}일 포함`}
        />
        <StatCard
          title="잔여 대체휴일"
          value={user.totalCompLeave - user.usedCompLeave}
          unit="일"
          description={`총 ${formatDays(user.totalCompLeave)}일 중 ${formatDays(user.usedCompLeave)}일 사용`}
        />
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold tracking-tight">내 휴가 신청</h2>
            <Dialog open={isRequestModalOpen} onOpenChange={onRequestModalChange}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus size={16} />
                  휴가 신청하기
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[440px]">
                <form key={editingRequest?.id ?? "create"} onSubmit={onSubmitRequest}>
                  <DialogHeader>
                    <DialogTitle>{isEditing ? "휴가 신청 수정" : "휴가 신청"}</DialogTitle>
                    <DialogDescription>
                      {isEditing
                        ? "내용을 수정하면 승인 대기 중 상태로 다시 제출됩니다."
                        : "휴가 종류와 기간을 선택해 신청해 주세요. 사유는 최고관리자와 관리자만 확인할 수 있습니다."}
                    </DialogDescription>
                  </DialogHeader>

                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="type">휴가 종류</Label>
                      <select
                        id="type"
                        name="type"
                        defaultValue={editingRequest?.type ?? "ANNUAL"}
                        required
                        className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                      >
                        <option value="ANNUAL">연차</option>
                        <option value="HALF_DAY">반차</option>
                        <option value="COMPENSATORY">대체휴일</option>
                        <option value="SICK">병가</option>
                        <option value="SPECIAL">경조사</option>
                        <option value="OTHER">기타</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="startDate">시작일</Label>
                        <Input
                          id="startDate"
                          name="startDate"
                          type="date"
                          defaultValue={editingRequest?.startDate ?? ""}
                          required
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="endDate">종료일</Label>
                        <Input
                          id="endDate"
                          name="endDate"
                          type="date"
                          defaultValue={editingRequest?.endDate ?? ""}
                          required
                        />
                      </div>
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="reason">사유</Label>
                      <Input
                        id="reason"
                        name="reason"
                        defaultValue={editingReason}
                        placeholder="휴가 사유를 입력해 주세요."
                        required
                      />
                    </div>
                  </div>

                  <DialogFooter>
                    <Button type="submit" className="w-full">
                      {isEditing ? "수정 후 다시 신청하기" : "신청하기"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="rounded-3xl border bg-white shadow-sm">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>종류</TableHead>
                  <TableHead>기간</TableHead>
                  <TableHead>일수</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead className="text-right">작업</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell className="font-medium">
                      {getLeaveTypeLabel(request.type)}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {request.startDate} ~ {request.endDate}
                    </TableCell>
                    <TableCell>{formatDays(request.daysCount)}일</TableCell>
                    <TableCell>
                      <StatusBadge status={request.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      {request.status === "PENDING" ? (
                        <div className="flex justify-end gap-2">
                          <Button
                            size="icon-sm"
                            variant="outline"
                            title="수정"
                            onClick={() => onEditRequest(request)}
                          >
                            <Edit2 size={14} />
                          </Button>
                          <Button
                            size="icon-sm"
                            variant="outline"
                            className="text-red-600 hover:bg-red-50"
                            title="신청 취소"
                            onClick={() => onCancelRequest(request)}
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {requests.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                      아직 신청한 휴가가 없습니다.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-4 rounded-3xl border bg-white p-6 shadow-sm">
            <div className="space-y-1">
              <p className="text-sm font-semibold">다음 자동 연차 발생일</p>
              <p className="text-sm text-muted-foreground">{user.nextLeaveAccrualDate}</p>
            </div>

            <div className="h-px bg-border" />

            <div className="space-y-3">
              <p className="text-sm font-semibold">이월 연차</p>
              {user.carryoverLeaves.length > 0 ? (
                <div className="space-y-2">
                  {user.carryoverLeaves.map((entry) => (
                    <div
                      key={entry.year}
                      className="flex items-center justify-between rounded-2xl bg-muted/40 px-3 py-2 text-sm"
                    >
                      <span>{entry.year}년 발생분</span>
                      <span className="font-medium">{formatDays(entry.remainingDays)}일</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">아직 이월된 연차가 없습니다.</p>
              )}
            </div>

            <div className="rounded-2xl bg-muted/40 px-4 py-3 text-xs leading-5 text-muted-foreground">
              이월 연차는 기한 없이 계속 누적되며, 연차 사용 시 가장 오래된 이월
              연차부터 먼저 차감됩니다.
            </div>
          </div>

          <div className="space-y-4 rounded-3xl border bg-white p-6 shadow-sm">
            <div className="space-y-1">
              <p className="text-sm font-semibold">연차/휴가 발생 내역</p>
              <p className="text-sm text-muted-foreground">
                연차 자동 발생과 대체휴일 부여 내역을 모두 확인할 수 있습니다.
              </p>
            </div>

            <div className="space-y-2">
              {grantHistory.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between rounded-2xl bg-muted/40 px-3 py-2 text-sm"
                >
                  <div>
                    <p className="font-medium">{entry.date}</p>
                    <p className="text-xs text-muted-foreground">
                      {entry.category === "ANNUAL"
                        ? entry.description
                        : `${entry.description} · ${entry.workDate} 근무분`}
                    </p>
                  </div>
                  <span className="font-medium">{formatDays(entry.days)}일</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
