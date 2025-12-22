import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import type { AuthSession } from '@/lib/auth'
import { getSession, onAuthStateChange, signOut } from '@/lib/auth'
import { ensureProfile, updateProfile, type UserProfile } from '@/lib/profile'
import { contentRepository } from '@/repositories/contentRepository'
import { LearningPath } from '@/components/dashboard/LearningPath'
import type { Lesson } from '@/types/database'

export function DashboardPage() {
  const navigate = useNavigate()
  const [session, setSession] = useState<AuthSession | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    async function load() {
      if (!isMounted) return

      try {
        const current = getSession()
        setSession(current)

        if (current) {
          setProfile(ensureProfile(current.user.id))

          // Load lessons for learning path
          const modules = await contentRepository.getModules()
          const allLessons: Lesson[] = []

          for (const module of modules) {
            const moduleLessons = await contentRepository.getLessonsByModule(module.id)
            allLessons.push(...moduleLessons)
          }

          // Sort lessons by module order and lesson order
          allLessons.sort((a, b) => {
            const moduleA = modules.find(m => m.id === a.moduleId)
            const moduleB = modules.find(m => m.id === b.moduleId)

            if (moduleA && moduleB) {
              if (moduleA.orderIndex !== moduleB.orderIndex) {
                return moduleA.orderIndex - moduleB.orderIndex
              }
            }

            return a.orderIndex - b.orderIndex
          })

          setLessons(allLessons)
        } else {
          navigate('/login', { replace: true })
        }
      } catch (error) {
        console.error('Failed to load dashboard data:', error)
        // Continue with basic dashboard even if lessons fail to load
      } finally {
        setIsLoading(false)
      }
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

  function handleLessonClick(lesson: Lesson) {
    // For now, show placeholder since lesson page doesn't exist yet
    alert(`Funcionalidade em desenvolvimento!\n\nLição: ${lesson.displayName}\nGestão: ${lesson.gestureName}\n\nEm breve você poderá praticar esta lição!`)

    // Future navigation:
    // navigate(`/lessons/${lesson.id}`)
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
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Bem-vindo de volta!</h1>
            <p className="text-gray-600 mt-1">Continue sua jornada de aprendizado em Libras</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/modules')}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50 transition-colors"
            >
              📚 Módulos
            </button>
            <button
              type="button"
              onClick={() => navigate('/profile')}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50 transition-colors"
            >
              👤 Perfil
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100 transition-colors"
            >
              Sair
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        {profile && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total de XP</p>
                  <p className="text-2xl font-bold text-gray-900">{profile.totalXp}</p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                  <span className="text-xl">⭐</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Sequência Atual</p>
                  <p className="text-2xl font-bold text-gray-900">{profile.currentStreak}</p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                  <span className="text-xl">🔥</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Lições Disponíveis</p>
                  <p className="text-2xl font-bold text-gray-900">{lessons.length}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-xl">📖</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Learning Path */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-8">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              Seu Caminho de Aprendizado
            </h2>
            <p className="text-gray-600">
              Clique nas estrelas para acessar as lições disponíveis
            </p>
          </div>

          <LearningPath
            lessons={lessons}
            onLessonClick={handleLessonClick}
          />
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Ações Rápidas</h3>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleAddXp}
              className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors"
            >
              +1 XP (Demo)
            </button>
            <button
              type="button"
              onClick={() => navigate('/modules')}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              Explorar Módulos
            </button>
          </div>
        </div>

        {/* Debug Info (development only) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-8 rounded-xl bg-gray-100 border border-gray-300 p-4">
            <div className="text-sm text-gray-600 mb-2">Debug Info (Development):</div>
            <div className="text-xs font-mono text-gray-800 break-all">
              User ID: {session.user.id}<br/>
              Lessons Loaded: {lessons.length}<br/>
              XP: {profile?.totalXp || 0}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}


