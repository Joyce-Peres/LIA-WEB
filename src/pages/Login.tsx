import { useState } from 'react'

import { supabase } from '@/lib/supabase'

export function LoginPage() {
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  async function handleLoginWithGoogle() {
    setError(null)
    setIsLoading(true)

    const redirectTo = `${window.location.origin}/auth/callback`

    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo },
    })

    // If successful, the browser navigates away to Google/Supabase.
    if (authError) {
      setError(authError.message)
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
          {isLoading ? 'Redirecionando…' : 'Login com Google'}
        </button>

        {error ? (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <div className="mt-4 text-xs text-gray-500">
          Dica: se o Google OAuth ainda não estiver habilitado no Supabase, o login
          pode falhar. Veja <code>docs/supabase-setup.md</code>.
        </div>
      </div>
    </div>
  )
}


