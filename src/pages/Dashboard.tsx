import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import type { AuthSession } from '@/lib/auth'
import { getSession, onAuthStateChange, signOut } from '@/lib/auth'

export function DashboardPage() {
  const navigate = useNavigate()
  const [session, setSession] = useState<AuthSession | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    async function load() {
      if (!isMounted) return
      const current = getSession()
      setSession(current)
      setIsLoading(false)
      if (!current) navigate('/login', { replace: true })
    }

    void load()

    const unsubscribe = onAuthStateChange((next) => {
      setSession(next)
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
      </div>
    </div>
  )
}


