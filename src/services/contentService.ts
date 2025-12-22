/**
 * Content Service
 *
 * Service for accessing content data (modules and lessons).
 * Simulates Supabase operations for local development.
 *
 * @module services/contentService
 * @category Services
 */

import type {
  Module,
  Lesson,
  ContentQueryOptions,
  ContentResponse,
} from '../types/content'
import { mockModules, mockLessons, MockContentUtils } from '../data/mockContent'

/**
 * Content Service Interface
 * Simulates Supabase client operations
 */
export interface ContentService {
  // Module operations
  getModules(options?: ContentQueryOptions): Promise<ContentResponse<Module>>
  getModuleById(id: string): Promise<Module | null>
  getModuleBySlug(slug: string): Promise<Module | null>

  // Lesson operations
  getLessons(options?: ContentQueryOptions): Promise<ContentResponse<Lesson>>
  getLessonsByModule(moduleId: string, options?: ContentQueryOptions): Promise<ContentResponse<Lesson>>
  getLessonById(id: string): Promise<Lesson | null>

  // Combined operations
  getModuleWithLessons(moduleId: string): Promise<{ module: Module; lessons: Lesson[] } | null>
}

/**
 * Mock Content Service Implementation
 * Simulates Supabase database operations using local mock data
 */
class MockContentService implements ContentService {
  /**
   * Get all modules with optional filtering
   */
  async getModules(options: ContentQueryOptions = {}): Promise<ContentResponse<Module>> {
    try {
      let modules = [...mockModules]

      // Apply filters
      if (options.difficultyLevel) {
        modules = modules.filter(m => m.difficultyLevel === options.difficultyLevel)
      }

      // Sort by order_index
      modules.sort((a, b) => a.orderIndex - b.orderIndex)

      // Apply pagination
      const total = modules.length
      const offset = options.offset || 0
      const limit = options.limit || total
      const paginatedModules = modules.slice(offset, offset + limit)

      return {
        data: paginatedModules,
        total,
        hasMore: offset + limit < total,
        queryTime: 0, // Mock - instant response
      }
    } catch (error) {
      console.error('Error fetching modules:', error)
      throw new Error('Failed to fetch modules')
    }
  }

  /**
   * Get a specific module by ID
   */
  async getModuleById(id: string): Promise<Module | null> {
    try {
      const module = mockModules.find(m => m.id === id)
      return module || null
    } catch (error) {
      console.error('Error fetching module by ID:', error)
      return null
    }
  }

  /**
   * Get a specific module by slug
   */
  async getModuleBySlug(slug: string): Promise<Module | null> {
    try {
      const module = mockModules.find(m => m.slug === slug)
      return module || null
    } catch (error) {
      console.error('Error fetching module by slug:', error)
      return null
    }
  }

  /**
   * Get all lessons with optional filtering
   */
  async getLessons(options: ContentQueryOptions = {}): Promise<ContentResponse<Lesson>> {
    try {
      let lessons = [...mockLessons]

      // Apply filters
      if (options.moduleId) {
        lessons = lessons.filter(l => l.moduleId === options.moduleId)
      }

      // Include module relationships if requested
      if (options.includeRelations) {
        lessons = lessons.map(lesson => ({
          ...lesson,
          module: mockModules.find(m => m.id === lesson.moduleId),
        }))
      }

      // Apply pagination
      const total = lessons.length
      const offset = options.offset || 0
      const limit = options.limit || total
      const paginatedLessons = lessons.slice(offset, offset + limit)

      return {
        data: paginatedLessons,
        total,
        hasMore: offset + limit < total,
        queryTime: 0, // Mock - instant response
      }
    } catch (error) {
      console.error('Error fetching lessons:', error)
      throw new Error('Failed to fetch lessons')
    }
  }

  /**
   * Get lessons for a specific module
   */
  async getLessonsByModule(
    moduleId: string,
    options: ContentQueryOptions = {}
  ): Promise<ContentResponse<Lesson>> {
    try {
      // Verify module exists
      const module = await this.getModuleById(moduleId)
      if (!module) {
        return {
          data: [],
          total: 0,
          hasMore: false,
          queryTime: 0,
        }
      }

      // Get lessons for this module
      return this.getLessons({
        ...options,
        moduleId,
        includeRelations: options.includeRelations ?? true, // Default to true for module lessons
      })
    } catch (error) {
      console.error('Error fetching lessons by module:', error)
      throw new Error('Failed to fetch lessons by module')
    }
  }

  /**
   * Get a specific lesson by ID
   */
  async getLessonById(id: string): Promise<Lesson | null> {
    try {
      const lesson = mockLessons.find(l => l.id === id)
      if (!lesson) return null

      // Include module relationship
      const module = mockModules.find(m => m.id === lesson.moduleId)
      return {
        ...lesson,
        module,
      }
    } catch (error) {
      console.error('Error fetching lesson by ID:', error)
      return null
    }
  }

  /**
   * Get module with all its lessons
   */
  async getModuleWithLessons(moduleId: string): Promise<{ module: Module; lessons: Lesson[] } | null> {
    try {
      const module = await this.getModuleById(moduleId)
      if (!module) return null

      const lessonsResponse = await this.getLessonsByModule(moduleId)
      const lessons = lessonsResponse.data

      return {
        module,
        lessons,
      }
    } catch (error) {
      console.error('Error fetching module with lessons:', error)
      return null
    }
  }
}

/**
 * Singleton instance of the content service
 */
export const contentService: ContentService = new MockContentService()

/**
 * Utility functions for content operations
 */
export const ContentServiceUtils = {
  /**
   * Validate module data structure
   */
  validateModule: (module: Partial<Module>): { valid: boolean; errors: string[] } => {
    const errors: string[] = []

    if (!module.id) errors.push('Module ID is required')
    if (!module.slug) errors.push('Module slug is required')
    if (!module.title) errors.push('Module title is required')
    if (!module.difficultyLevel) errors.push('Module difficulty level is required')
    if (typeof module.orderIndex !== 'number') errors.push('Module order index must be a number')

    return {
      valid: errors.length === 0,
      errors,
    }
  },

  /**
   * Validate lesson data structure
   */
  validateLesson: (lesson: Partial<Lesson>): { valid: boolean; errors: string[] } => {
    const errors: string[] = []

    if (!lesson.id) errors.push('Lesson ID is required')
    if (!lesson.moduleId) errors.push('Lesson module ID is required')
    if (!lesson.gestureName) errors.push('Lesson gesture name is required')
    if (!lesson.displayName) errors.push('Lesson display name is required')
    if (typeof lesson.minConfidenceThreshold !== 'number') {
      errors.push('Lesson min confidence threshold must be a number')
    }
    if (typeof lesson.xpReward !== 'number') {
      errors.push('Lesson XP reward must be a number')
    }

    return {
      valid: errors.length === 0,
      errors,
    }
  },

  /**
   * Get content statistics
   */
  getContentStats: () => {
    const modules = MockContentUtils.getModulesWithStats()
    const totalLessons = mockLessons.length
    const totalXp = mockLessons.reduce((sum, lesson) => sum + lesson.xpReward, 0)

    return {
      totalModules: modules.length,
      totalLessons,
      totalXp,
      averageXpPerLesson: Math.round(totalXp / totalLessons),
      modulesByDifficulty: {
        iniciante: modules.filter(m => m.difficultyLevel === 'iniciante').length,
        intermediario: modules.filter(m => m.difficultyLevel === 'intermediario').length,
        avancado: modules.filter(m => m.difficultyLevel === 'avancado').length,
      },
    }
  },
} as const

export default contentService
