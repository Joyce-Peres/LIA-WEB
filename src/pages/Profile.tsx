import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { getSession } from '@/lib/auth'
import { ensureProfile, type UserProfile } from '@/lib/profile'

export function ProfilePage() {
  const navigate = useNavigate()
  const [profile, setProfile] = useState<UserProfile | null>(null)

  useEffect(() => {
    const session = getSession()
    if (!session) {
      navigate('/login', { replace: true })
      return
    }
    const p = ensureProfile(session.user.id)
    setProfile(p)
  }, [navigate])

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-sm text-gray-600">Carregando…</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Perfil</h1>
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50"
          >
            Voltar
          </button>
        </div>

        <div className="mt-6 rounded-xl bg-white border border-gray-200 p-6">
          <div className="flex items-center gap-4">
            <div
              className="h-14 w-14 rounded-full bg-primary-purple text-white flex items-center justify-center font-bold"
              aria-label="Avatar do usuário"
            >
              {profile.avatarText}
            </div>
            <div>
              <div className="text-sm text-gray-600">Nome</div>
              <div className="text-lg font-semibold text-gray-900">
                {profile.displayName}
              </div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-lg border border-gray-200 p-4">
              <div className="text-sm text-gray-600">XP total</div>
              <div className="mt-1 text-2xl font-bold text-gray-900">
                {profile.totalXp}
              </div>
            </div>
            <div className="rounded-lg border border-gray-200 p-4">
              <div className="text-sm text-gray-600">Streak atual</div>
              <div className="mt-1 text-2xl font-bold text-gray-900">
                {profile.currentStreak}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


