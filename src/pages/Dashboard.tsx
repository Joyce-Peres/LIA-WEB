import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import type { Session } from '@supabase/supabase-js'

import { supabase } from '@/lib/supabase'

export function DashboardPage() {
  const navigate = useNavigate()
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    async function load() {
      const { data } = await supabase.auth.getSession()
      if (!isMounted) return
      setSession(data.session ?? null)
      setIsLoading(false)
      if (!data.session) navigate('/login', { replace: true })
    }

    void load()

    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next)
      if (!next) navigate('/login', { replace: true })
    })

    return () => {
      isMounted = false
      sub.subscription.unsubscribe()
    }
  }, [navigate])

  async function handleLogout() {
    await supabase.auth.signOut()
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
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50"
          >
            Sair
          </button>
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


