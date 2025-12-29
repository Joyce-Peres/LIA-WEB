/**
 * ModuleLevels Page
 *
 * Displays all levels within a module/section, allowing users to navigate
 * to specific levels and practice activities. Matches the level navigation
 * from the original Python project.
 *
 * @module pages/ModuleLevels
 * @category Pages
 */

import { useEffect, useState, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import type { AuthSession } from '@/lib/auth'
import { getSession } from '@/lib/auth'
import { mockModules, MockContentUtils, sectionIcons } from '@/data/mockContent'
import type { Module, Level } from '@/types/database'

/**
 * Level card component showing level number and status
 */
function LevelCard({
  level,
  onSelect,
}: {
  level: Level
  onSelect: (level: number) => void
}) {
  const isLocked = !level.isUnlocked
  const progress = level.totalLessons > 0
    ? (level.completedLessons / level.totalLessons) * 100
    : 0

  return (
    <button
      type="button"
      disabled={isLocked}
      onClick={() => onSelect(level.number)}
      className={`
        relative flex flex-col items-center justify-center
        w-full aspect-square rounded-xl border-2 transition-all
        ${isLocked
          ? 'bg-gray-100 border-gray-200 cursor-not-allowed opacity-60'
          : level.isCompleted
            ? 'bg-green-50 border-green-400 hover:border-green-500 hover:shadow-md'
            : 'bg-purple-50 border-purple-400 hover:border-purple-600 hover:shadow-md'
        }
      `}
    >
      {/* Lock icon for locked levels */}
      {isLocked && (
        <div className="absolute top-2 right-2">
          <span className="text-gray-400 text-lg">🔒</span>
        </div>
      )}

      {/* Checkmark for completed levels */}
      {level.isCompleted && (
        <div className="absolute top-2 right-2">
          <span className="text-green-500 text-lg">✅</span>
        </div>
      )}

      {/* Level number */}
      <span className={`
        text-3xl font-bold mb-1
        ${isLocked ? 'text-gray-400' : level.isCompleted ? 'text-green-600' : 'text-purple-600'}
      `}>
        {level.number}
      </span>

      {/* Gestures preview */}
      <div className="text-xs text-gray-500 text-center px-2 line-clamp-2">
        {level.gestures.slice(0, 3).join(', ')}
        {level.gestures.length > 3 && '...'}
      </div>

      {/* Progress bar */}
      {!isLocked && (
        <div className="absolute bottom-2 left-2 right-2">
          <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${level.isCompleted ? 'bg-green-500' : 'bg-purple-500'}`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
    </button>
  )
}

/**
 * Loading skeleton
 */
function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin text-4xl mb-4">⏳</div>
        <div className="text-sm text-gray-600">Carregando níveis...</div>
      </div>
    </div>
  )
}

/**
 * Error state
 */
function ErrorState({ message, onBack }: { message: string; onBack: () => void }) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full mx-4 bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">❌</span>
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Erro</h2>
        <p className="text-gray-600 mb-6">{message}</p>
        <button
          onClick={onBack}
          className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors font-medium"
        >
          Voltar ao Dashboard
        </button>
      </div>
    </div>
  )
}

/**
 * Main ModuleLevels page component
 */
export function ModuleLevelsPage() {
  const navigate = useNavigate()
  const { moduleSlug } = useParams<{ moduleSlug: string }>()
  const [session, setSession] = useState<AuthSession | null>(null)
  const [module, setModule] = useState<Module | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // For now, simulate completed levels (in future, pull from user progress)
  const [completedLevels] = useState<number[]>([])

  useEffect(() => {
    async function load() {
      const current = getSession()
      setSession(current)

      if (!current) {
        navigate('/login', { replace: true })
        return
      }

      if (!moduleSlug) {
        setError('Módulo não especificado')
        setIsLoading(false)
        return
      }

      // Find module by slug or ID
      const foundModule = mockModules.find(
        m => m.slug === moduleSlug || m.id === moduleSlug
      )

      if (!foundModule) {
        setError('Módulo não encontrado')
        setIsLoading(false)
        return
      }

      setModule(foundModule)
      setIsLoading(false)
    }

    void load()
  }, [navigate, moduleSlug])

  // Get levels with info
  const levels = useMemo(() => {
    if (!module) return []
    return MockContentUtils.getAllLevelInfo(module.id, completedLevels)
  }, [module, completedLevels])

  // Get section icon
  const sectionIcon = useMemo(() => {
    if (!module) return { emoji: '📚', label: 'Módulo' }
    return sectionIcons[module.id] || { emoji: '📚', label: 'Módulo' }
  }, [module])

  // Calculate overall progress
  const overallProgress = useMemo(() => {
    if (levels.length === 0) return { completed: 0, total: 0, percentage: 0 }
    const total = levels.length
    const completed = levels.filter(l => l.isCompleted).length
    return {
      completed,
      total,
      percentage: Math.round((completed / total) * 100),
    }
  }, [levels])

  const handleLevelSelect = (levelNumber: number) => {
    if (!module) return
    navigate(`/modules/${module.id}/level/${levelNumber}`)
  }

  const handleBack = () => {
    navigate('/dashboard')
  }

  if (isLoading) {
    return <LoadingSkeleton />
  }

  if (error || !module) {
    return <ErrorState message={error || 'Módulo não encontrado'} onBack={handleBack} />
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <button
            type="button"
            onClick={handleBack}
            className="text-purple-600 hover:text-purple-800 font-medium mb-4 inline-flex items-center gap-2"
          >
            ← Voltar às Seções
          </button>

          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
              <span className="text-3xl">{sectionIcon.emoji}</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-purple-700">{module.title}</h1>
              <p className="text-gray-600">{module.description}</p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Progresso da Seção</span>
              <span className="text-sm text-gray-500">
                {overallProgress.completed}/{overallProgress.total} níveis
              </span>
            </div>
            <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-purple-500 rounded-full transition-all"
                style={{ width: `${overallProgress.percentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Levels Grid */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Escolha um Nível
          </h2>

          {levels.length === 0 ? (
            <div className="text-center text-gray-500 bg-white border border-dashed border-gray-200 rounded-lg py-10">
              Nenhum nível disponível nesta seção.
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
              {levels.map((level) => (
                <LevelCard
                  key={level.number}
                  level={level}
                  onSelect={handleLevelSelect}
                />
              ))}
            </div>
          )}
        </div>

        {/* Info about levels */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
            💡 Como funciona
          </h3>
          <ul className="text-sm text-gray-600 space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-purple-500">•</span>
              <span>Complete o <strong>Nível 1</strong> para desbloquear os próximos níveis</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-500">•</span>
              <span>Cada nível contém gestos para você praticar</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-500">•</span>
              <span>Reconheça os gestos corretamente para avançar</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-500">•</span>
              <span>Ganhe XP ao completar cada gesto corretamente!</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default ModuleLevelsPage
