import { describe, it, expect, vi, beforeEach } from 'vitest'
import { contentRepository, SupabaseContentRepository } from './contentRepository'
import type { Module, Lesson } from '../types/database'

// Mock Supabase
vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      single: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      range: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
    })),
  },
}))

import { supabase } from '../lib/supabase'

// Mock data
const mockModule = {
  id: 'module-1',
  slug: 'alfabeto',
  title: 'Alfabeto',
  description: 'Aprenda as letras',
  difficulty_level: 'iniciante',
  order_index: 1,
  icon_url: '/icons/alfabeto.svg',
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
}

const mockLesson = {
  id: 'lesson-1',
  module_id: 'module-1',
  gesture_name: 'A',
  display_name: 'Letra A',
  video_ref_url: '/videos/letra-a.mp4',
  min_confidence_threshold: 0.75,
  xp_reward: 10,
  order_index: 1,
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
}

const mockLessonWithModule = {
  ...mockLesson,
  modules: mockModule,
}

describe('ContentRepository', () => {
  let mockQuery: any

  beforeEach(() => {
    vi.clearAllMocks()

    // Setup mock query chain that returns itself for chaining
    mockQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      single: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      range: vi.fn().mockReturnThis(),
    }

    // Make sure supabase.from returns the mockQuery
    vi.mocked(supabase.from).mockReturnValue(mockQuery as any)
  })

  describe('getModules', () => {
    it('should return modules ordered by order_index', async () => {
    // Mock the final resolved value
    mockQuery.select.mockResolvedValueOnce({
      data: [mockModule],
      error: null,
    })

    const result = await contentRepository.getModules()

    expect(result).toHaveLength(1)
    expect(result[0]).toEqual({
      id: 'module-1',
      slug: 'alfabeto',
      title: 'Alfabeto',
      description: 'Aprenda as letras',
      difficultyLevel: 'iniciante',
      orderIndex: 1,
      iconUrl: '/icons/alfabeto.svg',
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
    })
  })

    it('should filter by difficulty level', async () => {
    mockQuery.select.mockResolvedValueOnce({
      data: [mockModule],
      error: null,
    })

    const result = await contentRepository.getModules({ difficultyLevel: 'iniciante' })

    expect(result).toHaveLength(1)
    expect(result[0].difficultyLevel).toBe('iniciante')
  })

    it('should handle errors gracefully', async () => {
      mockQuery.select.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      })

      const result = await contentRepository.getModules()

      expect(result).toEqual([])
    })

    it('should handle exceptions gracefully', async () => {
      mockQuery.select.mockRejectedValue(new Error('Network error'))

      const result = await contentRepository.getModules()

      expect(result).toEqual([])
    })
  })

  describe('getModuleById', () => {
    it('should return a module by ID', async () => {
    mockQuery.select.mockResolvedValueOnce({
      data: mockModule,
      error: null,
    })

    const result = await contentRepository.getModuleById('module-1')

    expect(result).toBeTruthy()
    expect(result!.id).toBe('module-1')
  })

    it('should return null for non-existent module', async () => {
    mockQuery.select.mockResolvedValueOnce({
      data: null,
      error: { code: 'PGRST116' },
    })

    const result = await contentRepository.getModuleById('non-existent')

    expect(result).toBeNull()
  })
  })

  describe('getModuleBySlug', () => {
    it('should return a module by slug', async () => {
    mockQuery.select.mockResolvedValueOnce({
      data: mockModule,
      error: null,
    })

    const result = await contentRepository.getModuleBySlug('alfabeto')

    expect(result).toBeTruthy()
    expect(result!.slug).toBe('alfabeto')
  })
  })

  describe('getLessonsByModule', () => {
    it('should return lessons for a module', async () => {
    mockQuery.select.mockResolvedValueOnce({
      data: [mockLesson],
      error: null,
    })

    const result = await contentRepository.getLessonsByModule('module-1')

    expect(result).toHaveLength(1)
    expect(result[0].gestureName).toBe('A')
  })

    it('should apply limit and offset', async () => {
    mockQuery.select.mockResolvedValueOnce({
      data: [mockLesson],
      error: null,
    })

    const result = await contentRepository.getLessonsByModule('module-1', { limit: 10, offset: 5 })

    expect(result).toHaveLength(1)
  })
  })

  describe('getLessonById', () => {
    it('should return lesson with module info', async () => {
    mockQuery.select.mockResolvedValueOnce({
      data: mockLessonWithModule,
      error: null,
    })

    const result = await contentRepository.getLessonById('lesson-1')

    expect(result).toBeTruthy()
    expect(result!.id).toBe('lesson-1')
    expect(result!.module.slug).toBe('alfabeto')
  })

    it('should return null for non-existent lesson', async () => {
      mockQuery.select.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' },
      })

      const result = await contentRepository.getLessonById('non-existent')

      expect(result).toBeNull()
    })
  })

  describe('countLessonsByModule', () => {
    it('should count lessons for a module', async () => {
    mockQuery.select.mockResolvedValueOnce({
      data: null,
      error: null,
      count: 5,
    })

    const result = await contentRepository.countLessonsByModule('module-1')

    expect(result).toBe(5)
  })

    it('should return 0 on error', async () => {
      mockQuery.select.mockResolvedValue({
        data: null,
        error: { message: 'Count error' },
        count: null,
      })

      const result = await contentRepository.countLessonsByModule('module-1')

      expect(result).toBe(0)
    })
  })

  describe('getModuleWithLessons', () => {
    it('should return module with its lessons', async () => {
      // Mock getModuleById
      vi.spyOn(contentRepository, 'getModuleById').mockResolvedValue({
        id: 'module-1',
        slug: 'alfabeto',
        title: 'Alfabeto',
        description: 'Aprenda as letras',
        difficultyLevel: 'iniciante',
        orderIndex: 1,
        iconUrl: '/icons/alfabeto.svg',
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
      })

      // Mock getLessonsByModule
      vi.spyOn(contentRepository, 'getLessonsByModule').mockResolvedValue([{
        id: 'lesson-1',
        moduleId: 'module-1',
        gestureName: 'A',
        displayName: 'Letra A',
        videoRefUrl: '/videos/letra-a.mp4',
        minConfidenceThreshold: 0.75,
        xpReward: 10,
        orderIndex: 1,
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
      }])

      const result = await contentRepository.getModuleWithLessons('module-1')

      expect(result).toBeTruthy()
      expect(result!.id).toBe('module-1')
      expect(result!.lessons).toHaveLength(1)
      expect(result!.totalLessons).toBe(1)
    })
  })

  describe('getModulesWithStats', () => {
    it('should return modules with lesson counts', async () => {
      // Mock getModules
      vi.spyOn(contentRepository, 'getModules').mockResolvedValue([{
        id: 'module-1',
        slug: 'alfabeto',
        title: 'Alfabeto',
        description: 'Aprenda as letras',
        difficultyLevel: 'iniciante',
        orderIndex: 1,
        iconUrl: '/icons/alfabeto.svg',
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
      }])

      // Mock countLessonsByModule
      vi.spyOn(contentRepository, 'countLessonsByModule').mockResolvedValue(26)

      const result = await contentRepository.getModulesWithStats()

      expect(result).toHaveLength(1)
      expect(result[0].lessonCount).toBe(26)
    })
  })
})
