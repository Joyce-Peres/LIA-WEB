/**
 * ModuleCard Component
 *
 * Visual card component for displaying module information in the catalog.
 * Shows module details and progress status with interactive navigation.
 *
 * @module components/modules/ModuleCard
 * @category UI Components
 *
 * @example
 * ```tsx
 * <ModuleCard
 *   module={moduleData}
 *   onClick={(module) => navigate(`/modules/${module.slug}`)}
 * />
 * ```
 */

import React from 'react'
import { Module, DifficultyLevel } from '../../types/database'

/**
 * Props for the ModuleCard component
 */
export interface ModuleCardProps {
  /** Module data to display */
  module: Module
  /** Optional progress information (future integration) */
  progress?: ModuleProgress
  /** Click handler for navigation */
  onClick: (module: Module) => void
}

/**
 * Progress information for a module (placeholder for future integration)
 */
export interface ModuleProgress {
  moduleId: string
  completedLessons: number
  totalLessons: number
  status: 'not-started' | 'in-progress' | 'completed'
}

/**
 * ModuleCard component for displaying module information
 */
export function ModuleCard({ module, progress, onClick }: ModuleCardProps) {
  /**
   * Get color classes for difficulty level badges
   */
  const getDifficultyColor = (level: DifficultyLevel): string => {
    switch (level) {
      case 'iniciante':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'intermediario':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'avancado':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  /**
   * Get progress information (placeholder for future user progress integration)
   */
  const getProgressInfo = (): { status: string; percentage: number; label: string } => {
    if (!progress) {
      return { status: 'not-started', percentage: 0, label: 'Não iniciado' }
    }

    const percentage = progress.totalLessons > 0
      ? (progress.completedLessons / progress.totalLessons) * 100
      : 0

    switch (progress.status) {
      case 'completed':
        return { status: 'completed', percentage: 100, label: 'Concluído' }
      case 'in-progress':
        return {
          status: 'in-progress',
          percentage,
          label: `${Math.round(percentage)}% concluído`
        }
      default:
        return { status: 'not-started', percentage: 0, label: 'Não iniciado' }
    }
  }

  /**
   * Get status color for progress indicator
   */
  const getProgressColor = (status: string): string => {
    switch (status) {
      case 'completed':
        return 'text-green-600'
      case 'in-progress':
        return 'text-blue-600'
      default:
        return 'text-gray-400'
    }
  }

  const progressInfo = getProgressInfo()
  const progressColor = getProgressColor(progressInfo.status)

  /**
   * Handle card click
   */
  const handleClick = () => {
    onClick(module)
  }

  /**
   * Handle keyboard navigation
   */
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onClick(module)
    }
  }

  return (
    <div
      className="bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer border border-gray-200 hover:border-blue-300 focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={`Módulo ${module.title} - ${module.description}`}
    >
      <div className="p-6">
        {/* Module Icon */}
        <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4 border-2 border-blue-100">
          {module.iconUrl ? (
            <img
              src={module.iconUrl}
              alt={`Ícone do módulo ${module.title}`}
              className="w-8 h-8 object-contain"
              loading="lazy"
            />
          ) : (
            <span
              className="text-2xl"
              role="img"
              aria-label="Ícone padrão do módulo"
            >
              📚
            </span>
          )}
        </div>

        {/* Module Title */}
        <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
          {module.title}
        </h3>

        {/* Module Description */}
        <p className="text-gray-600 text-sm mb-4 line-clamp-3 leading-relaxed">
          {module.description || 'Descrição não disponível'}
        </p>

        {/* Difficulty Badge */}
        <div className="flex items-center justify-between mb-4">
          <span
            className={`inline-block px-3 py-1 text-xs font-medium rounded-full border ${getDifficultyColor(module.difficultyLevel)}`}
          >
            {module.difficultyLevel.charAt(0).toUpperCase() + module.difficultyLevel.slice(1)}
          </span>
        </div>

        {/* Progress Indicator */}
        <div className="flex items-center justify-between text-sm">
          <span className={`font-medium ${progressColor}`}>
            {progressInfo.label}
          </span>
          <span className="text-gray-400">
            {Math.round(progressInfo.percentage)}%
          </span>
        </div>

        {/* Progress Bar (visual indicator) */}
        <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${
              progressInfo.status === 'completed'
                ? 'bg-green-500'
                : progressInfo.status === 'in-progress'
                ? 'bg-blue-500'
                : 'bg-gray-300'
            }`}
            style={{ width: `${progressInfo.percentage}%` }}
            aria-label={`Progresso: ${Math.round(progressInfo.percentage)}%`}
          />
        </div>

        {/* Hover hint */}
        <div className="mt-4 text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
          Clique para ver lições
        </div>
      </div>
    </div>
  )
}

export default ModuleCard
