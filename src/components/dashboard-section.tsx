import React from "react"

import { CalendarRange, Edit2, Plus, Sparkles, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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
  const remainingCompLeave = user.totalCompLeave - user.usedCompLeave

  return (
    <section className="space-y-8">
      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.95fr]">
        <Card className="overflow-hidden border border-border/70 bg-[linear-gradient(135deg,#151515_0%,#2f2a24_100%)] text-white shadow-lg">
          <CardHeader className="gap-4">
            <BadgePill icon={<Sparkles size={12} />} label="개인 워크스페이스" inverted />
            <div className="space-y-3">
              <CardTitle className="text-3xl font-semibold tracking-[-0.05em] text-white sm:text-4xl">
                내 휴가 흐름을 한 화면에서 정리하세요
              </CardTitle>
              <CardDescription className="max-w-2xl text-sm leading-7 text-white/76 sm:text-base">
                신청, 수정, 취소, 자동 발생 내역 확인까지 이어지는 개인 휴가 작업 공간입니다.
                잔여 연차와 대체휴일, 이월 연차를 함께 보면서 다음 일정을 바로 정리할 수
                있습니다.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-wrap gap-3">
              <Dialog open={isRequestModalOpen} onOpenChange={onRequestModalChange}>
                <DialogTrigger asChild>
                  <Button
                    size="lg"
                    className="h-11 rounded-full bg-white px-5 text-black hover:bg-white/90"
                  >
                    <Plus data-icon="inline-start" />
                    휴가 신청하기
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[460px]">
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
                          className="h-10 w-full rounded-2xl border border-input bg-background px-3 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
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
                      <Button type="submit" className="h-11 w-full rounded-full">
                        {isEditing ? "수정 후 다시 신청하기" : "신청하기"}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>

              <BadgePill
                icon={<CalendarRange size={15} />}
                label={`사용 가능 연차 ${formatDays(availableAnnualLeave)}일`}
                inverted
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <MiniMetric label="다음 자동 발생일" value={user.nextLeaveAccrualDate} inverted />
              <MiniMetric label="이월 연차" value={`${formatDays(carryoverBalance)}일`} inverted />
              <MiniMetric label="남은 대체휴일" value={`${formatDays(remainingCompLeave)}일`} inverted />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/70 bg-card/92 shadow-sm">
          <CardHeader>
            <CardDescription className="text-[11px] font-semibold uppercase tracking-[0.2em]">
              연차 주기
            </CardDescription>
            <CardTitle className="text-2xl tracking-[-0.04em]">이번 주기 요약</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-3xl border border-border/70 bg-secondary/60 px-4 py-4">
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                다음 자동 발생일
              </p>
              <p className="mt-2 text-lg font-semibold tracking-[-0.03em]">
                {user.nextLeaveAccrualDate}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-3xl border border-border/70 bg-background px-4 py-4">
                <p className="text-xs text-muted-foreground">이월 연차</p>
                <p className="mt-2 text-2xl font-semibold tracking-[-0.05em]">
                  {formatDays(carryoverBalance)}일
                </p>
              </div>
              <div className="rounded-3xl border border-border/70 bg-background px-4 py-4">
                <p className="text-xs text-muted-foreground">대체휴일</p>
                <p className="mt-2 text-2xl font-semibold tracking-[-0.05em]">
                  {formatDays(remainingCompLeave)}일
                </p>
              </div>
            </div>

            <div className="rounded-3xl bg-secondary px-4 py-4 text-sm leading-6 text-muted-foreground">
              가장 오래된 이월 연차부터 먼저 차감되며, 연차 자동 발생 시 남은 연차는
              계속 누적됩니다.
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
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
        />
        <StatCard
          title="사용 가능한 연차"
          value={availableAnnualLeave}
          unit="일"
          description={`이월 연차 ${formatDays(carryoverBalance)}일 포함`}
          highlight
        />
        <StatCard
          title="남은 대체휴일"
          value={remainingCompLeave}
          unit="일"
          description={`총 ${formatDays(user.totalCompLeave)}일 중 ${formatDays(user.usedCompLeave)}일 사용`}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.45fr_0.95fr]">
        <Card className="border border-border/70 bg-card/92 shadow-sm">
          <CardHeader className="gap-2">
            <CardDescription className="text-[11px] font-semibold uppercase tracking-[0.2em]">
              휴가 신청
            </CardDescription>
            <CardTitle className="text-2xl tracking-[-0.04em]">내 휴가 신청</CardTitle>
            <CardDescription>
              승인 대기 중인 요청은 수정하거나 직접 취소할 수 있습니다.
            </CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
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
                    <TableCell className="font-medium">{getLeaveTypeLabel(request.type)}</TableCell>
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
                            className="text-rose-600 hover:bg-rose-50"
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
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border border-border/70 bg-card/92 shadow-sm">
            <CardHeader className="gap-2">
              <CardDescription className="text-[11px] font-semibold uppercase tracking-[0.2em]">
                이월 연차
              </CardDescription>
              <CardTitle className="text-2xl tracking-[-0.04em]">누적 현황</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {user.carryoverLeaves.length > 0 ? (
                user.carryoverLeaves.map((entry) => (
                  <div
                    key={entry.year}
                    className="flex items-center justify-between rounded-3xl border border-border/70 bg-secondary/50 px-4 py-3 text-sm"
                  >
                    <span>{entry.year}년 발생분</span>
                    <span className="font-semibold">{formatDays(entry.remainingDays)}일</span>
                  </div>
                ))
              ) : (
                <div className="rounded-3xl border border-dashed border-border px-4 py-5 text-sm text-muted-foreground">
                  아직 이월된 연차가 없습니다.
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border border-border/70 bg-card/92 shadow-sm">
            <CardHeader className="gap-2">
              <CardDescription className="text-[11px] font-semibold uppercase tracking-[0.2em]">
                발생 내역
              </CardDescription>
              <CardTitle className="text-2xl tracking-[-0.04em]">연차·휴가 발생 내역</CardTitle>
              <CardDescription>
                자동 연차 발생과 대체휴일 부여 내역을 시간순으로 확인할 수 있습니다.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {grantHistory.length > 0 ? (
                grantHistory.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-start justify-between gap-4 rounded-3xl border border-border/70 bg-secondary/50 px-4 py-3 text-sm"
                  >
                    <div className="space-y-1">
                      <p className="font-semibold">{entry.date}</p>
                      <p className="text-xs leading-5 text-muted-foreground">
                        {entry.category === "ANNUAL"
                          ? entry.description
                          : `${entry.description} · ${entry.workDate} 근무분`}
                      </p>
                    </div>
                    <span className="shrink-0 font-semibold">{formatDays(entry.days)}일</span>
                  </div>
                ))
              ) : (
                <div className="rounded-3xl border border-dashed border-border px-4 py-5 text-sm text-muted-foreground">
                  아직 표시할 발생 내역이 없습니다.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}

function BadgePill({
  icon,
  label,
  inverted = false,
}: {
  icon: React.ReactNode
  label: string
  inverted?: boolean
}) {
  return (
    <div
      className={
        inverted
          ? "inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/8 px-4 py-2.5 text-sm text-white/82"
          : "inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2.5 text-sm text-foreground"
      }
    >
      {icon}
      {label}
    </div>
  )
}

function MiniMetric({
  label,
  value,
  inverted = false,
}: {
  label: string
  value: string
  inverted?: boolean
}) {
  return (
    <div
      className={
        inverted
          ? "rounded-3xl border border-white/10 bg-white/8 px-4 py-4"
          : "rounded-3xl border border-border bg-background px-4 py-4"
      }
    >
      <p className={inverted ? "text-xs text-white/56" : "text-xs text-muted-foreground"}>{label}</p>
      <p className="mt-2 text-lg font-semibold tracking-[-0.03em]">{value}</p>
    </div>
  )
}
