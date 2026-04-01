import React from "react"

import { Check, Edit2, Gift, RotateCcw, ShieldPlus, Trash2, X } from "lucide-react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
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
import { getAvailableAnnualLeave, getCarryoverBalance } from "../lib/leave-management"
import { getRoleLabel } from "../lib/roles"
import { formatDate, getLeaveTypeLabel } from "../lib/utils"
import { AdminLog, LeaveRequest, User } from "../types"
import {
  RoleBadge,
  StatusBadge,
  formatDays,
  getAdminActionLabel,
  getDisplayInitial,
} from "./leave-common"

function SectionHeading({
  eyebrow,
  title,
  description,
  trailing,
}: {
  eyebrow: string
  title: string
  description?: string
  trailing?: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
      <div className="space-y-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          {eyebrow}
        </p>
        <h3 className="text-2xl font-semibold tracking-[-0.04em]">{title}</h3>
        {description && <p className="text-sm leading-6 text-muted-foreground">{description}</p>}
      </div>
      {trailing}
    </div>
  )
}

export function AdminSection({
  user,
  managedRequests,
  requestReasons,
  adminLogs,
  allUsers,
  isRoleModalOpen,
  selectedUserForRole,
  onRoleModalChange,
  onChangeUserRole,
  isAdjustModalOpen,
  selectedUserForAdjust,
  onAdjustModalChange,
  onAdjustUserLeave,
  isGrantModalOpen,
  selectedUserForGrant,
  onGrantModalChange,
  onGrantCompLeave,
  onDeleteUser,
  onApproveRequest,
  onRejectRequest,
  onCancelApproval,
}: {
  user: User
  managedRequests: LeaveRequest[]
  requestReasons: Record<string, string>
  adminLogs: AdminLog[]
  allUsers: User[]
  isRoleModalOpen: boolean
  selectedUserForRole: User | null
  onRoleModalChange: (open: boolean, member?: User) => void
  onChangeUserRole: (event: React.FormEvent<HTMLFormElement>) => void
  isAdjustModalOpen: boolean
  selectedUserForAdjust: User | null
  onAdjustModalChange: (open: boolean, member?: User) => void
  onAdjustUserLeave: (event: React.FormEvent<HTMLFormElement>) => void
  isGrantModalOpen: boolean
  selectedUserForGrant: User | null
  onGrantModalChange: (open: boolean, member?: User) => void
  onGrantCompLeave: (event: React.FormEvent<HTMLFormElement>) => void
  onDeleteUser: (member: User) => void
  onApproveRequest: (request: LeaveRequest) => void
  onRejectRequest: (request: LeaveRequest) => void
  onCancelApproval: (request: LeaveRequest) => void
}) {
  return (
    <section className="space-y-10">
      <div className="rounded-[32px] border border-black/10 bg-[linear-gradient(135deg,#ffffff_0%,#faf6ef_100%)] p-6 shadow-[0_28px_90px_-60px_rgba(15,23,42,0.45)] sm:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              운영 작업대
            </p>
            <h2 className="text-3xl font-semibold tracking-[-0.04em]">관리 도구</h2>
            <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
              휴가 승인, 권한 관리, 연차 조정, 대체휴일 부여를 한 화면에서 처리할 수 있는
              운영 작업대입니다.
            </p>
          </div>

          <div className="flex items-center gap-3 rounded-full border border-black/10 bg-white px-3 py-2 shadow-[0_16px_30px_-24px_rgba(15,23,42,0.5)]">
            <span className="text-sm text-muted-foreground">{user.displayName}</span>
            <Badge variant="outline" className="rounded-full bg-black text-white">
              {getRoleLabel(user.role)} 모드
            </Badge>
          </div>
        </div>
      </div>

      <section className="space-y-4">
        <SectionHeading
          eyebrow="휴가 승인"
          title="휴가 승인 관리"
          description="승인 대기 중 요청을 처리하고, 이미 승인된 요청은 필요 시 다시 승인 대기 상태로 되돌릴 수 있습니다."
          trailing={
            <div className="rounded-full border border-black/10 bg-white px-4 py-2 text-sm text-muted-foreground">
              처리 대상 {managedRequests.length}건
            </div>
          }
        />

        <div className="overflow-hidden rounded-[32px] border border-black/10 bg-white/88 shadow-[0_28px_90px_-60px_rgba(15,23,42,0.45)] backdrop-blur-sm">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>신청일</TableHead>
                  <TableHead>신청자</TableHead>
                  <TableHead>종류</TableHead>
                  <TableHead>기간</TableHead>
                  <TableHead>일수</TableHead>
                  <TableHead>사유</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead className="text-right">작업</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {managedRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDate(request.createdAt)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <Avatar className="size-7 border border-black/10">
                          <AvatarFallback className="text-[10px]">
                            {getDisplayInitial(request.userName)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{request.userName}</span>
                      </div>
                    </TableCell>
                    <TableCell>{getLeaveTypeLabel(request.type)}</TableCell>
                    <TableCell className="text-xs">
                      {request.startDate} ~ {request.endDate}
                    </TableCell>
                    <TableCell>{formatDays(request.daysCount)}일</TableCell>
                    <TableCell className="max-w-[240px] truncate text-xs">
                      {requestReasons[request.id] ?? request.reason ?? "-"}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={request.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      {request.status === "PENDING" ? (
                        <div className="flex justify-end gap-2">
                          <Button
                            size="icon-sm"
                            variant="outline"
                            className="text-emerald-600 hover:bg-emerald-50"
                            onClick={() => onApproveRequest(request)}
                            title="승인"
                          >
                            <Check size={16} />
                          </Button>
                          <Button
                            size="icon-sm"
                            variant="outline"
                            className="text-rose-600 hover:bg-rose-50"
                            onClick={() => onRejectRequest(request)}
                            title="반려"
                          >
                            <X size={16} />
                          </Button>
                        </div>
                      ) : request.status === "APPROVED" ? (
                        <Button
                          size="sm"
                          variant="outline"
                          className="rounded-full"
                          onClick={() => onCancelApproval(request)}
                        >
                          <RotateCcw data-icon="inline-start" />
                          승인 취소
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {managedRequests.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                      처리할 휴가 요청이 없습니다.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeading
          eyebrow="작업 이력"
          title="관리자 작업 이력"
          description="승인, 반려, 권한 변경, 연차 조정 같은 주요 운영 작업이 자동으로 기록됩니다."
        />

        <div className="max-h-[420px] overflow-auto rounded-[32px] border border-black/10 bg-white/88 shadow-[0_28px_90px_-60px_rgba(15,23,42,0.45)] backdrop-blur-sm">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>일시</TableHead>
                <TableHead>관리자</TableHead>
                <TableHead>대상</TableHead>
                <TableHead>작업</TableHead>
                <TableHead>상세 내용</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {adminLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="text-xs text-muted-foreground">
                    {formatDate(log.createdAt)}
                  </TableCell>
                  <TableCell className="font-medium">{log.adminName}</TableCell>
                  <TableCell>{log.targetUserName}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="rounded-full font-normal">
                      {getAdminActionLabel(log.action)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{log.details}</TableCell>
                </TableRow>
              ))}
              {adminLogs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                    기록된 작업 이력이 없습니다.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeading
          eyebrow="직원 관리"
          title="직원 관리 및 휴가 조정"
          description="직원 권한을 조정하고, 입사일과 연차 기준, 대체휴일을 필요한 만큼 바로 수정할 수 있습니다."
        />

        <div className="overflow-hidden rounded-[32px] border border-black/10 bg-white/88 shadow-[0_28px_90px_-60px_rgba(15,23,42,0.45)] backdrop-blur-sm">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>이름</TableHead>
                  <TableHead>입사일</TableHead>
                  <TableHead>사용 가능 연차</TableHead>
                  <TableHead>이월 연차</TableHead>
                  <TableHead>남은 대체휴일</TableHead>
                  <TableHead className="text-right">작업</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allUsers.map((member) => (
                  <TableRow key={member.uid}>
                    <TableCell>
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-2.5">
                          <Avatar className="size-8 border border-black/10">
                            <AvatarFallback>{getDisplayInitial(member.displayName)}</AvatarFallback>
                          </Avatar>
                          <div className="space-y-1">
                            <p className="font-medium">{member.displayName}</p>
                            <p className="text-xs text-muted-foreground">{member.email}</p>
                          </div>
                        </div>
                        <div>
                          <RoleBadge role={member.role} />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs">{member.joinDate}</TableCell>
                    <TableCell>{formatDays(getAvailableAnnualLeave(member))}일</TableCell>
                    <TableCell>{formatDays(getCarryoverBalance(member))}일</TableCell>
                    <TableCell>{formatDays(member.totalCompLeave - member.usedCompLeave)}일</TableCell>
                    <TableCell className="text-right">
                      <div className="flex flex-wrap justify-end gap-2">
                        <Dialog
                          open={isRoleModalOpen && selectedUserForRole?.uid === member.uid}
                          onOpenChange={(open) => onRoleModalChange(open, member)}
                        >
                          <DialogTrigger asChild>
                            <Button size="icon-sm" variant="outline" title="권한 변경">
                              <ShieldPlus size={14} />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-[420px]">
                            <form onSubmit={onChangeUserRole}>
                              <DialogHeader>
                                <DialogTitle>권한 변경</DialogTitle>
                                <DialogDescription>
                                  {member.displayName}님의 권한을 변경합니다.
                                </DialogDescription>
                              </DialogHeader>
                              <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                  <Label htmlFor="role">권한</Label>
                                  <select
                                    id="role"
                                    name="role"
                                    defaultValue={member.role}
                                    required
                                    className="h-10 w-full rounded-2xl border border-input bg-background px-3 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                                  >
                                    <option value="ADMIN">최고관리자</option>
                                    <option value="MANAGER">관리자</option>
                                    <option value="EMPLOYEE">직원</option>
                                  </select>
                                </div>
                              </div>
                              <DialogFooter>
                                <Button type="submit" className="h-11 w-full rounded-full">
                                  저장하기
                                </Button>
                              </DialogFooter>
                            </form>
                          </DialogContent>
                        </Dialog>

                        <Dialog
                          open={isAdjustModalOpen && selectedUserForAdjust?.uid === member.uid}
                          onOpenChange={(open) => onAdjustModalChange(open, member)}
                        >
                          <DialogTrigger asChild>
                            <Button size="icon-sm" variant="outline" title="직원 정보 및 연차 조정">
                              <Edit2 size={14} />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-[420px]">
                            <form onSubmit={onAdjustUserLeave}>
                              <DialogHeader>
                                <DialogTitle>직원 정보 및 연차 조정</DialogTitle>
                                <DialogDescription>
                                  {member.displayName}님의 입사일과 연차 기준을 조정합니다.
                                </DialogDescription>
                              </DialogHeader>
                              <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                  <Label htmlFor="joinDate">입사일</Label>
                                  <Input
                                    id="joinDate"
                                    name="joinDate"
                                    type="date"
                                    defaultValue={member.joinDate}
                                    required
                                  />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="grid gap-2">
                                    <Label htmlFor="totalLeave">현재 기본 연차</Label>
                                    <Input
                                      id="totalLeave"
                                      name="totalLeave"
                                      type="number"
                                      step="0.5"
                                      defaultValue={member.totalLeave}
                                      required
                                    />
                                  </div>
                                  <div className="grid gap-2">
                                    <Label htmlFor="totalCompLeave">총 대체휴일</Label>
                                    <Input
                                      id="totalCompLeave"
                                      name="totalCompLeave"
                                      type="number"
                                      step="0.5"
                                      defaultValue={member.totalCompLeave}
                                      required
                                    />
                                  </div>
                                </div>
                              </div>
                              <DialogFooter>
                                <Button type="submit" className="h-11 w-full rounded-full">
                                  저장하기
                                </Button>
                              </DialogFooter>
                            </form>
                          </DialogContent>
                        </Dialog>

                        <Dialog
                          open={isGrantModalOpen && selectedUserForGrant?.uid === member.uid}
                          onOpenChange={(open) => onGrantModalChange(open, member)}
                        >
                          <DialogTrigger asChild>
                            <Button size="sm" variant="outline" className="rounded-full">
                              <Gift data-icon="inline-start" />
                              부여
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-[420px]">
                            <form onSubmit={onGrantCompLeave}>
                              <DialogHeader>
                                <DialogTitle>대체휴일 부여</DialogTitle>
                                <DialogDescription>
                                  {member.displayName}님에게 부여할 대체휴일 일수와 근무 기준일을
                                  입력해 주세요.
                                </DialogDescription>
                              </DialogHeader>
                              <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                  <Label htmlFor="amount">부여 일수</Label>
                                  <Input
                                    id="amount"
                                    name="amount"
                                    type="number"
                                    step="0.5"
                                    placeholder="예: 1 또는 0.5"
                                    required
                                  />
                                </div>
                                <div className="grid gap-2">
                                  <Label htmlFor="workDate">근무 기준일</Label>
                                  <Input id="workDate" name="workDate" type="date" required />
                                </div>
                              </div>
                              <DialogFooter>
                                <Button type="submit" className="h-11 w-full rounded-full">
                                  부여하기
                                </Button>
                              </DialogFooter>
                            </form>
                          </DialogContent>
                        </Dialog>

                        {member.role === "EMPLOYEE" && member.uid !== user.uid && (
                          <Button
                            size="icon-sm"
                            variant="outline"
                            className="text-rose-600 hover:bg-rose-50"
                            title="직원 삭제"
                            onClick={() => onDeleteUser(member)}
                          >
                            <Trash2 size={14} />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {allUsers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                      아직 등록된 직원이 없습니다.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </section>
    </section>
  )
}
