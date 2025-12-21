import { ensureProfile } from './profile'

export type AuthUser = {
  id: string
  email: string
  displayName: string
}

export type AuthSession = {
  user: AuthUser
  createdAt: number
  expiresAt: number
}

const STORAGE_KEY = 'lia.auth.session.v1'
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30 // 30 dias

type AuthListener = (session: AuthSession | null) => void

const listeners = new Set<AuthListener>()
let memorySession: AuthSession | null = null

function notify(session: AuthSession | null) {
  for (const listener of listeners) listener(session)
}

function safeParseSession(raw: string | null): AuthSession | null {
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as unknown
    if (typeof parsed !== 'object' || parsed === null) return null
    const obj = parsed as Record<string, unknown>
    const user = obj.user
    if (typeof user !== 'object' || user === null) return null
    const u = user as Record<string, unknown>
    if (typeof u.id !== 'string' || u.id.trim() === '') return null
    if (typeof u.email !== 'string') return null
    if (typeof u.displayName !== 'string') return null
    if (typeof obj.createdAt !== 'number' || !Number.isFinite(obj.createdAt))
      return null
    if (typeof obj.expiresAt !== 'number' || !Number.isFinite(obj.expiresAt))
      return null

    return {
      user: { id: u.id, email: u.email, displayName: u.displayName },
      createdAt: obj.createdAt,
      expiresAt: obj.expiresAt,
    }
  } catch {
    // ignore
  }
  return null
}

export function getSession(): AuthSession | null {
  try {
    const session = safeParseSession(localStorage.getItem(STORAGE_KEY))
    if (!session) return null
    if (session.expiresAt <= Date.now()) {
      // Expirada → limpa e força login, notificando subscribers.
      setSession(null)
      return null
    }
    return session
  } catch {
    return memorySession
  }
}

export function onAuthStateChange(listener: AuthListener): () => void {
  listeners.add(listener)
  // Emit current state immediately for convenience.
  listener(getSession())
  return () => {
    listeners.delete(listener)
  }
}

function setSession(session: AuthSession | null) {
  memorySession = session
  try {
    if (session) localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
    else localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Se storage falhar (quota/blocked), mantemos só em memória.
  }
  notify(session)
}

function stableUserId(): string {
  // MVP local-only: um único "usuário" com identidade estável.
  return 'lia'
}

export async function signInLocal(options?: {
  email?: string
  displayName?: string
}): Promise<AuthSession> {
  const email = options?.email?.trim() || 'lia@local'
  const displayName = options?.displayName?.trim() || 'LIA'
  const now = Date.now()

  const session: AuthSession = {
    user: { id: stableUserId(), email, displayName },
    createdAt: now,
    expiresAt: now + SESSION_TTL_MS,
  }

  setSession(session)
  // Perfil local: criado automaticamente no primeiro login.
  ensureProfile(session.user.id)
  return session
}

export async function signOut(): Promise<void> {
  setSession(null)
}


