/**
 * Mock Content Repository
 *
 * Repository that uses mock data instead of Supabase.
 * This is used for development when Supabase is not available.
 *
 * @module repositories/mockContentRepository
 * @category Repository
 */

import type { Module, Lesson, LessonWithModule } from '../types/database'

/**
 * Module with lesson count stats
 */
export interface ModuleWithStats extends Module {
  lessonCount: number
}

import { mockModules, mockLessons } from '../data/mockContent'

/**
 * Mock Content Repository that uses local mock data
 */
export class MockContentRepository {
  /**
   * Get all modules
   */
  async getModules(): Promise<Module[]> {
    return mockModules
  }

  /**
   * Get a single module by ID
   */
  async getModuleById(id: string): Promise<Module | null> {
    return mockModules.find((m) => m.id === id) || null
  }

  /**
   * Get a single module by slug
   */
  async getModuleBySlug(slug: string): Promise<Module | null> {
    return mockModules.find((m) => m.slug === slug) || null
  }

  /**
   * Get lessons by module ID
   */
  async getLessonsByModule(moduleId: string): Promise<Lesson[]> {
    return mockLessons.filter((l) => l.moduleId === moduleId)
  }

  /**
   * Get lessons by module ID and level
   */
  async getLessonsByModuleAndLevel(moduleId: string, level: number): Promise<Lesson[]> {
    return mockLessons.filter((l) => l.moduleId === moduleId && l.level === level)
  }

  /**
   * Get a single lesson by ID (with module info)
   */
  async getLessonById(id: string): Promise<LessonWithModule | null> {
    const lesson = mockLessons.find((l) => l.id === id)
    if (!lesson) return null

    const module = mockModules.find((m) => m.id === lesson.moduleId)
    if (!module) return null

    return {
      ...lesson,
      module,
    }
  }

  /**
   * Get a lesson by ID with module info (alias for compatibility)
   */
  async getLessonWithModule(id: string): Promise<LessonWithModule | null> {
    return this.getLessonById(id)
  }

  /**
   * Get all lessons
   */
  async getAllLessons(): Promise<Lesson[]> {
    return mockLessons
  }

  /**
   * Count lessons by module
   */
  async countLessonsByModule(moduleId: string): Promise<number> {
    return mockLessons.filter((l) => l.moduleId === moduleId).length
  }

  /**
   * Count lessons by module and level
   */
  async countLessonsByModuleAndLevel(moduleId: string, level: number): Promise<number> {
    return mockLessons.filter((l) => l.moduleId === moduleId && l.level === level).length
  }

  /**
   * Get modules with stats (lesson count)
   */
  async getModulesWithStats(): Promise<ModuleWithStats[]> {
    return mockModules.map((module) => ({
      ...module,
      lessonCount: mockLessons.filter((l) => l.moduleId === module.id).length,
    }))
  }

  /**
   * Get levels for a module
   */
  async getLevelsForModule(moduleId: string): Promise<number[]> {
    const moduleLessons = mockLessons.filter((l) => l.moduleId === moduleId)
    const levels = [...new Set(moduleLessons.map((l) => l.level))].sort((a, b) => a - b)
    return levels
  }

  /**
   * Search lessons by name
   */
  async searchLessons(query: string): Promise<Lesson[]> {
    const lowerQuery = query.toLowerCase()
    return mockLessons.filter(
      (l) =>
        l.gestureName.toLowerCase().includes(lowerQuery) ||
        l.displayName.toLowerCase().includes(lowerQuery)
    )
  }
}

/**
 * Singleton instance of the mock content repository
 */
export const mockContentRepository = new MockContentRepository()
