import { describe, expect, it, beforeEach } from 'vitest'

import { ensureProfile, getProfile, updateProfile } from './profile'

function installLocalStorage() {
  const store = new Map<string, string>()
  // Minimal localStorage polyfill for Node test env.
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

describe('profile', () => {
  beforeEach(() => {
    installLocalStorage()
    localStorage.clear()
  })

  it('ensureProfile cria perfil com defaults (LIA, XP=0, streak=0)', () => {
    const p = ensureProfile('lia')
    expect(p.userId).toBe('lia')
    expect(p.displayName).toBe('LIA')
    expect(p.avatarText).toBe('LIA')
    expect(p.totalXp).toBe(0)
    expect(p.currentStreak).toBe(0)
  })

  it('ensureProfile é idempotente para o mesmo userId', () => {
    const p1 = ensureProfile('lia')
    const p2 = ensureProfile('lia')
    expect(p2).toEqual(p1)
  })

  it('getProfile retorna null para JSON inválido', () => {
    localStorage.setItem('lia.profile.v1.lia', '{bad json')
    expect(getProfile('lia')).toBeNull()
  })

  it('updateProfile persiste alterações no storage', () => {
    ensureProfile('lia')
    const next = updateProfile('lia', (p) => ({ ...p, totalXp: p.totalXp + 10 }))
    expect(next.totalXp).toBe(10)
    expect(getProfile('lia')?.totalXp).toBe(10)
  })
})


