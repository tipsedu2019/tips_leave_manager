import { User } from "../types"

export function filterActiveUsers(users: User[], blockedUserIds: string[]) {
  if (blockedUserIds.length === 0) {
    return users
  }

  const blockedSet = new Set(blockedUserIds)
  return users.filter((user) => !blockedSet.has(user.uid))
}
