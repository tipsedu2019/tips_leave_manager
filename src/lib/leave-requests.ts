import { LeaveRequest, LeaveType } from "../types"

export type RequestDurationUnit = "FULL_DAY" | "HALF_DAY"
export const REQUEST_DURATION_FIELD_LABEL = "사용 단위"
export const HALF_DAY_COMP_MESSAGE = "반일 대체휴일은 하루만 선택할 수 있습니다."
export const REQUEST_DURATION_UNIT_OPTIONS: Array<{
  value: RequestDurationUnit
  label: string
}> = [
  { value: "FULL_DAY", label: "전일" },
  { value: "HALF_DAY", label: "반일" },
]

type LeaveRequestDaysInput = {
  type: LeaveType
  startDate: string
  endDate: string
  durationUnit?: RequestDurationUnit
}

type EditableCompRequest = Pick<LeaveRequest, "type" | "daysCount">

export function getDefaultRequestDurationUnit(
  request: EditableCompRequest | null | undefined
): RequestDurationUnit {
  if (request?.type === "COMPENSATORY" && request.daysCount === 0.5) {
    return "HALF_DAY"
  }

  return "FULL_DAY"
}

export function getLeaveRequestDaysCount({
  type,
  startDate,
  endDate,
  durationUnit = "FULL_DAY",
}: LeaveRequestDaysInput) {
  if (endDate < startDate) {
    throw new Error("INVALID_RANGE")
  }

  const isHalfDay =
    type === "HALF_DAY" || (type === "COMPENSATORY" && durationUnit === "HALF_DAY")

  if (isHalfDay) {
    if (startDate !== endDate) {
      throw new Error("SINGLE_DAY_ONLY")
    }

    return 0.5
  }

  const start = new Date(startDate)
  const end = new Date(endDate)

  return Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
}
