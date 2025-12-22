/**
 * LessonStar Component
 *
 * Interactive star component showing lesson progress status in the learning path.
 * Displays different colors and animations based on completion state.
 *
 * @module components/dashboard/LessonStar
 * @category UI Components
 *
 * @example
 * ```tsx
 * <LessonStar
 *   lesson={lesson}
 *   status="completed"
 *   onClick={() => navigate(`/lessons/${lesson.id}`)}
 * />
 * ```
 */

import React, { useState } from 'react'
import { Lesson } from '../../types/database'

/**
 * Status types for lesson progress
 */
export type LessonStatus = 'locked' | 'in-progress' | 'completed'

/**
 * Props for the LessonStar component
 */
export interface LessonStarProps {
  /** Lesson data to display */
  lesson: Lesson
  /** Current progress status of the lesson */
  status: LessonStatus
  /** Click handler for navigation */
  onClick: () => void
  /** Optional CSS class for additional styling */
  className?: string
}

/**
 * LessonStar component for displaying lesson progress in the learning path
 */
export function LessonStar({ lesson, status, onClick, className = '' }: LessonStarProps) {
  const [isHovered, setIsHovered] = useState(false)

  /**
   * Get star colors based on status
   */
  const getStarColors = (status: LessonStatus, isHovered: boolean) => {
    const baseClasses = 'transition-all duration-300 ease-in-out'

    switch (status) {
      case 'completed':
        return {
          star: `${baseClasses} text-yellow-400 fill-yellow-400 ${
            isHovered ? 'scale-110 drop-shadow-lg' : ''
          }`,
          glow: 'bg-yellow-400/20 animate-pulse',
        }
      case 'in-progress':
        return {
          star: `${baseClasses} text-purple-500 fill-purple-500 ${
            isHovered ? 'scale-110 drop-shadow-lg' : ''
          }`,
          glow: 'bg-purple-500/20',
        }
      case 'locked':
      default:
        return {
          star: `${baseClasses} text-gray-300 fill-gray-300 ${
            isHovered ? 'text-gray-400' : ''
          }`,
          glow: 'bg-gray-300/10',
        }
    }
  }

  /**
   * Get status text for accessibility and tooltips
   */
  const getStatusText = (status: LessonStatus) => {
    switch (status) {
      case 'completed':
        return 'Concluída'
      case 'in-progress':
        return 'Em andamento'
      case 'locked':
        return 'Bloqueada'
    }
  }

  /**
   * Handle click with status validation
   */
  const handleClick = () => {
    if (status !== 'locked') {
      onClick()
    }
  }

  /**
   * Handle keyboard navigation
   */
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if ((event.key === 'Enter' || event.key === ' ') && status !== 'locked') {
      event.preventDefault()
      onClick()
    }
  }

  const colors = getStarColors(status, isHovered)
  const isClickable = status !== 'locked'
  const statusText = getStatusText(status)

  return (
    <div
      className={`lesson-star relative group ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`relative flex items-center justify-center w-16 h-16 rounded-full cursor-${
          isClickable ? 'pointer' : 'not-allowed'
        }`}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        role={isClickable ? 'button' : 'presentation'}
        tabIndex={isClickable ? 0 : -1}
        aria-label={`${lesson.displayName} - ${statusText}`}
      >
        {/* Glow effect background */}
        {status === 'completed' && (
          <div
            className={`absolute inset-0 rounded-full ${colors.glow} animate-ping`}
            style={{ animationDuration: '3s' }}
          />
        )}

        {/* Outer glow ring */}
        <div
          className={`absolute inset-1 rounded-full ${colors.glow} opacity-60`}
        />

        {/* Star Icon */}
        <svg
          className={`relative z-10 w-10 h-10 ${colors.star}`}
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>

        {/* Completion sparkle effect */}
        {status === 'completed' && (
          <>
            <div className="absolute top-1 right-2 w-1 h-1 bg-yellow-300 rounded-full animate-ping" style={{ animationDelay: '0.5s' }} />
            <div className="absolute bottom-2 left-1 w-1 h-1 bg-yellow-300 rounded-full animate-ping" style={{ animationDelay: '1s' }} />
            <div className="absolute top-3 left-3 w-0.5 h-0.5 bg-yellow-300 rounded-full animate-ping" style={{ animationDelay: '1.5s' }} />
          </>
        )}
      </div>

      {/* Tooltip with lesson info */}
      <div
        className={`absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3 px-3 py-2 bg-gray-800 text-white text-sm rounded-lg shadow-lg transition-all duration-200 whitespace-nowrap z-20 ${
          isHovered ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
        }`}
      >
        <div className="font-medium">{lesson.displayName}</div>
        <div className={`text-xs mt-1 ${
          status === 'completed' ? 'text-yellow-300' :
          status === 'in-progress' ? 'text-purple-300' :
          'text-gray-400'
        }`}>
          {statusText}
        </div>

        {/* Tooltip arrow */}
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
      </div>

      {/* Lesson number badge */}
      <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-white border-2 border-gray-200 rounded-full flex items-center justify-center text-xs font-bold text-gray-700 shadow-sm">
        {lesson.orderIndex}
      </div>
    </div>
  )
}

export default LessonStar
