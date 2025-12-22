/**
 * Content Types
 *
 * TypeScript interfaces for the content management system (modules and lessons).
 * These interfaces represent the data structure for the educational content catalog.
 *
 * @module types/content
 * @category Data Types
 */

/**
 * Difficulty levels for modules
 */
export type DifficultyLevel = 'iniciante' | 'intermediario' | 'avancado'

/**
 * Module represents a learning module in the catalog
 */
export interface Module {
  /** Unique identifier */
  id: string
  /** URL-friendly identifier */
  slug: string
  /** Display title */
  title: string
  /** Optional description */
  description?: string
  /** Difficulty level */
  difficultyLevel: DifficultyLevel
  /** Display order (lower numbers appear first) */
  orderIndex: number
  /** Optional icon URL */
  iconUrl?: string
  /** Creation timestamp */
  createdAt: string
  /** Last update timestamp */
  updatedAt: string
}

/**
 * Lesson represents an individual learning item within a module
 */
export interface Lesson {
  /** Unique identifier */
  id: string
  /** Foreign key to parent module */
  moduleId: string
  /** Technical name of the gesture (used for recognition) */
  gestureName: string
  /** User-friendly display name */
  displayName: string
  /** Optional video reference URL */
  videoRefUrl?: string
  /** Minimum confidence threshold for recognition (0.0-1.0) */
  minConfidenceThreshold: number
  /** XP reward for completing this lesson */
  xpReward: number
  /** Creation timestamp */
  createdAt: string
  /** Last update timestamp */
  updatedAt: string
  /** Populated relationship (optional, populated by queries) */
  module?: Module
}

/**
 * Progress status for user learning progress
 */
export type ProgressStatus = 'not-started' | 'in-progress' | 'completed'

/**
 * User progress on a module
 */
export interface ModuleProgress {
  /** Module ID */
  moduleId: string
  /** Current progress status */
  status: ProgressStatus
  /** Number of completed lessons in this module */
  completedLessons: number
  /** Total lessons in this module */
  totalLessons: number
  /** Progress percentage (0-100) */
  progressPercentage: number
  /** Best score achieved in this module */
  bestScore?: number
  /** Last accessed timestamp */
  lastAccessedAt?: string
}

/**
 * User progress on a specific lesson
 */
export interface LessonProgress {
  /** Lesson ID */
  lessonId: string
  /** Completion status */
  completed: boolean
  /** Best confidence score achieved (0.0-1.0) */
  bestConfidence?: number
  /** Number of attempts */
  attempts: number
  /** XP earned from this lesson */
  xpEarned: number
  /** First completion timestamp */
  completedAt?: string
  /** Last attempt timestamp */
  lastAttemptAt?: string
}

/**
 * Complete user progress across all content
 */
export interface UserProgress {
  /** Module progress */
  modules: Record<string, ModuleProgress>
  /** Lesson progress */
  lessons: Record<string, LessonProgress>
  /** Total XP earned */
  totalXp: number
  /** Current level based on XP */
  currentLevel: number
  /** XP needed for next level */
  xpToNextLevel: number
}

/**
 * Query options for content filtering and sorting
 */
export interface ContentQueryOptions {
  /** Filter by difficulty level */
  difficultyLevel?: DifficultyLevel
  /** Filter by module ID */
  moduleId?: string
  /** Include related data (e.g., module info for lessons) */
  includeRelations?: boolean
  /** Limit number of results */
  limit?: number
  /** Offset for pagination */
  offset?: number
}

/**
 * API response wrapper for content queries
 */
export interface ContentResponse<T> {
  /** Query results */
  data: T[]
  /** Total count (for pagination) */
  total: number
  /** Whether there are more results */
  hasMore: boolean
  /** Query execution time (for debugging) */
  queryTime?: number
}
