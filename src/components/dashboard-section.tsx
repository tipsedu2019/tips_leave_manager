import React from "react"

import { Plus } from "lucide-react"

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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatDate, getLeaveTypeLabel } from "../lib/utils"
import { LeaveRequest, User } from "../types"
import { StatCard, StatusBadge, formatDays } from "./leave-common"

export function DashboardSection({
  user,
  requests,
  isRequestModalOpen,
  onRequestModalChange,
  onSubmitRequest,
  availableAnnualLeave,
  carryoverBalance,
}: {
  user: User
  requests: LeaveRequest[]
  isRequestModalOpen: boolean
  onRequestModalChange: (open: boolean) => void
  onSubmitRequest: (event: React.FormEvent<HTMLFormElement>) => void
  availableAnnualLeave: number
  carryoverBalance: number
}) {
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
          title="사용 가능 연차"
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
            <h2 className="text-xl font-bold tracking-tight">최근 내 신청</h2>
            <Dialog open={isRequestModalOpen} onOpenChange={onRequestModalChange}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus size={16} />
                  휴가 신청하기
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[440px]">
                <form onSubmit={onSubmitRequest}>
                  <DialogHeader>
                    <DialogTitle>휴가 신청</DialogTitle>
                    <DialogDescription>
                      휴가 종류와 기간을 선택해 신청해 주세요. 사유는 관리자와
                      부관리자만 확인할 수 있습니다.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="type">휴가 종류</Label>
                      <Select name="type" defaultValue="ANNUAL" required>
                        <SelectTrigger>
                          <SelectValue placeholder="휴가 종류를 선택해 주세요" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ANNUAL">연차</SelectItem>
                          <SelectItem value="HALF_DAY">반차</SelectItem>
                          <SelectItem value="COMPENSATORY">대체휴일</SelectItem>
                          <SelectItem value="SICK">병가</SelectItem>
                          <SelectItem value="SPECIAL">특별휴가</SelectItem>
                          <SelectItem value="OTHER">기타</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="startDate">시작일</Label>
                        <Input id="startDate" name="startDate" type="date" required />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="endDate">종료일</Label>
                        <Input id="endDate" name="endDate" type="date" required />
                      </div>
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="reason">사유</Label>
                      <Input
                        id="reason"
                        name="reason"
                        placeholder="휴가 사유를 입력해 주세요"
                        required
                      />
                    </div>
                  </div>

                  <DialogFooter>
                    <Button type="submit" className="w-full">
                      신청하기
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
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.slice(0, 5).map((request) => (
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
                  </TableRow>
                ))}
                {requests.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="h-32 text-center text-muted-foreground"
                    >
                      아직 신청한 휴가가 없습니다.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        <div className="space-y-6">
          <h2 className="text-xl font-bold tracking-tight">연차 누적 현황</h2>
          <div className="space-y-4 rounded-3xl border bg-white p-6 shadow-sm">
            <div className="space-y-1">
              <p className="text-sm font-semibold">다음 자동 연차 발생일</p>
              <p className="text-sm text-muted-foreground">
                {formatDate(user.nextLeaveAccrualDate)}
              </p>
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
                      <span className="font-medium">
                        {formatDays(entry.remainingDays)}일
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  아직 이월된 연차가 없습니다.
                </p>
              )}
            </div>

            <div className="rounded-2xl bg-muted/40 px-4 py-3 text-xs leading-5 text-muted-foreground">
              이월 연차는 기한 없이 누적되며, 연차 사용 시 가장 오래된 이월
              연차부터 먼저 차감됩니다.
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
