import { useEffect, useState } from 'react'

import { getSession, signInLocal } from '@/lib/auth'
import { useNavigate } from 'react-router-dom'

export function LoginPage() {
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const session = getSession()
    if (session) navigate('/dashboard', { replace: true })
  }, [navigate])

  async function handleLoginWithGoogle() {
    setError(null)
    setIsLoading(true)

    try {
      // Modo local: sem serviços externos. Criamos uma sessão e seguimos para o dashboard.
      await signInLocal()
      navigate('/dashboard', { replace: true })
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Erro inesperado'
      setError(message)
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-xl bg-white shadow-sm border border-gray-200 p-6">
        <h1 className="text-2xl font-bold text-gray-900">Entrar</h1>
        <p className="text-sm text-gray-600 mt-1">
          Faça login para acessar o LIA Web.
        </p>

        <button
          type="button"
          onClick={handleLoginWithGoogle}
          disabled={isLoading}
          className="mt-6 w-full rounded-lg bg-primary-purple px-4 py-2 text-white font-semibold hover:opacity-95 disabled:opacity-60"
        >
          {isLoading ? 'Entrando…' : 'Entrar (modo local)'}
        </button>

        {error ? (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <div className="mt-4 text-xs text-gray-500">
          Você escolheu <strong>evitar serviços externos</strong>. Este login cria
          uma sessão local (armazenada no navegador) e não usa Google/Supabase.
        </div>
      </div>
    </div>
  )
}


