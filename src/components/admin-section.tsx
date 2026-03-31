import React from "react"

import { Check, Edit2, Gift, RotateCcw, ShieldPlus, X } from "lucide-react"

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
import {
  getAvailableAnnualLeave,
  getCarryoverBalance,
} from "../lib/leave-management"
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
  onApproveRequest: (request: LeaveRequest) => void
  onRejectRequest: (request: LeaveRequest) => void
  onCancelApproval: (request: LeaveRequest) => void
}) {
  return (
    <section className="space-y-12">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">관리 도구</h2>
        <Badge variant="outline" className="bg-black text-white">
          {getRoleLabel(user.role)} 모드
        </Badge>
      </div>

      <section className="space-y-6">
        <h3 className="text-xl font-bold tracking-tight">휴가 승인 관리</h3>
        <div className="rounded-3xl border bg-white shadow-sm">
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
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
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
                  <TableCell className="max-w-[220px] truncate text-xs">
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
                          className="text-green-600 hover:bg-green-50"
                          onClick={() => onApproveRequest(request)}
                          title="승인"
                        >
                          <Check size={16} />
                        </Button>
                        <Button
                          size="icon-sm"
                          variant="outline"
                          className="text-red-600 hover:bg-red-50"
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
                        className="gap-2"
                        onClick={() => onCancelApproval(request)}
                      >
                        <RotateCcw size={14} />
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
                  <TableCell
                    colSpan={8}
                    className="h-32 text-center text-muted-foreground"
                  >
                    처리할 휴가 요청이 없습니다.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </section>

      <section className="space-y-6">
        <h3 className="text-xl font-bold tracking-tight">관리자 작업 이력</h3>
        <div className="max-h-[420px] overflow-y-auto rounded-3xl border bg-white shadow-sm">
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
                  <TableCell className="text-sm font-medium">{log.adminName}</TableCell>
                  <TableCell className="text-sm">{log.targetUserName}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-normal">
                      {getAdminActionLabel(log.action)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {log.details}
                  </TableCell>
                </TableRow>
              ))}
              {adminLogs.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="h-32 text-center text-muted-foreground"
                  >
                    기록된 작업 이력이 없습니다.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </section>

      <section className="space-y-6">
        <h3 className="text-xl font-bold tracking-tight">직원 관리 및 휴가 조정</h3>
        <div className="rounded-3xl border bg-white shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>이름</TableHead>
                <TableHead>입사일</TableHead>
                <TableHead>사용 가능 연차</TableHead>
                <TableHead>이월 연차</TableHead>
                <TableHead>잔여 대체휴일</TableHead>
                <TableHead className="text-right">작업</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allUsers.map((member) => (
                <TableRow key={member.uid}>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <span className="font-medium">{member.displayName}</span>
                      <span className="text-xs text-muted-foreground">
                        {member.email}
                      </span>
                      <div>
                        <RoleBadge role={member.role} />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs">{member.joinDate}</TableCell>
                  <TableCell>{formatDays(getAvailableAnnualLeave(member))}일</TableCell>
                  <TableCell>{formatDays(getCarryoverBalance(member))}일</TableCell>
                  <TableCell>
                    {formatDays(member.totalCompLeave - member.usedCompLeave)}일
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
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
                                <Select name="role" defaultValue={member.role} required>
                                  <SelectTrigger>
                                    <SelectValue placeholder="권한을 선택해 주세요." />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="ADMIN">최고관리자</SelectItem>
                                    <SelectItem value="MANAGER">부관리자</SelectItem>
                                    <SelectItem value="EMPLOYEE">직원</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            <DialogFooter>
                              <Button type="submit" className="w-full">
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
                          <Button
                            size="icon-sm"
                            variant="outline"
                            title="입사일 및 연차 조정"
                          >
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
                              <Button type="submit" className="w-full">
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
                          <Button size="sm" variant="outline" className="gap-2">
                            <Gift size={14} />
                            부여
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[420px]">
                          <form onSubmit={onGrantCompLeave}>
                            <DialogHeader>
                              <DialogTitle>대체휴일 부여</DialogTitle>
                              <DialogDescription>
                                {member.displayName}님에게 부여할 대체휴일 일수를 입력해
                                주세요.
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
                                <Input
                                  id="workDate"
                                  name="workDate"
                                  type="date"
                                  required
                                />
                              </div>
                            </div>
                            <DialogFooter>
                              <Button type="submit" className="w-full">
                                부여하기
                              </Button>
                            </DialogFooter>
                          </form>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {allUsers.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="h-32 text-center text-muted-foreground"
                  >
                    아직 등록된 직원이 없습니다.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </section>
    </section>
  )
}
