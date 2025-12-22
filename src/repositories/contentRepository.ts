/**
 * Content Repository
 *
 * Repository layer for accessing modules and lessons data from Supabase.
 * Provides typed, error-safe functions for content operations.
 *
 * @module repositories/contentRepository
 * @category Data Access
 *
 * @example
 * ```typescript
 * import { contentRepository } from './repositories/contentRepository'
 *
 * // Get all modules
 * const modules = await contentRepository.getModules()
 *
 * // Get lessons for a specific module
 * const lessons = await contentRepository.getLessonsByModule(moduleId)
 *
 * // Get single lesson with module info
 * const lesson = await contentRepository.getLessonById(lessonId)
 * ```
 */

import { supabase } from '../lib/supabase'
import type {
  Module,
  Lesson,
  ModuleWithLessons,
  LessonWithModule,
  DifficultyLevel
} from '../types/database'

/**
 * Query options for module operations
 */
export interface GetModulesOptions {
  /** Filter by difficulty level */
  difficultyLevel?: DifficultyLevel
  /** Include lesson count in results */
  includeLessonCount?: boolean
}

/**
 * Query options for lesson operations
 */
export interface GetLessonsOptions {
  /** Maximum number of results */
  limit?: number
  /** Number of results to skip */
  offset?: number
}

/**
 * Module with lesson statistics
 */
export interface ModuleWithStats extends Module {
  /** Total number of lessons in this module */
  lessonCount: number
}

/**
 * Content Repository Interface
 * Defines the contract for content data access operations
 */
export interface ContentRepository {
  // Module operations
  getModules(options?: GetModulesOptions): Promise<Module[]>
  getModuleById(id: string): Promise<Module | null>
  getModuleBySlug(slug: string): Promise<Module | null>
  getModuleWithLessons(moduleId: string): Promise<ModuleWithLessons | null>

  // Lesson operations
  getLessonsByModule(moduleId: string, options?: GetLessonsOptions): Promise<Lesson[]>
  getLessonById(lessonId: string): Promise<LessonWithModule | null>

  // Utility operations
  countLessonsByModule(moduleId: string): Promise<number>
  getModulesWithStats(): Promise<ModuleWithStats[]>
}

/**
 * Supabase-based Content Repository Implementation
 * Provides data access functions for modules and lessons
 */
class SupabaseContentRepository implements ContentRepository {
  /**
   * Get all modules ordered by order_index
   */
  async getModules(options: GetModulesOptions = {}): Promise<Module[]> {
    try {
      let query = supabase
        .from('modules')
        .select('*')
        .order('order_index', { ascending: true })

      if (options.difficultyLevel) {
        query = query.eq('difficulty_level', options.difficultyLevel)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error fetching modules:', error)
        return []
      }

      if (!data) return []

      // Transform database fields to application fields
      return data.map(this.transformModule)
    } catch (err) {
      console.error('Failed to get modules:', err)
      return []
    }
  }

  /**
   * Get a single module by ID
   */
  async getModuleById(id: string): Promise<Module | null> {
    try {
      const { data, error } = await supabase
        .from('modules')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          // Not found
          return null
        }
        console.error('Error fetching module:', error)
        return null
      }

      return data ? this.transformModule(data) : null
    } catch (err) {
      console.error('Failed to get module:', err)
      return null
    }
  }

  /**
   * Get a single module by slug
   */
  async getModuleBySlug(slug: string): Promise<Module | null> {
    try {
      const { data, error } = await supabase
        .from('modules')
        .select('*')
        .eq('slug', slug)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          // Not found
          return null
        }
        console.error('Error fetching module by slug:', error)
        return null
      }

      return data ? this.transformModule(data) : null
    } catch (err) {
      console.error('Failed to get module by slug:', err)
      return null
    }
  }

  /**
   * Get a module with all its lessons
   */
  async getModuleWithLessons(moduleId: string): Promise<ModuleWithLessons | null> {
    try {
      // Get module
      const module = await this.getModuleById(moduleId)
      if (!module) return null

      // Get lessons
      const lessons = await this.getLessonsByModule(moduleId)

      return {
        ...module,
        lessons,
        totalLessons: lessons.length,
        completedLessons: 0, // TODO: Calculate based on user progress
      }
    } catch (err) {
      console.error('Failed to get module with lessons:', err)
      return null
    }
  }

  /**
   * Get all lessons for a specific module
   */
  async getLessonsByModule(moduleId: string, options: GetLessonsOptions = {}): Promise<Lesson[]> {
    try {
      let query = supabase
        .from('lessons')
        .select('*')
        .eq('module_id', moduleId)
        .order('order_index', { ascending: true })

      if (options.limit) {
        query = query.limit(options.limit)
      }

      if (options.offset !== undefined) {
        const limit = options.limit || 50
        query = query.range(options.offset, options.offset + limit - 1)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error fetching lessons:', error)
        return []
      }

      if (!data) return []

      // Transform database fields to application fields
      return data.map(this.transformLesson)
    } catch (err) {
      console.error('Failed to get lessons:', err)
      return []
    }
  }

  /**
   * Get a single lesson by ID with module information
   */
  async getLessonById(lessonId: string): Promise<LessonWithModule | null> {
    try {
      const { data, error } = await supabase
        .from('lessons')
        .select(`
          *,
          modules (
            id,
            slug,
            title,
            description,
            difficulty_level,
            order_index,
            icon_url,
            created_at,
            updated_at
          )
        `)
        .eq('id', lessonId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          // Not found
          return null
        }
        console.error('Error fetching lesson:', error)
        return null
      }

      if (!data || !data.modules) return null

      return {
        ...this.transformLesson(data),
        module: this.transformModule(data.modules),
      }
    } catch (err) {
      console.error('Failed to get lesson:', err)
      return null
    }
  }

  /**
   * Count total lessons for a module
   */
  async countLessonsByModule(moduleId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('lessons')
        .select('*', { count: 'exact', head: true })
        .eq('module_id', moduleId)

      if (error) {
        console.error('Error counting lessons:', error)
        return 0
      }

      return count || 0
    } catch (err) {
      console.error('Failed to count lessons:', err)
      return 0
    }
  }

  /**
   * Get all modules with their lesson counts
   */
  async getModulesWithStats(): Promise<ModuleWithStats[]> {
    try {
      const modules = await this.getModules({ includeLessonCount: true })

      // For now, get lesson counts individually
      // In production, this could be optimized with a single query
      const modulesWithStats = await Promise.all(
        modules.map(async (module) => {
          const lessonCount = await this.countLessonsByModule(module.id)
          return {
            ...module,
            lessonCount,
          }
        })
      )

      return modulesWithStats
    } catch (err) {
      console.error('Failed to get modules with stats:', err)
      return []
    }
  }

  /**
   * Transform database module to application module
   */
  private transformModule(dbModule: any): Module {
    return {
      id: dbModule.id,
      slug: dbModule.slug,
      title: dbModule.title,
      description: dbModule.description,
      difficultyLevel: dbModule.difficulty_level,
      orderIndex: dbModule.order_index,
      iconUrl: dbModule.icon_url,
      createdAt: dbModule.created_at,
      updatedAt: dbModule.updated_at,
    }
  }

  /**
   * Transform database lesson to application lesson
   */
  private transformLesson(dbLesson: any): Lesson {
    return {
      id: dbLesson.id,
      moduleId: dbLesson.module_id,
      gestureName: dbLesson.gesture_name,
      displayName: dbLesson.display_name,
      videoRefUrl: dbLesson.video_ref_url,
      minConfidenceThreshold: dbLesson.min_confidence_threshold,
      xpReward: dbLesson.xp_reward,
      orderIndex: dbLesson.order_index,
      createdAt: dbLesson.created_at,
      updatedAt: dbLesson.updated_at,
    }
  }
}

/**
 * Singleton instance of the content repository
 */
export const contentRepository = new SupabaseContentRepository()

/**
 * Export repository class for testing purposes
 */
export { SupabaseContentRepository }
