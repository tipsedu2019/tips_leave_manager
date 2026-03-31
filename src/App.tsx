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
  increment,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore"
import { History, LayoutDashboard, LogOut, ShieldCheck } from "lucide-react"
import { Toaster, toast } from "sonner"

import { auth, db } from "./firebase"
import { AdminLog, LeaveRequest, LeaveType, User } from "./types"
import { calculateAnnualLeave, getLeaveTypeLabel } from "./lib/utils"
import { normalizeUserRecord } from "./lib/user-records"
import { canViewLeaveReason, getRoleLabel, isPrivilegedRole } from "./lib/roles"
import {
  consumeAnnualLeave,
  getAvailableAnnualLeave,
  getCarryoverBalance,
  getNextLeaveAccrualDate,
  syncAnnualLeaveIfNeeded,
} from "./lib/leave-management"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { AdminSection } from "./components/admin-section"
import { DashboardSection } from "./components/dashboard-section"
import { HistorySection } from "./components/history-section"
import { NavButton, getDisplayInitial } from "./components/leave-common"

const OWNER_ADMIN_EMAIL = "yeoyuasset@gmail.com"

export default function App() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("dashboard")

  const [requests, setRequests] = useState<LeaveRequest[]>([])
  const [allRequests, setAllRequests] = useState<LeaveRequest[]>([])
  const [allUsers, setAllUsers] = useState<User[]>([])
  const [adminLogs, setAdminLogs] = useState<AdminLog[]>([])
  const [requestReasons, setRequestReasons] = useState<Record<string, string>>({})

  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false)
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
  const pendingRequests = useMemo(
    () => allRequests.filter((request) => request.status === "PENDING"),
    [allRequests]
  )

  const normalizeFirestoreUser = (uid: string, data: Record<string, unknown>) =>
    normalizeUserRecord({
      uid,
      ...data,
    } as Partial<User> & Pick<User, "uid" | "email" | "displayName" | "role">)

  const syncUserIfNeeded = async (candidate: User) => {
    const result = syncAnnualLeaveIfNeeded(candidate)
    if (result.changed) {
      await updateDoc(doc(db, "users", candidate.uid), {
        totalLeave: result.user.totalLeave,
        usedLeave: result.user.usedLeave,
        carryoverLeaves: result.user.carryoverLeaves,
        nextLeaveAccrualDate: result.user.nextLeaveAccrualDate,
      })
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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null)
        setRequests([])
        setAllRequests([])
        setAllUsers([])
        setAdminLogs([])
        setRequestReasons({})
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
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    )
    return onSnapshot(personalRequestsQuery, (snapshot) => {
      setRequests(snapshot.docs.map((docItem) => ({ id: docItem.id, ...docItem.data() } as LeaveRequest)))
    })
  }, [user])

  useEffect(() => {
    if (!user) return
    const allRequestsQuery = query(collection(db, "leaveRequests"), orderBy("createdAt", "desc"))
    return onSnapshot(allRequestsQuery, (snapshot) => {
      setAllRequests(snapshot.docs.map((docItem) => ({ id: docItem.id, ...docItem.data() } as LeaveRequest)))
    })
  }, [user])

  useEffect(() => {
    if (!canManage) {
      setRequestReasons({})
      return
    }
    return onSnapshot(collection(db, "leaveRequestReasons"), (snapshot) => {
      setRequestReasons(
        snapshot.docs.reduce<Record<string, string>>((accumulator, reasonDoc) => {
          const reason = (reasonDoc.data() as { reason?: string }).reason
          if (reason) accumulator[reasonDoc.id] = reason
          return accumulator
        }, {})
      )
    })
  }, [canManage])

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
      nextUsers.forEach((candidate) => void syncUserIfNeeded(candidate))
    })
  }, [canManage])

  useEffect(() => {
    if (!canManage) {
      setAdminLogs([])
      return
    }
    const logsQuery = query(collection(db, "adminLogs"), orderBy("createdAt", "desc"))
    return onSnapshot(logsQuery, (snapshot) => {
      setAdminLogs(snapshot.docs.map((docItem) => ({ id: docItem.id, ...docItem.data() } as AdminLog)))
    })
  }, [canManage])

  useEffect(() => {
    if (!canManage || allRequests.length === 0) return
    const migrateReasons = async () => {
      const legacyRequests = allRequests.filter(
        (request) => typeof request.reason === "string" && request.reason.length > 0
      )
      for (const request of legacyRequests) {
        await setDoc(doc(db, "leaveRequestReasons", request.id), {
          requestId: request.id,
          userId: request.userId,
          reason: request.reason,
          createdAt: request.createdAt,
        }, { merge: true })
        await updateDoc(doc(db, "leaveRequests", request.id), { reason: deleteField() })
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
      const code = typeof error === "object" && error && "code" in error ? String((error as { code?: string }).code) : ""
      if (code === "auth/unauthorized-domain") {
        toast.error("Firebase Authentication 설정에서 localhost와 127.0.0.1을 허용 도메인에 추가해 주세요.")
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

  const submitRequest = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!user) return

    const formData = new FormData(event.currentTarget)
    const type = String(formData.get("type") ?? "") as LeaveType
    const startDate = String(formData.get("startDate") ?? "")
    const endDate = String(formData.get("endDate") ?? "")
    const reason = String(formData.get("reason") ?? "").trim()

    if (!startDate || !endDate || !reason) {
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
      const createdAt = new Date().toISOString()
      const requestRef = doc(collection(db, "leaveRequests"))

      await setDoc(requestRef, {
        id: requestRef.id,
        userId: currentUser.uid,
        userName: currentUser.displayName,
        type,
        startDate,
        endDate,
        status: "PENDING",
        createdAt,
        daysCount,
      })

      await setDoc(doc(db, "leaveRequestReasons", requestRef.id), {
        requestId: requestRef.id,
        userId: currentUser.uid,
        reason,
        createdAt,
      })

      setUser(currentUser)
      setIsRequestModalOpen(false)
      toast.success("휴가 신청이 완료되었습니다.")
    } catch (error) {
      console.error(error)
      toast.error("신청 중 오류가 발생했습니다.")
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

        if (request.type === "COMPENSATORY") {
          nextTargetUser = {
            ...syncedTargetUser,
            usedCompLeave: syncedTargetUser.usedCompLeave + request.daysCount,
          }

          batch.update(targetUserRef, {
            totalLeave: syncedTargetUser.totalLeave,
            usedLeave: syncedTargetUser.usedLeave,
            carryoverLeaves: syncedTargetUser.carryoverLeaves,
            nextLeaveAccrualDate: syncedTargetUser.nextLeaveAccrualDate,
            usedCompLeave: increment(request.daysCount),
          })
        } else if (request.type === "ANNUAL" || request.type === "HALF_DAY") {
          nextTargetUser = consumeAnnualLeave(syncedTargetUser, request.daysCount)
          batch.update(targetUserRef, {
            totalLeave: nextTargetUser.totalLeave,
            usedLeave: nextTargetUser.usedLeave,
            carryoverLeaves: nextTargetUser.carryoverLeaves,
            nextLeaveAccrualDate: nextTargetUser.nextLeaveAccrualDate,
          })
        }
      }

      batch.update(requestRef, { status })
      await batch.commit()

      if (nextTargetUser?.uid === user.uid) {
        setUser(nextTargetUser)
      }

      await logAdminAction(
        status === "APPROVED" ? "APPROVE_LEAVE" : "REJECT_LEAVE",
        request.userId,
        request.userName,
        `${getLeaveTypeLabel(request.type)} ${request.daysCount}일 ${status === "APPROVED" ? "승인" : "반려"}`
      )

      toast.success(
        `휴가 신청을 ${status === "APPROVED" ? "승인" : "반려"}했습니다.`
      )
    } catch (error) {
      console.error(error)
      toast.error("처리 중 오류가 발생했습니다.")
    }
  }

  const grantCompLeave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!selectedUserForGrant) return

    const amount = Number.parseFloat(
      String(new FormData(event.currentTarget).get("amount") ?? "")
    )

    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error("부여 일수는 0보다 커야 합니다.")
      return
    }

    try {
      await updateDoc(doc(db, "users", selectedUserForGrant.uid), {
        totalCompLeave: increment(amount),
      })

      if (user?.uid === selectedUserForGrant.uid) {
        setUser({ ...user, totalCompLeave: user.totalCompLeave + amount })
      }

      await logAdminAction(
        "GRANT_COMP",
        selectedUserForGrant.uid,
        selectedUserForGrant.displayName,
        `대체휴일 ${amount}일 부여`
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
    const totalCompLeave = Number.parseFloat(
      String(formData.get("totalCompLeave") ?? "")
    )

    if (!joinDate || !Number.isFinite(totalLeave) || !Number.isFinite(totalCompLeave)) {
      toast.error("입사일과 연차 정보를 확인해 주세요.")
      return
    }

    if (totalLeave < 0 || totalCompLeave < 0) {
      toast.error("연차 값은 음수가 될 수 없습니다.")
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
        `입사일 ${selectedUserForAdjust.joinDate} -> ${joinDate}, 기본 연차 ${selectedUserForAdjust.totalLeave} -> ${totalLeave}, 대체휴일 ${selectedUserForAdjust.totalCompLeave} -> ${totalCompLeave}`
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
        `권한 변경: ${getRoleLabel(selectedUserForRole.role)} -> ${getRoleLabel(role)}`
      )

      setIsRoleModalOpen(false)
      setSelectedUserForRole(null)
      toast.success("권한을 변경했습니다.")
    } catch (error) {
      console.error(error)
      toast.error("권한 변경 중 오류가 발생했습니다.")
    }
  }

  if (loading) {
    return <div className="flex h-screen items-center justify-center bg-white"><div className="h-8 w-8 animate-spin rounded-full border-2 border-black border-t-transparent" /></div>
  }

  if (!user) {
    return <div className="flex min-h-screen items-center justify-center bg-[#fafafa] px-4"><Toaster position="top-center" /><div className="w-full max-w-md rounded-3xl border bg-white p-10 text-center shadow-sm"><div className="space-y-3"><p className="text-sm font-medium text-muted-foreground">Tips Leave Manager</p><h1 className="text-3xl font-bold tracking-tight">연차와 휴가를<br />한 화면에서 관리하세요</h1><p className="text-sm leading-6 text-muted-foreground">Google 계정으로 로그인하면 개인 휴가 신청과 전사 휴가 현황 확인을 바로 시작할 수 있습니다.</p></div><Button onClick={handleLogin} size="lg" className="mt-8 w-full">Google 계정으로 시작하기</Button></div></div>
  }

  return (
    <div className="min-h-screen bg-[#fafafa] text-black">
      <Toaster position="top-center" />
      <nav className="sticky top-0 z-40 border-b bg-white/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-8">
            <span className="text-xl font-bold tracking-tight">Tips Leave Manager</span>
            <div className="hidden items-center gap-1 md:flex">
              <NavButton active={activeTab === "dashboard"} onClick={() => setActiveTab("dashboard")} icon={<LayoutDashboard size={18} />} label="대시보드" />
              <NavButton active={activeTab === "history"} onClick={() => setActiveTab("history")} icon={<History size={18} />} label="휴가 현황" />
              {canManage && <NavButton active={activeTab === "admin"} onClick={() => setActiveTab("admin")} icon={<ShieldCheck size={18} />} label="관리 도구" />}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="text-right">
                <p className="text-sm font-medium">{user.displayName}</p>
                <p className="text-xs text-muted-foreground">{getRoleLabel(user.role)}</p>
              </div>
              <Avatar className="h-8 w-8 border">
                <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`} />
                <AvatarFallback>{getDisplayInitial(user.displayName)}</AvatarFallback>
              </Avatar>
            </div>
            <Button variant="ghost" size="icon" onClick={handleLogout} className="text-muted-foreground hover:text-black">
              <LogOut size={18} />
            </Button>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        {activeTab === "dashboard" && <DashboardSection user={user} requests={requests} isRequestModalOpen={isRequestModalOpen} onRequestModalChange={setIsRequestModalOpen} onSubmitRequest={submitRequest} availableAnnualLeave={availableAnnualLeave} carryoverBalance={carryoverBalance} />}
        {activeTab === "history" && <HistorySection allRequests={allRequests} requestReasons={requestReasons} showLeaveReason={showLeaveReason} />}
        {activeTab === "admin" && canManage && (
          <AdminSection
            user={user}
            pendingRequests={pendingRequests}
            requestReasons={requestReasons}
            adminLogs={adminLogs}
            allUsers={allUsers}
            isRoleModalOpen={isRoleModalOpen}
            selectedUserForRole={selectedUserForRole}
            onRoleModalChange={(open, member) => { setIsRoleModalOpen(open); setSelectedUserForRole(open ? member ?? null : null) }}
            onChangeUserRole={changeUserRole}
            isAdjustModalOpen={isAdjustModalOpen}
            selectedUserForAdjust={selectedUserForAdjust}
            onAdjustModalChange={(open, member) => { setIsAdjustModalOpen(open); setSelectedUserForAdjust(open ? member ?? null : null) }}
            onAdjustUserLeave={adjustUserLeave}
            isGrantModalOpen={isGrantModalOpen}
            selectedUserForGrant={selectedUserForGrant}
            onGrantModalChange={(open, member) => { setIsGrantModalOpen(open); setSelectedUserForGrant(open ? member ?? null : null) }}
            onGrantCompLeave={grantCompLeave}
            onApproveRequest={(request) => void handleAdminAction(request, "APPROVED")}
            onRejectRequest={(request) => void handleAdminAction(request, "REJECTED")}
          />
        )}
      </main>
    </div>
  )
}
