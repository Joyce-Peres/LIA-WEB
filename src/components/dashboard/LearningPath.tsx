/**
 * LearningPath Component
 *
 * Visual representation of the user's learning journey as a connected path of lessons.
 * Shows progress through modules and lessons with connecting lines.
 *
 * @module components/dashboard/LearningPath
 * @category UI Components
 *
 * @example
 * ```tsx
 * <LearningPath
 *   lessons={allLessons}
 *   onLessonClick={(lesson) => navigate(`/lessons/${lesson.id}`)}
 * />
 * ```
 */

import React, { useMemo } from 'react'
import { Lesson, Module } from '../../types/database'
import { LessonStar, LessonStatus } from './LessonStar'

/**
 * Props for the LearningPath component
 */
export interface LearningPathProps {
  /** All lessons to display in the path */
  lessons: Lesson[]
  /** Optional modules data for grouping */
  modules?: Module[]
  /** Optional user progress data (future integration) */
  userProgress?: UserProgress
  /** Click handler for lesson navigation */
  onLessonClick: (lesson: Lesson) => void
  /** Optional CSS class */
  className?: string
}

/**
 * User progress data structure (placeholder for future integration)
 */
export interface UserProgress {
  userId: string
  lessons: Array<{
    lessonId: string
    isCompleted: boolean
    attempts: number
    bestScore: number
    lastAttemptAt: string
  }>
}

/**
 * PathConnector component for connecting lessons visually
 */
interface PathConnectorProps {
  fromStatus: LessonStatus
  toStatus: LessonStatus
  isLast?: boolean
}

function PathConnector({ fromStatus, toStatus, isLast = false }: PathConnectorProps) {
  const getConnectorStyle = () => {
    // Determine connector color based on progress flow
    if (fromStatus === 'completed' && toStatus === 'completed') {
      return 'bg-gradient-to-r from-yellow-400 to-yellow-400'
    } else if (fromStatus === 'completed' && toStatus === 'in-progress') {
      return 'bg-gradient-to-r from-yellow-400 to-purple-500'
    } else if (fromStatus === 'in-progress' && toStatus === 'in-progress') {
      return 'bg-gradient-to-r from-purple-500 to-purple-500'
    }
    return 'bg-gradient-to-r from-gray-300 to-gray-300'
  }

  return (
    <div className="path-connector flex items-center justify-center px-4">
      <div
        className={`h-1 rounded-full transition-all duration-500 ${getConnectorStyle()} ${
          !isLast ? 'flex-1 max-w-32' : 'w-8'
        }`}
      >
        {/* Animated flow effect */}
        {(fromStatus === 'completed' || toStatus === 'in-progress') && (
          <div
            className="h-full rounded-full bg-white/60 animate-pulse"
            style={{
              width: fromStatus === 'completed' ? '100%' : '50%',
              animation: 'flow 2s ease-in-out infinite'
            }}
          />
        )}
      </div>
    </div>
  )
}

/**
 * ModuleSection component for grouping lessons by module
 */
interface ModuleSectionProps {
  module: Module
  lessons: Lesson[]
  userProgress?: UserProgress
  onLessonClick: (lesson: Lesson) => void
}

function ModuleSection({ module, lessons, userProgress, onLessonClick }: ModuleSectionProps) {
  return (
    <div className="module-section mb-12">
      {/* Module Header */}
      <div className="flex items-center mb-6">
        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
          {module.iconUrl ? (
            <img
              src={module.iconUrl}
              alt={`Ícone do módulo ${module.title}`}
              className="w-6 h-6 object-contain"
            />
          ) : (
            <span className="text-lg">📚</span>
          )}
        </div>
        <div>
          <h3 className="text-xl font-semibold text-gray-900">{module.title}</h3>
          <p className="text-sm text-gray-600">{module.description}</p>
        </div>
      </div>

      {/* Lessons Path */}
      <div className="lesson-path flex items-center justify-start overflow-x-auto pb-4">
        {lessons.map((lesson, index) => (
          <React.Fragment key={lesson.id}>
            <LessonStar
              lesson={lesson}
              status={getLessonStatus(lesson, userProgress)}
              onClick={() => onLessonClick(lesson)}
              className="flex-shrink-0"
            />
            {index < lessons.length - 1 && (
              <PathConnector
                fromStatus={getLessonStatus(lesson, userProgress)}
                toStatus={getLessonStatus(lessons[index + 1], userProgress)}
              />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Module Progress Summary */}
      <div className="mt-4 text-sm text-gray-600">
        {lessons.filter(l => getLessonStatus(l, userProgress) === 'completed').length} de {lessons.length} lições concluídas
      </div>
    </div>
  )
}

/**
 * LearningPath component - main learning path visualization
 */
export function LearningPath({
  lessons,
  modules = [],
  userProgress,
  onLessonClick,
  className = ''
}: LearningPathProps) {
  /**
   * Group lessons by module and sort appropriately
   */
  const groupedLessons = useMemo(() => {
    // Create module map for quick lookup
    const moduleMap = new Map(modules.map(m => [m.id, m]))

    // Group lessons by module
    const groups: Record<string, { module: Module; lessons: Lesson[] }> = {}

    lessons.forEach(lesson => {
      const module = moduleMap.get(lesson.moduleId)
      if (module) {
        if (!groups[lesson.moduleId]) {
          groups[lesson.moduleId] = { module, lessons: [] }
        }
        groups[lesson.moduleId].lessons.push(lesson)
      }
    })

    // Sort lessons within each module by orderIndex
    Object.values(groups).forEach(group => {
      group.lessons.sort((a, b) => a.orderIndex - b.orderIndex)
    })

    // Sort modules by their orderIndex
    return Object.values(groups).sort((a, b) =>
      a.module.orderIndex - b.module.orderIndex
    )
  }, [lessons, modules])

  /**
   * Calculate overall progress statistics
   */
  const progressStats = useMemo(() => {
    const totalLessons = lessons.length
    const completedLessons = lessons.filter(l => getLessonStatus(l, userProgress) === 'completed').length
    const inProgressLessons = lessons.filter(l => getLessonStatus(l, userProgress) === 'in-progress').length

    return {
      total: totalLessons,
      completed: completedLessons,
      inProgress: inProgressLessons,
      percentage: totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0
    }
  }, [lessons, userProgress])

  if (groupedLessons.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">📚</span>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Nenhum conteúdo disponível
        </h3>
        <p className="text-gray-600">
          Ainda não há lições disponíveis para estudo.
        </p>
      </div>
    )
  }

  return (
    <div className={`learning-path ${className}`}>
      {/* Progress Overview */}
      <div className="mb-8 p-6 bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Seu Progresso Geral
          </h3>
          <div className="text-2xl font-bold text-gray-900">
            {progressStats.percentage}%
          </div>
        </div>

        <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
          <div
            className="bg-gradient-to-r from-yellow-400 to-purple-500 h-3 rounded-full transition-all duration-1000 ease-out"
            style={{ width: `${progressStats.percentage}%` }}
          />
        </div>

        <div className="grid grid-cols-3 gap-4 text-sm">
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-500">{progressStats.completed}</div>
            <div className="text-gray-600">Concluídas</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-500">{progressStats.inProgress}</div>
            <div className="text-gray-600">Em Andamento</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-400">
              {progressStats.total - progressStats.completed - progressStats.inProgress}
            </div>
            <div className="text-gray-600">Bloqueadas</div>
          </div>
        </div>
      </div>

      {/* Learning Path */}
      <div className="space-y-8">
        {groupedLessons.map(({ module, lessons: moduleLessons }) => (
          <ModuleSection
            key={module.id}
            module={module}
            lessons={moduleLessons}
            userProgress={userProgress}
            onLessonClick={onLessonClick}
          />
        ))}
      </div>

      {/* Motivational Message */}
      <div className="mt-12 text-center">
        <div className="inline-block p-6 bg-gradient-to-r from-yellow-50 to-purple-50 rounded-lg border border-yellow-200">
          <div className="text-2xl mb-2">
            {progressStats.percentage === 100 ? '🎉' : progressStats.percentage > 50 ? '🚀' : '💪'}
          </div>
          <div className="text-lg font-medium text-gray-900 mb-1">
            {progressStats.percentage === 100
              ? 'Parabéns! Você completou todo o caminho!'
              : progressStats.percentage > 50
              ? 'Você está indo muito bem!'
              : 'Continue praticando!'}
          </div>
          <div className="text-sm text-gray-600">
            Cada lição concluída te aproxima mais da fluência em Libras
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Helper function to determine lesson status (placeholder for now)
 */
function getLessonStatus(lesson: Lesson, userProgress?: UserProgress): LessonStatus {
  if (!userProgress) {
    // Demo logic: simulate progress based on lesson index
    // This will be replaced with actual user progress data
    const lessonNumber = parseInt(lesson.gestureName) || lesson.orderIndex

    if (lessonNumber <= 5) return 'completed'
    if (lessonNumber <= 8) return 'in-progress'
    return 'locked'
  }

  // Future: actual progress logic
  const progress = userProgress.lessons.find(p => p.lessonId === lesson.id)
  if (!progress) return 'locked'
  if (progress.isCompleted) return 'completed'
  if (progress.attempts > 0) return 'in-progress'
  return 'locked'
}

export default LearningPath
