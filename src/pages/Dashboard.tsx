import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import type { AuthSession } from '@/lib/auth'
import { getSession, onAuthStateChange, signOut } from '@/lib/auth'
import { ensureProfile, updateProfile, type UserProfile } from '@/lib/profile'
import {
  contentRepository,
  type ModuleWithStats,
} from '@/repositories/contentRepository'
import type { Lesson } from '@/types/database'

export function DashboardPage() {
  const navigate = useNavigate()
  const [session, setSession] = useState<AuthSession | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [modules, setModules] = useState<ModuleWithStats[]>([])
  const [lessonsByModule, setLessonsByModule] = useState<Record<string, Lesson[]>>({})
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

          // Carrega módulos com contagem de lições
          const modulesWithStats = await contentRepository.getModulesWithStats()
          setModules(modulesWithStats)

          // Carrega lições por módulo (para numerar níveis)
          const lessonEntries = await Promise.all(
            modulesWithStats.map(async (module) => {
              const lessons = await contentRepository.getLessonsByModule(module.id)
              lessons.sort((a, b) => a.orderIndex - b.orderIndex)
              return [module.id, lessons] as const
            }),
          )

          const grouped: Record<string, Lesson[]> = {}
          lessonEntries.forEach(([moduleId, lessons]) => {
            grouped[moduleId] = lessons
          })

          setLessonsByModule(grouped)
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

  const overallStats = useMemo(() => {
    const totalLessons = modules.reduce((sum, mod) => sum + (mod.lessonCount ?? 0), 0)
    const completedLessons = 0 // Integração de progresso real virá depois
    const progress = totalLessons === 0 ? 0 : completedLessons / totalLessons
    return { totalLessons, completedLessons, progress }
  }, [modules])

  const renderModuleLevels = (lessons: Lesson[]) => {
    if (!lessons.length) {
      return <div className="text-xs text-gray-500">Nenhum nível disponível</div>
    }

    return (
      <div className="flex flex-wrap gap-2 mt-3">
        {lessons.map((lesson, index) => (
          <button
            key={lesson.id}
            type="button"
            className={`min-w-[36px] rounded-md border px-2 py-1 text-xs font-semibold transition ${
              index === 0
                ? 'border-purple-500 bg-purple-50 text-purple-700'
                : 'border-gray-200 bg-gray-100 text-gray-600'
            }`}
            onClick={() => navigate(`/lessons/${lesson.id}`)}
          >
            {index + 1}
          </button>
        ))}
      </div>
    )
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
        {/* Header inspirado no layout do projeto base */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold text-purple-700">Seções</h1>
            <span className="text-gray-400" title="Organize por temas">💡</span>
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-700">
            <div className="flex items-center gap-2">
              <span className="text-purple-700 font-semibold">Pontuação:</span>
              <span className="font-bold">{profile?.totalXp ?? 0}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-600">Progresso Geral:</span>
              <div className="w-32 bg-gray-200 rounded-full h-3 overflow-hidden">
                <div
                  className="h-3 bg-green-500 rounded-full transition-all"
                  style={{ width: `${overallStats.progress * 100}%` }}
                />
              </div>
              <span className="text-xs text-gray-500">
                {overallStats.completedLessons}/{overallStats.totalLessons}
              </span>
            </div>
            <button
              type="button"
              onClick={() => navigate('/profile')}
              className="w-10 h-10 rounded-full bg-purple-600 text-white font-semibold flex items-center justify-center shadow-sm hover:bg-purple-700 transition-colors"
              title="Perfil"
            >
              {profile?.avatarText?.slice(0, 2) ?? 'PR'}
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-100 transition-colors"
            >
              Sair
            </button>
          </div>
        </div>

        {/* Grade de seções / níveis semelhante ao projeto base */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {modules.map((module) => {
            const lessons = lessonsByModule[module.id] ?? []
            const completed = 0 // placeholder
            const progress = module.lessonCount > 0 ? completed / module.lessonCount : 0

            return (
              <div
                key={module.id}
                className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg" aria-hidden>
                        {module.iconUrl ? '📚' : '📘'}
                      </span>
                      <h2 className="text-lg font-semibold text-gray-900">{module.title}</h2>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{module.description}</p>
                  </div>
                  <span className="text-xs text-gray-500">
                    {(lessons.length || module.lessonCount) ?? 0} níveis
                  </span>
                </div>

                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                    <span>Progresso:</span>
                    <span>{completed}/{module.lessonCount}</span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-2 bg-purple-500 rounded-full transition-all"
                      style={{ width: `${progress * 100}%` }}
                    />
                  </div>
                </div>

                {renderModuleLevels(lessons)}
              </div>
            )
          })}

          {modules.length === 0 && (
            <div className="col-span-full text-center text-gray-500 bg-white border border-dashed border-gray-200 rounded-lg py-10">
              Nenhum conteúdo disponível ainda. Importe módulos ou crie lições para começar.
            </div>
          )}
        </div>

        {/* Ações rápidas para manter fluxo atual */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mt-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-gray-900">Ações Rápidas</h3>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => navigate('/modules')}
                className="px-3 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors"
              >
                Explorar Módulos
              </button>
              <button
                type="button"
                onClick={handleAddXp}
                className="px-3 py-2 bg-purple-600 text-white text-sm font-semibold rounded-lg hover:bg-purple-700 transition-colors"
              >
                +1 XP (Demo)
              </button>
            </div>
          </div>
          <p className="text-sm text-gray-600">
            Clique em um nível para abrir a lição correspondente. As seções seguem a mesma divisão do projeto base.
          </p>
        </div>

        {/* Debug Info (development only) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-8 rounded-xl bg-gray-100 border border-gray-300 p-4">
            <div className="text-sm text-gray-600 mb-2">Debug Info (Development):</div>
            <div className="text-xs font-mono text-gray-800 break-all">
              User ID: {session.user.id}<br/>
              Módulos: {modules.length}<br/>
              XP: {profile?.totalXp || 0}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
