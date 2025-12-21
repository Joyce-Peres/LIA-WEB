import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { supabase } from '@/lib/supabase'

export function AuthCallbackPage() {
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function run() {
      try {
        const url = new URL(window.location.href)
        const code = url.searchParams.get('code')
        const errorDescription = url.searchParams.get('error_description')
        const errorParam = url.searchParams.get('error')

        if (errorParam || errorDescription) {
          throw new Error(errorDescription || errorParam || 'Erro no login')
        }

        if (!code) {
          // If user navigates here directly without OAuth params.
          navigate('/login', { replace: true })
          return
        }

        // PKCE exchange (Supabase returns ?code=...).
        const { error: exchangeError } =
          // supabase-js supports exchanging the auth code for a session
          await supabase.auth.exchangeCodeForSession(code)

        if (exchangeError) throw exchangeError

        if (!cancelled) navigate('/dashboard', { replace: true })
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Erro inesperado'
        if (!cancelled) setError(message)
      }
    }

    void run()

    return () => {
      cancelled = true
    }
  }, [navigate])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-xl bg-white shadow-sm border border-gray-200 p-6">
        <h1 className="text-xl font-bold text-gray-900">Concluindo login…</h1>
        <p className="text-sm text-gray-600 mt-1">
          Aguarde enquanto validamos sua sessão.
        </p>

        {error ? (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        ) : (
          <div className="mt-4 text-sm text-gray-700">Redirecionando…</div>
        )}
      </div>
    </div>
  )
}


