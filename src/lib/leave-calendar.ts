import { LeaveRequest } from "../types"

export function getRequestsForDate(requests: LeaveRequest[], isoDate: string) {
  return requests.filter(
    (request) =>
      request.status !== "REJECTED" &&
      request.startDate <= isoDate &&
      request.endDate >= isoDate
  )
}
