export type UserProfile = {
  userId: string
  displayName: string // MVP: sempre "LIA"
  avatarText: string // MVP: texto do avatar (ex.: "LIA")
  totalXp: number
  currentStreak: number
  createdAt: number
  updatedAt: number
}

function storageKey(userId: string) {
  return `lia.profile.v1.${userId}`
}

function safeParseProfile(raw: string | null): UserProfile | null {
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as unknown
    if (typeof parsed !== 'object' || parsed === null) return null
    const obj = parsed as Record<string, unknown>
    if (typeof obj.userId !== 'string' || obj.userId.trim() === '') return null
    if (typeof obj.displayName !== 'string') return null
    if (typeof obj.avatarText !== 'string') return null
    if (typeof obj.totalXp !== 'number' || !Number.isFinite(obj.totalXp)) return null
    if (
      typeof obj.currentStreak !== 'number' ||
      !Number.isFinite(obj.currentStreak)
    )
      return null
    if (typeof obj.createdAt !== 'number' || !Number.isFinite(obj.createdAt))
      return null
    if (typeof obj.updatedAt !== 'number' || !Number.isFinite(obj.updatedAt))
      return null

    return {
      userId: obj.userId,
      displayName: obj.displayName,
      avatarText: obj.avatarText,
      totalXp: obj.totalXp,
      currentStreak: obj.currentStreak,
      createdAt: obj.createdAt,
      updatedAt: obj.updatedAt,
    }
  } catch {
    // ignore
  }
  return null
}

export function getProfile(userId: string): UserProfile | null {
  return safeParseProfile(localStorage.getItem(storageKey(userId)))
}

export function saveProfile(profile: UserProfile) {
  try {
    localStorage.setItem(storageKey(profile.userId), JSON.stringify(profile))
  } catch {
    // storage falhou (quota/blocked) — MVP segue sem persistir.
  }
}

export function ensureProfile(userId: string): UserProfile {
  const existing = getProfile(userId)
  if (existing) return existing

  const now = Date.now()
  const created: UserProfile = {
    userId,
    displayName: 'LIA',
    avatarText: 'LIA',
    totalXp: 0,
    currentStreak: 0,
    createdAt: now,
    updatedAt: now,
  }

  saveProfile(created)
  return created
}


