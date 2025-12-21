import { describe, expect, it, beforeEach } from 'vitest'

import { getSession, signInLocal, signOut } from './auth'

function installLocalStorage() {
  const store = new Map<string, string>()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(globalThis as any).localStorage = {
    getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
    setItem: (k: string, v: string) => {
      store.set(k, v)
    },
    removeItem: (k: string) => {
      store.delete(k)
    },
    clear: () => {
      store.clear()
    },
  }
}

describe('auth (local)', () => {
  beforeEach(() => {
    installLocalStorage()
    localStorage.clear()
  })

  it('signInLocal cria sessão estável com userId "lia"', async () => {
    const session = await signInLocal()
    expect(session.user.id).toBe('lia')
    expect(getSession()?.user.id).toBe('lia')
  })

  it('signOut limpa a sessão', async () => {
    await signInLocal()
    await signOut()
    expect(getSession()).toBeNull()
  })

  it('getSession retorna null quando sessão está expirada', async () => {
    // sessão expirada manualmente no storage
    localStorage.setItem(
      'lia.auth.session.v1',
      JSON.stringify({
        user: { id: 'lia', email: 'lia@local', displayName: 'LIA' },
        createdAt: Date.now() - 1000,
        expiresAt: Date.now() - 1,
      }),
    )
    expect(getSession()).toBeNull()
  })
})


