import React, { useEffect, useMemo, useState } from "react"
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from "firebase/auth"
import {
  addDoc,
  collection,
  deleteField,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore"
import {
  Bell,
  History,
  LayoutDashboard,
  LogOut,
  ShieldCheck,
} from "lucide-react"
import { Toaster, toast } from "sonner"

import { auth, db } from "./firebase"
import {
  AdminLog,
  AppNotification,
  AppTab,
  CompLeaveGrant,
  LeaveRequest,
  LeaveType,
  User,
} from "./types"
import {
  calculateAnnualLeave,
  formatDateTime,
  getLeaveTypeLabel,
} from "./lib/utils"
import { normalizeUserRecord } from "./lib/user-records"
import { canViewLeaveReason, getRoleLabel, isPrivilegedRole } from "./lib/roles"
import {
  consumeAnnualLeaveWithAdjustment,
  getAvailableAnnualLeave,
  getCarryoverBalance,
  getLeaveGrantHistory,
  getNextLeaveAccrualDate,
  restoreAnnualLeave,
  syncAnnualLeaveIfNeeded,
} from "./lib/leave-management"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover"
import { AdminSection } from "./components/admin-section"
import { DashboardSection } from "./components/dashboard-section"
import { HistorySection } from "./components/history-section"
import { NavButton, getDisplayInitial } from "./components/leave-common"

const OWNER_ADMIN_EMAIL = "yeoyuasset@gmail.com"

function sortByCreatedAtDesc<T extends { createdAt: string }>(records: T[]) {
  return [...records].sort((left, right) => right.createdAt.localeCompare(left.createdAt))
}

function formatLeaveAmount(value: number) {
  return Number.isInteger(value) ? `${value}` : value.toFixed(1)
}

export default function App() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<AppTab>("dashboard")

  const [requests, setRequests] = useState<LeaveRequest[]>([])
  const [allRequests, setAllRequests] = useState<LeaveRequest[]>([])
  const [allUsers, setAllUsers] = useState<User[]>([])
  const [adminLogs, setAdminLogs] = useState<AdminLog[]>([])
  const [compLeaveGrants, setCompLeaveGrants] = useState<CompLeaveGrant[]>([])
  const [requestReasons, setRequestReasons] = useState<Record<string, string>>({})
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [isNotificationOpen, setIsNotificationOpen] = useState(false)

  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false)
  const [editingRequest, setEditingRequest] = useState<LeaveRequest | null>(null)
  const [isGrantModalOpen, setIsGrantModalOpen] = useState(false)
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false)
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false)

  const [selectedUserForGrant, setSelectedUserForGrant] = useState<User | null>(null)
  const [selectedUserForAdjust, setSelectedUserForAdjust] = useState<User | null>(null)
  const [selectedUserForRole, setSelectedUserForRole] = useState<User | null>(null)

  const canManage = user ? isPrivilegedRole(user.role) : false
  const showLeaveReason = user ? canViewLeaveReason(user.role) : false
  const availableAnnualLeave = user ? getAvailableAnnualLeave(user) : 0
  const carryoverBalance = user ? getCarryoverBalance(user) : 0
  const grantHistory = useMemo(
    () => (user ? getLeaveGrantHistory(user, compLeaveGrants) : []),
    [compLeaveGrants, user]
  )
  const unreadNotificationCount = useMemo(
    () => notifications.filter((notification) => !notification.readAt).length,
    [notifications]
  )
  const managedRequests = useMemo(
    () => allRequests.filter((request) => request.status !== "REJECTED"),
    [allRequests]
  )

  const normalizeFirestoreUser = (uid: string, data: Record<string, unknown>) =>
    normalizeUserRecord({
      uid,
      ...data,
    } as Partial<User> & Pick<User, "uid" | "email" | "displayName" | "role">)

  const createNotifications = async (
    drafts: Array<
      Omit<AppNotification, "id" | "actorId" | "createdAt"> & {
        id?: string
        createdAt?: string
      }
    >
  ) => {
    const actorId = auth.currentUser?.uid

    if (!actorId || drafts.length === 0) {
      return
    }

    const batch = writeBatch(db)
    let hasWrites = false

    for (const draft of drafts) {
      const notificationRef = draft.id
        ? doc(db, "notifications", draft.id)
        : doc(collection(db, "notifications"))

      if (draft.id) {
        const snapshot = await getDoc(notificationRef)
        if (snapshot.exists()) {
          continue
        }
      }

      const payload: Omit<AppNotification, "id"> = {
        userId: draft.userId,
        actorId,
        title: draft.title,
        message: draft.message,
        createdAt: draft.createdAt ?? new Date().toISOString(),
        ...(draft.linkTab ? { linkTab: draft.linkTab } : {}),
        ...(draft.readAt ? { readAt: draft.readAt } : {}),
      }

      batch.set(notificationRef, payload)
      hasWrites = true
    }

    if (hasWrites) {
      await batch.commit()
    }
  }

  const notifyUser = async (
    targetUserId: string,
    title: string,
    message: string,
    linkTab: AppTab = "dashboard",
    options?: { id?: string; createdAt?: string }
  ) => {
    await createNotifications([
      {
        id: options?.id,
        userId: targetUserId,
        title,
        message,
        linkTab,
        createdAt: options?.createdAt,
      },
    ])
  }

  const notifyPrivilegedUsers = async (
    title: string,
    message: string,
    linkTab: AppTab = "admin"
  ) => {
    const actorId = auth.currentUser?.uid
    if (!actorId) return

    const privilegedUsersSnapshot = await getDocs(
      query(collection(db, "users"), where("role", "in", ["ADMIN", "MANAGER"]))
    )

    const privilegedUsers = privilegedUsersSnapshot.docs
      .map((member) => normalizeFirestoreUser(member.id, member.data()))
      .filter((member) => member.uid !== actorId)

    await createNotifications(
      privilegedUsers.map((member) => ({
        userId: member.uid,
        title,
        message,
        linkTab,
      }))
    )
  }

  const syncUserIfNeeded = async (candidate: User) => {
    const result = syncAnnualLeaveIfNeeded(candidate)

    if (result.changed) {
      await updateDoc(doc(db, "users", candidate.uid), {
        totalLeave: result.user.totalLeave,
        usedLeave: result.user.usedLeave,
        carryoverLeaves: result.user.carryoverLeaves,
        nextLeaveAccrualDate: result.user.nextLeaveAccrualDate,
      })

      await createNotifications(
        result.events.map((event) => ({
          id: `accrual-${candidate.uid}-${event.accrualDate}`,
          userId: candidate.uid,
          title: "연차가 자동 발생했습니다",
          message:
            event.carriedOverDays > 0
              ? `입사일 기준으로 ${formatLeaveAmount(event.grantedDays)}일이 발생했고, 전년도 잔여 ${formatLeaveAmount(event.carriedOverDays)}일이 이월되었습니다.`
              : `입사일 기준으로 ${formatLeaveAmount(event.grantedDays)}일의 연차가 발생했습니다.`,
          createdAt: `${event.accrualDate}T00:00:00.000Z`,
          linkTab: "dashboard",
        }))
      )
    }

    return result.user
  }

  const loadAndSyncUser = async (uid: string) => {
    const snapshot = await getDoc(doc(db, "users", uid))
    if (!snapshot.exists()) return null
    return syncUserIfNeeded(normalizeFirestoreUser(uid, snapshot.data()))
  }

  const logAdminAction = async (
    action: AdminLog["action"],
    targetUserId: string,
    targetUserName: string,
    details: string
  ) => {
    if (!user) return

    await addDoc(collection(db, "adminLogs"), {
      adminId: user.uid,
      adminName: user.displayName,
      targetUserId,
      targetUserName,
      action,
      details,
      createdAt: new Date().toISOString(),
    })
  }

  const markNotificationsAsRead = async (targetIds?: string[]) => {
    if (!user) return

    const unreadIds =
      targetIds ??
      notifications
        .filter((notification) => !notification.readAt)
        .map((notification) => notification.id)

    if (unreadIds.length === 0) {
      return
    }

    const batch = writeBatch(db)
    const readAt = new Date().toISOString()

    unreadIds.forEach((notificationId) => {
      batch.update(doc(db, "notifications", notificationId), {
        readAt,
      })
    })

    await batch.commit()
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null)
        setRequests([])
        setAllRequests([])
        setAllUsers([])
        setAdminLogs([])
        setCompLeaveGrants([])
        setRequestReasons({})
        setNotifications([])
        setEditingRequest(null)
        setIsRequestModalOpen(false)
        setIsNotificationOpen(false)
        setLoading(false)
        return
      }

      const blockedUserSnapshot = await getDoc(doc(db, "blockedUsers", firebaseUser.uid))
      if (blockedUserSnapshot.exists()) {
        await signOut(auth)
        toast.error("삭제된 직원 계정입니다. 관리자에게 문의해 주세요.")
        setLoading(false)
        return
      }

      const userRef = doc(db, "users", firebaseUser.uid)
      const snapshot = await getDoc(userRef)

      if (snapshot.exists()) {
        setUser(
          await syncUserIfNeeded(normalizeFirestoreUser(firebaseUser.uid, snapshot.data()))
        )
      } else {
        const joinDate = new Date().toISOString().split("T")[0]
        const nextUser: User = {
          uid: firebaseUser.uid,
          email: firebaseUser.email ?? "",
          displayName: firebaseUser.displayName ?? "사용자",
          role: firebaseUser.email === OWNER_ADMIN_EMAIL ? "ADMIN" : "EMPLOYEE",
          totalLeave: calculateAnnualLeave(joinDate, joinDate),
          usedLeave: 0,
          totalCompLeave: 0,
          usedCompLeave: 0,
          joinDate,
          carryoverLeaves: [],
          nextLeaveAccrualDate: getNextLeaveAccrualDate(joinDate, joinDate),
        }
        await setDoc(userRef, nextUser)
        setUser(nextUser)
      }

      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  useEffect(() => {
    if (!user) return

    const personalRequestsQuery = query(
      collection(db, "leaveRequests"),
      where("userId", "==", user.uid)
    )

    return onSnapshot(personalRequestsQuery, (snapshot) => {
      const nextRequests = snapshot.docs.map((docItem) => ({
        id: docItem.id,
        ...docItem.data(),
      })) as LeaveRequest[]

      setRequests(sortByCreatedAtDesc(nextRequests))
    })
  }, [user])

  useEffect(() => {
    if (!user) return

    return onSnapshot(collection(db, "leaveRequests"), (snapshot) => {
      const nextRequests = snapshot.docs.map((docItem) => ({
        id: docItem.id,
        ...docItem.data(),
      })) as LeaveRequest[]

      setAllRequests(sortByCreatedAtDesc(nextRequests))
    })
  }, [user])

  useEffect(() => {
    if (!user) {
      setRequestReasons({})
      return
    }

    const reasonsQuery = canManage
      ? collection(db, "leaveRequestReasons")
      : query(collection(db, "leaveRequestReasons"), where("userId", "==", user.uid))

    return onSnapshot(reasonsQuery, (snapshot) => {
      setRequestReasons(
        snapshot.docs.reduce<Record<string, string>>((accumulator, reasonDoc) => {
          const reason = (reasonDoc.data() as { reason?: string }).reason
          if (reason) {
            accumulator[reasonDoc.id] = reason
          }
          return accumulator
        }, {})
      )
    })
  }, [canManage, user])

  useEffect(() => {
    if (!user) {
      setCompLeaveGrants([])
      return
    }

    const grantsQuery = query(
      collection(db, "compLeaveGrants"),
      where("userId", "==", user.uid)
    )

    return onSnapshot(grantsQuery, (snapshot) => {
      const nextGrants = snapshot.docs.map((grantDoc) => ({
        id: grantDoc.id,
        ...grantDoc.data(),
      })) as CompLeaveGrant[]

      setCompLeaveGrants(
        [...nextGrants].sort((left, right) => right.grantedAt.localeCompare(left.grantedAt))
      )
    })
  }, [user])

  useEffect(() => {
    if (!user) {
      setNotifications([])
      return
    }

    const notificationsQuery = query(
      collection(db, "notifications"),
      where("userId", "==", user.uid)
    )

    return onSnapshot(notificationsQuery, (snapshot) => {
      const nextNotifications = snapshot.docs.map((notificationDoc) => ({
        id: notificationDoc.id,
        ...notificationDoc.data(),
      })) as AppNotification[]

      setNotifications(sortByCreatedAtDesc(nextNotifications))
    })
  }, [user])

  useEffect(() => {
    if (!canManage) {
      setAllUsers([])
      return
    }

    return onSnapshot(collection(db, "users"), (snapshot) => {
      const nextUsers = snapshot.docs
        .map((userDoc) => normalizeFirestoreUser(userDoc.id, userDoc.data()))
        .sort((left, right) => left.displayName.localeCompare(right.displayName))

      setAllUsers(nextUsers)
      nextUsers.forEach((candidate) => {
        void syncUserIfNeeded(candidate)
      })
    })
  }, [canManage])

  useEffect(() => {
    if (!canManage) {
      setAdminLogs([])
      return
    }

    return onSnapshot(collection(db, "adminLogs"), (snapshot) => {
      const nextLogs = snapshot.docs.map((docItem) => ({
        id: docItem.id,
        ...docItem.data(),
      })) as AdminLog[]

      setAdminLogs(sortByCreatedAtDesc(nextLogs))
    })
  }, [canManage])

  useEffect(() => {
    if (!canManage || allRequests.length === 0) return

    const migrateReasons = async () => {
      const legacyRequests = allRequests.filter(
        (request) => typeof request.reason === "string" && request.reason.length > 0
      )

      for (const request of legacyRequests) {
        await setDoc(
          doc(db, "leaveRequestReasons", request.id),
          {
            requestId: request.id,
            userId: request.userId,
            reason: request.reason,
            createdAt: request.createdAt,
          },
          { merge: true }
        )

        await updateDoc(doc(db, "leaveRequests", request.id), {
          reason: deleteField(),
        })
      }
    }

    void migrateReasons()
  }, [allRequests, canManage])
  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, new GoogleAuthProvider())
      toast.success("로그인되었습니다.")
    } catch (error) {
      console.error(error)

      const code =
        typeof error === "object" && error && "code" in error
          ? String((error as { code?: string }).code)
          : ""

      if (code === "auth/unauthorized-domain") {
        toast.error(
          "Firebase Authentication 설정에서 localhost 또는 127.0.0.1을 허용 도메인에 추가해 주세요."
        )
        return
      }

      if (code === "auth/popup-blocked") {
        toast.error("브라우저 팝업 차단을 해제한 뒤 다시 시도해 주세요.")
        return
      }

      toast.error("로그인에 실패했습니다. 잠시 후 다시 시도해 주세요.")
    }
  }

  const handleLogout = async () => {
    await signOut(auth)
    toast.success("로그아웃되었습니다.")
  }

  const handleRequestModalChange = (open: boolean) => {
    setIsRequestModalOpen(open)
    if (!open) {
      setEditingRequest(null)
    }
  }

  const handleNotificationOpenChange = (open: boolean) => {
    setIsNotificationOpen(open)

    if (open) {
      void markNotificationsAsRead()
    }
  }

  const startEditingRequest = (request: LeaveRequest) => {
    setEditingRequest(request)
    setIsRequestModalOpen(true)
  }

  const submitRequest = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!user) return

    const formData = new FormData(event.currentTarget)
    const type = String(formData.get("type") ?? "") as LeaveType
    const startDate = String(formData.get("startDate") ?? "")
    const endDate = String(formData.get("endDate") ?? "")
    const reason = String(formData.get("reason") ?? "").trim()

    if (!type || !startDate || !endDate || !reason) {
      toast.error("휴가 종류, 기간, 사유를 모두 입력해 주세요.")
      return
    }

    if (endDate < startDate) {
      toast.error("종료일은 시작일보다 빠를 수 없습니다.")
      return
    }

    if (type === "HALF_DAY" && startDate !== endDate) {
      toast.error("반차는 하루만 선택할 수 있습니다.")
      return
    }

    const start = new Date(startDate)
    const end = new Date(endDate)
    const diffDays =
      Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
    const daysCount = type === "HALF_DAY" ? 0.5 : diffDays

    const currentUser = await loadAndSyncUser(user.uid)
    if (!currentUser) {
      toast.error("사용자 정보를 다시 불러오지 못했습니다.")
      return
    }

    if (type === "COMPENSATORY") {
      if (currentUser.totalCompLeave - currentUser.usedCompLeave < daysCount) {
        toast.error("잔여 대체휴일이 부족합니다.")
        return
      }
    } else if (type === "ANNUAL" || type === "HALF_DAY") {
      if (getAvailableAnnualLeave(currentUser) < daysCount) {
        toast.error("사용 가능한 연차가 부족합니다.")
        return
      }
    }

    try {
      if (editingRequest && editingRequest.status !== "PENDING") {
        toast.error("승인 대기 중인 요청만 수정할 수 있습니다.")
        return
      }

      const submittedAt = new Date().toISOString()
      const isEditing = editingRequest !== null
      const requestRef = editingRequest
        ? doc(db, "leaveRequests", editingRequest.id)
        : doc(collection(db, "leaveRequests"))
      const batch = writeBatch(db)

      batch.set(requestRef, {
        id: requestRef.id,
        userId: currentUser.uid,
        userName: currentUser.displayName,
        type,
        startDate,
        endDate,
        status: "PENDING",
        createdAt: submittedAt,
        daysCount,
      })

      batch.set(doc(db, "leaveRequestReasons", requestRef.id), {
        requestId: requestRef.id,
        userId: currentUser.uid,
        reason,
        createdAt: submittedAt,
      })

      await batch.commit()
      setUser(currentUser)
      handleRequestModalChange(false)

      await notifyPrivilegedUsers(
        isEditing ? "휴가 신청이 다시 제출되었습니다" : "새 휴가 신청이 등록되었습니다",
        `${currentUser.displayName}님이 ${getLeaveTypeLabel(type)} ${formatLeaveAmount(daysCount)}일을 ${isEditing ? "수정 후 다시 제출" : "신청"}했습니다.`,
        "admin"
      )

      toast.success(
        isEditing ? "휴가 신청을 수정하고 다시 제출했습니다." : "휴가 신청이 완료되었습니다."
      )
    } catch (error) {
      console.error(error)
      toast.error("신청 중 오류가 발생했습니다.")
    }
  }

  const cancelOwnRequest = async (request: LeaveRequest) => {
    if (!user) return

    if (request.userId !== user.uid || request.status !== "PENDING") {
      toast.error("승인 대기 중인 내 요청만 취소할 수 있습니다.")
      return
    }

    try {
      const batch = writeBatch(db)
      batch.delete(doc(db, "leaveRequests", request.id))
      batch.delete(doc(db, "leaveRequestReasons", request.id))
      await batch.commit()

      if (editingRequest?.id === request.id) {
        handleRequestModalChange(false)
      }

      await notifyPrivilegedUsers(
        "휴가 신청이 취소되었습니다",
        `${user.displayName}님이 ${getLeaveTypeLabel(request.type)} ${formatLeaveAmount(request.daysCount)}일 신청을 취소했습니다.`,
        "admin"
      )

      toast.success("휴가 신청을 취소했습니다.")
    } catch (error) {
      console.error(error)
      toast.error("신청 취소 중 오류가 발생했습니다.")
    }
  }

  const handleAdminAction = async (
    request: LeaveRequest,
    status: "APPROVED" | "REJECTED"
  ) => {
    if (!user) return

    try {
      const batch = writeBatch(db)
      const requestRef = doc(db, "leaveRequests", request.id)
      const targetUserRef = doc(db, "users", request.userId)
      const requestUpdate: Record<string, unknown> = { status }
      let nextTargetUser: User | null = null

      if (status === "APPROVED") {
        const targetUserSnapshot = await getDoc(targetUserRef)
        if (!targetUserSnapshot.exists()) {
          toast.error("대상 직원 정보를 찾지 못했습니다.")
          return
        }

        const syncedTargetUser = syncAnnualLeaveIfNeeded(
          normalizeFirestoreUser(request.userId, targetUserSnapshot.data())
        ).user
        nextTargetUser = syncedTargetUser

        if (request.type === "COMPENSATORY") {
          nextTargetUser = {
            ...syncedTargetUser,
            usedCompLeave: syncedTargetUser.usedCompLeave + request.daysCount,
          }
          requestUpdate.approvalAdjustment = { compDays: request.daysCount }

          batch.update(targetUserRef, {
            totalLeave: nextTargetUser.totalLeave,
            usedLeave: nextTargetUser.usedLeave,
            carryoverLeaves: nextTargetUser.carryoverLeaves,
            nextLeaveAccrualDate: nextTargetUser.nextLeaveAccrualDate,
            usedCompLeave: nextTargetUser.usedCompLeave,
          })
        } else if (request.type === "ANNUAL" || request.type === "HALF_DAY") {
          const approved = consumeAnnualLeaveWithAdjustment(
            syncedTargetUser,
            request.daysCount
          )
          nextTargetUser = approved.user
          requestUpdate.approvalAdjustment = approved.adjustment

          batch.update(targetUserRef, {
            totalLeave: nextTargetUser.totalLeave,
            usedLeave: nextTargetUser.usedLeave,
            carryoverLeaves: nextTargetUser.carryoverLeaves,
            nextLeaveAccrualDate: nextTargetUser.nextLeaveAccrualDate,
          })
        } else {
          batch.update(targetUserRef, {
            totalLeave: nextTargetUser.totalLeave,
            usedLeave: nextTargetUser.usedLeave,
            carryoverLeaves: nextTargetUser.carryoverLeaves,
            nextLeaveAccrualDate: nextTargetUser.nextLeaveAccrualDate,
          })
        }
      }

      batch.update(requestRef, requestUpdate)
      await batch.commit()

      if (nextTargetUser?.uid === user.uid) {
        setUser(nextTargetUser)
      }

      await logAdminAction(
        status === "APPROVED" ? "APPROVE_LEAVE" : "REJECT_LEAVE",
        request.userId,
        request.userName,
        `${getLeaveTypeLabel(request.type)} ${formatLeaveAmount(request.daysCount)}일 ${status === "APPROVED" ? "승인" : "반려"}`
      )

      await notifyUser(
        request.userId,
        status === "APPROVED" ? "휴가 신청이 승인되었습니다" : "휴가 신청이 반려되었습니다",
        `${getLeaveTypeLabel(request.type)} ${formatLeaveAmount(request.daysCount)}일 신청이 ${status === "APPROVED" ? "승인" : "반려"}되었습니다.`,
        "dashboard"
      )

      toast.success(`휴가 요청을 ${status === "APPROVED" ? "승인" : "반려"}했습니다.`)
    } catch (error) {
      console.error(error)
      toast.error("처리 중 오류가 발생했습니다.")
    }
  }

  const cancelApproval = async (request: LeaveRequest) => {
    if (!user) return
    if (request.status !== "APPROVED") {
      toast.error("승인된 요청만 취소할 수 있습니다.")
      return
    }

    try {
      const batch = writeBatch(db)
      const requestRef = doc(db, "leaveRequests", request.id)
      const targetUserRef = doc(db, "users", request.userId)
      const targetUserSnapshot = await getDoc(targetUserRef)

      if (!targetUserSnapshot.exists()) {
        toast.error("대상 직원 정보를 찾지 못했습니다.")
        return
      }

      const syncedTargetUser = syncAnnualLeaveIfNeeded(
        normalizeFirestoreUser(request.userId, targetUserSnapshot.data())
      ).user
      let nextTargetUser = syncedTargetUser

      if (request.type === "COMPENSATORY") {
        const restoredCompDays = request.approvalAdjustment?.compDays ?? request.daysCount
        nextTargetUser = {
          ...syncedTargetUser,
          usedCompLeave: Math.max(0, syncedTargetUser.usedCompLeave - restoredCompDays),
        }

        batch.update(targetUserRef, {
          totalLeave: nextTargetUser.totalLeave,
          usedLeave: nextTargetUser.usedLeave,
          carryoverLeaves: nextTargetUser.carryoverLeaves,
          nextLeaveAccrualDate: nextTargetUser.nextLeaveAccrualDate,
          usedCompLeave: nextTargetUser.usedCompLeave,
        })
      } else if (request.type === "ANNUAL" || request.type === "HALF_DAY") {
        nextTargetUser = restoreAnnualLeave(syncedTargetUser, request.approvalAdjustment ?? {
          currentYearDays: request.daysCount,
          carryoverUsage: [],
        })

        batch.update(targetUserRef, {
          totalLeave: nextTargetUser.totalLeave,
          usedLeave: nextTargetUser.usedLeave,
          carryoverLeaves: nextTargetUser.carryoverLeaves,
          nextLeaveAccrualDate: nextTargetUser.nextLeaveAccrualDate,
        })
      } else {
        batch.update(targetUserRef, {
          totalLeave: nextTargetUser.totalLeave,
          usedLeave: nextTargetUser.usedLeave,
          carryoverLeaves: nextTargetUser.carryoverLeaves,
          nextLeaveAccrualDate: nextTargetUser.nextLeaveAccrualDate,
        })
      }

      batch.update(requestRef, {
        status: "PENDING",
        approvalAdjustment: deleteField(),
        adminComment: deleteField(),
      })

      await batch.commit()

      if (nextTargetUser.uid === user.uid) {
        setUser(nextTargetUser)
      }

      await logAdminAction(
        "CANCEL_APPROVAL",
        request.userId,
        request.userName,
        `${getLeaveTypeLabel(request.type)} ${formatLeaveAmount(request.daysCount)}일 승인 취소 후 승인 대기 중으로 복구`
      )

      await notifyUser(
        request.userId,
        "휴가 승인이 취소되었습니다",
        `${getLeaveTypeLabel(request.type)} ${formatLeaveAmount(request.daysCount)}일 신청이 다시 승인 대기 중으로 돌아갔습니다. 내용을 수정하거나 취소할 수 있습니다.`,
        "dashboard"
      )

      toast.success("승인을 취소하고 요청을 다시 승인 대기 중으로 돌렸습니다.")
    } catch (error) {
      console.error(error)
      toast.error("승인 취소 중 오류가 발생했습니다.")
    }
  }

  const grantCompLeave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!selectedUserForGrant || !user) return

    const formData = new FormData(event.currentTarget)
    const amount = Number.parseFloat(String(formData.get("amount") ?? ""))
    const workDate = String(formData.get("workDate") ?? "")

    if (!Number.isFinite(amount) || amount <= 0 || !workDate) {
      toast.error("부여 일수와 근무 기준일을 모두 입력해 주세요.")
      return
    }

    try {
      const updatedTargetUser = {
        ...selectedUserForGrant,
        totalCompLeave: selectedUserForGrant.totalCompLeave + amount,
      }

      const grantedAt = new Date().toISOString()
      const grantRef = doc(collection(db, "compLeaveGrants"))
      const batch = writeBatch(db)

      batch.update(doc(db, "users", selectedUserForGrant.uid), {
        totalCompLeave: updatedTargetUser.totalCompLeave,
      })
      batch.set(grantRef, {
        id: grantRef.id,
        userId: selectedUserForGrant.uid,
        amount,
        workDate,
        grantedAt,
        grantedBy: user.uid,
        grantedByName: user.displayName,
      })

      await batch.commit()

      if (user?.uid === selectedUserForGrant.uid) {
        setUser(updatedTargetUser)
      }

      await logAdminAction(
        "GRANT_COMP",
        selectedUserForGrant.uid,
        selectedUserForGrant.displayName,
        `대체휴일 ${formatLeaveAmount(amount)}일 부여 (${workDate} 근무분)`
      )

      await notifyUser(
        selectedUserForGrant.uid,
        "대체휴일이 부여되었습니다",
        `${formatLeaveAmount(amount)}일의 대체휴일이 추가되었습니다. ${workDate} 근무분입니다.`,
        "dashboard"
      )

      setIsGrantModalOpen(false)
      setSelectedUserForGrant(null)
      toast.success("대체휴일을 부여했습니다.")
    } catch (error) {
      console.error(error)
      toast.error("부여 중 오류가 발생했습니다.")
    }
  }

  const adjustUserLeave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!selectedUserForAdjust) return

    const formData = new FormData(event.currentTarget)
    const joinDate = String(formData.get("joinDate") ?? "")
    const totalLeave = Number.parseFloat(String(formData.get("totalLeave") ?? ""))
    const totalCompLeave = Number.parseFloat(String(formData.get("totalCompLeave") ?? ""))

    if (!joinDate || !Number.isFinite(totalLeave) || !Number.isFinite(totalCompLeave)) {
      toast.error("입사일과 연차 정보를 확인해 주세요.")
      return
    }

    if (totalLeave < 0 || totalCompLeave < 0) {
      toast.error("휴가 값은 음수일 수 없습니다.")
      return
    }

    const nextLeaveAccrualDate = getNextLeaveAccrualDate(joinDate)

    try {
      await updateDoc(doc(db, "users", selectedUserForAdjust.uid), {
        joinDate,
        totalLeave,
        totalCompLeave,
        nextLeaveAccrualDate,
      })

      if (user?.uid === selectedUserForAdjust.uid) {
        setUser({
          ...user,
          joinDate,
          totalLeave,
          totalCompLeave,
          nextLeaveAccrualDate,
        })
      }

      await logAdminAction(
        "ADJUST_LEAVE",
        selectedUserForAdjust.uid,
        selectedUserForAdjust.displayName,
        `입사일 ${selectedUserForAdjust.joinDate} -> ${joinDate}, 기본 연차 ${formatLeaveAmount(selectedUserForAdjust.totalLeave)} -> ${formatLeaveAmount(totalLeave)}, 대체휴일 ${formatLeaveAmount(selectedUserForAdjust.totalCompLeave)} -> ${formatLeaveAmount(totalCompLeave)}`
      )

      await notifyUser(
        selectedUserForAdjust.uid,
        "휴가 기준이 조정되었습니다",
        "입사일 또는 휴가 수치가 변경되었습니다. 연차 발생 내역을 확인해 주세요.",
        "dashboard"
      )

      setIsAdjustModalOpen(false)
      setSelectedUserForAdjust(null)
      toast.success("직원 정보를 수정했습니다.")
    } catch (error) {
      console.error(error)
      toast.error("수정 중 오류가 발생했습니다.")
    }
  }

  const changeUserRole = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!selectedUserForRole) return

    const role = String(
      new FormData(event.currentTarget).get("role") ?? ""
    ) as User["role"]

    if (!role) {
      toast.error("권한을 선택해 주세요.")
      return
    }

    try {
      await updateDoc(doc(db, "users", selectedUserForRole.uid), { role })

      if (user?.uid === selectedUserForRole.uid) {
        setUser({ ...user, role })
      }

      await logAdminAction(
        "SET_ROLE",
        selectedUserForRole.uid,
        selectedUserForRole.displayName,
        `권한 변경 ${getRoleLabel(selectedUserForRole.role)} -> ${getRoleLabel(role)}`
      )

      await notifyUser(
        selectedUserForRole.uid,
        "권한이 변경되었습니다",
        `현재 권한이 ${getRoleLabel(role)}(으)로 변경되었습니다.`,
        "dashboard"
      )

      setIsRoleModalOpen(false)
      setSelectedUserForRole(null)
      toast.success("권한을 변경했습니다.")
    } catch (error) {
      console.error(error)
      toast.error("권한 변경 중 오류가 발생했습니다.")
    }
  }

  const deleteUserAccount = async (member: User) => {
    if (!user) return

    if (member.uid === user.uid) {
      toast.error("현재 로그인한 계정은 삭제할 수 없습니다.")
      return
    }

    if (member.role !== "EMPLOYEE") {
      toast.error("직원 계정만 삭제할 수 있습니다.")
      return
    }

    if (
      !window.confirm(
        `${member.displayName} 직원을 삭제할까요?\n휴가 신청, 사유, 알림, 대체휴일 기록이 함께 삭제되고 다시 로그인할 수 없습니다.`
      )
    ) {
      return
    }

    try {
      const [requestsSnapshot, reasonsSnapshot, notificationsSnapshot, grantsSnapshot] =
        await Promise.all([
          getDocs(query(collection(db, "leaveRequests"), where("userId", "==", member.uid))),
          getDocs(
            query(collection(db, "leaveRequestReasons"), where("userId", "==", member.uid))
          ),
          getDocs(query(collection(db, "notifications"), where("userId", "==", member.uid))),
          getDocs(query(collection(db, "compLeaveGrants"), where("userId", "==", member.uid))),
        ])

      const batch = writeBatch(db)

      batch.set(doc(db, "blockedUsers", member.uid), {
        uid: member.uid,
        email: member.email,
        displayName: member.displayName,
        deletedAt: new Date().toISOString(),
        deletedBy: user.uid,
      })
      batch.delete(doc(db, "users", member.uid))

      requestsSnapshot.docs.forEach((requestDoc) => {
        batch.delete(requestDoc.ref)
      })
      reasonsSnapshot.docs.forEach((reasonDoc) => {
        batch.delete(reasonDoc.ref)
      })
      notificationsSnapshot.docs.forEach((notificationDoc) => {
        batch.delete(notificationDoc.ref)
      })
      grantsSnapshot.docs.forEach((grantDoc) => {
        batch.delete(grantDoc.ref)
      })

      await batch.commit()

      await logAdminAction(
        "DELETE_USER",
        member.uid,
        member.displayName,
        "직원 계정과 관련 휴가 데이터를 삭제하고 접근을 차단함"
      )

      if (selectedUserForGrant?.uid === member.uid) {
        setSelectedUserForGrant(null)
        setIsGrantModalOpen(false)
      }
      if (selectedUserForAdjust?.uid === member.uid) {
        setSelectedUserForAdjust(null)
        setIsAdjustModalOpen(false)
      }
      if (selectedUserForRole?.uid === member.uid) {
        setSelectedUserForRole(null)
        setIsRoleModalOpen(false)
      }

      toast.success("직원을 삭제했습니다.")
    } catch (error) {
      console.error(error)
      toast.error("직원 삭제 중 오류가 발생했습니다.")
    }
  }
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-black border-t-transparent" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fafafa] px-4">
        <Toaster position="top-center" />
        <div className="w-full max-w-md rounded-3xl border bg-white p-10 text-center shadow-sm">
          <div className="space-y-3">
            <p className="text-sm font-medium text-muted-foreground">Tips Leave Manager</p>
            <h1 className="text-3xl font-bold tracking-tight">
              연차와 휴가를
              <br />
              한 화면에서 관리해 보세요
            </h1>
            <p className="text-sm leading-6 text-muted-foreground">
              Google 계정으로 로그인하면 개인 휴가 신청, 회사 전체 휴가 현황, 연차 발생
              내역까지 바로 확인할 수 있습니다.
            </p>
          </div>
          <Button onClick={handleLogin} size="lg" className="mt-8 w-full">
            Google 계정으로 시작하기
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#fafafa] text-black">
      <Toaster position="top-center" />
      <nav className="sticky top-0 z-40 border-b bg-white/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-8">
            <span className="text-xl font-bold tracking-tight">Tips Leave Manager</span>
            <div className="hidden items-center gap-1 md:flex">
              <NavButton
                active={activeTab === "dashboard"}
                onClick={() => setActiveTab("dashboard")}
                icon={<LayoutDashboard size={18} />}
                label="대시보드"
              />
              <NavButton
                active={activeTab === "history"}
                onClick={() => setActiveTab("history")}
                icon={<History size={18} />}
                label="휴가 현황"
              />
              {canManage && (
                <NavButton
                  active={activeTab === "admin"}
                  onClick={() => setActiveTab("admin")}
                  icon={<ShieldCheck size={18} />}
                  label="관리 도구"
                />
              )}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Popover open={isNotificationOpen} onOpenChange={handleNotificationOpenChange}>
              <PopoverTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon"
                    className="relative text-muted-foreground hover:text-black"
                  />
                }
              >
                <Bell size={18} />
                {unreadNotificationCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-black px-1 text-[10px] text-white">
                    {unreadNotificationCount > 9 ? "9+" : unreadNotificationCount}
                  </span>
                )}
                <span className="sr-only">알림 열기</span>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0" align="end" sideOffset={12}>
                <PopoverHeader className="border-b px-4 py-3">
                  <PopoverTitle>알림</PopoverTitle>
                </PopoverHeader>
                <div className="max-h-96 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="px-4 py-6 text-sm text-muted-foreground">
                      아직 받은 알림이 없습니다.
                    </div>
                  ) : (
                    notifications.map((notification) => (
                      <button
                        key={notification.id}
                        type="button"
                        onClick={() => {
                          if (notification.linkTab) {
                            setActiveTab(notification.linkTab)
                          }
                          setIsNotificationOpen(false)
                        }}
                        className="flex w-full flex-col gap-1 border-b px-4 py-3 text-left transition-colors hover:bg-muted/50"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <p className="text-sm font-medium">{notification.title}</p>
                          {!notification.readAt && (
                            <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-black" />
                          )}
                        </div>
                        <p className="text-sm leading-5 text-muted-foreground">
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDateTime(notification.createdAt)}
                        </p>
                      </button>
                    ))
                  )}
                </div>
              </PopoverContent>
            </Popover>

            <div className="flex items-center gap-2">
              <div className="text-right">
                <p className="text-sm font-medium">{user.displayName}</p>
                <p className="text-xs text-muted-foreground">{getRoleLabel(user.role)}</p>
              </div>
              <Avatar className="h-8 w-8 border">
                <AvatarImage
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`}
                />
                <AvatarFallback>{getDisplayInitial(user.displayName)}</AvatarFallback>
              </Avatar>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="text-muted-foreground hover:text-black"
            >
              <LogOut size={18} />
            </Button>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        {activeTab === "dashboard" && (
          <DashboardSection
            user={user}
            requests={requests}
            requestReasons={requestReasons}
            grantHistory={grantHistory}
            editingRequest={editingRequest}
            isRequestModalOpen={isRequestModalOpen}
            onRequestModalChange={handleRequestModalChange}
            onSubmitRequest={submitRequest}
            onEditRequest={startEditingRequest}
            onCancelRequest={(request) => void cancelOwnRequest(request)}
            availableAnnualLeave={availableAnnualLeave}
            carryoverBalance={carryoverBalance}
          />
        )}

        {activeTab === "history" && (
          <HistorySection
            allRequests={allRequests}
            requestReasons={requestReasons}
            showLeaveReason={showLeaveReason}
          />
        )}

        {activeTab === "admin" && canManage && (
          <AdminSection
            user={user}
            managedRequests={managedRequests}
            requestReasons={requestReasons}
            adminLogs={adminLogs}
            allUsers={allUsers}
            isRoleModalOpen={isRoleModalOpen}
            selectedUserForRole={selectedUserForRole}
            onRoleModalChange={(open, member) => {
              setIsRoleModalOpen(open)
              setSelectedUserForRole(open ? member ?? null : null)
            }}
            onChangeUserRole={changeUserRole}
            isAdjustModalOpen={isAdjustModalOpen}
            selectedUserForAdjust={selectedUserForAdjust}
            onAdjustModalChange={(open, member) => {
              setIsAdjustModalOpen(open)
              setSelectedUserForAdjust(open ? member ?? null : null)
            }}
            onAdjustUserLeave={adjustUserLeave}
            isGrantModalOpen={isGrantModalOpen}
            selectedUserForGrant={selectedUserForGrant}
            onGrantModalChange={(open, member) => {
              setIsGrantModalOpen(open)
              setSelectedUserForGrant(open ? member ?? null : null)
            }}
            onGrantCompLeave={grantCompLeave}
            onDeleteUser={(member) => void deleteUserAccount(member)}
            onApproveRequest={(request) => void handleAdminAction(request, "APPROVED")}
            onRejectRequest={(request) => void handleAdminAction(request, "REJECTED")}
            onCancelApproval={(request) => void cancelApproval(request)}
          />
        )}
      </main>
    </div>
  )
}
