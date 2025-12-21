import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import type { AuthSession } from '@/lib/auth'
import { getSession, onAuthStateChange, signOut } from '@/lib/auth'
import { ensureProfile, updateProfile, type UserProfile } from '@/lib/profile'

export function DashboardPage() {
  const navigate = useNavigate()
  const [session, setSession] = useState<AuthSession | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    async function load() {
      if (!isMounted) return
      const current = getSession()
      setSession(current)
      setProfile(current ? ensureProfile(current.user.id) : null)
      setIsLoading(false)
      if (!current) navigate('/login', { replace: true })
    }

    void load()

    const unsubscribe = onAuthStateChange((next) => {
      setSession(next)
      setProfile(next ? ensureProfile(next.user.id) : null)
      if (!next) navigate('/login', { replace: true })
    })

    return () => {
      isMounted = false
      unsubscribe()
    }
  }, [navigate])

  async function handleLogout() {
    await signOut()
  }

  function handleAddXp() {
    if (!session) return
    const next = updateProfile(session.user.id, (p) => ({
      ...p,
      totalXp: p.totalXp + 1,
    }))
    setProfile(next)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-sm text-gray-600">Carregando…</div>
      </div>
    )
  }

  if (!session) return null

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate('/profile')}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50"
            >
              Perfil
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50"
            >
              Sair
            </button>
          </div>
        </div>

        <div className="mt-6 rounded-xl bg-white border border-gray-200 p-4">
          <div className="text-sm text-gray-600">Sessão ativa:</div>
          <div className="mt-1 text-sm font-mono text-gray-900 break-all">
            {session.user.email ?? session.user.id}
          </div>
        </div>

        {profile ? (
          <div className="mt-4 rounded-xl bg-white border border-gray-200 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm text-gray-600">Progresso (local):</div>
                <div className="mt-1 text-sm text-gray-900">
                  XP: <span className="font-semibold">{profile.totalXp}</span> ·
                  Streak:{' '}
                  <span className="font-semibold">{profile.currentStreak}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleAddXp}
                className="rounded-lg bg-primary-purple px-3 py-2 text-sm font-semibold text-white hover:opacity-95"
              >
                +1 XP
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}


