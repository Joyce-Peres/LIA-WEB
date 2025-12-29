import { describe, it, expect } from 'vitest'
import type { Module, Lesson, DifficultyLevel, ModuleWithLessons } from './database'

describe('Database Types', () => {
  it('should validate Module interface', () => {
    const module: Module = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      slug: 'alfabeto',
      title: 'Alfabeto',
      description: 'Aprenda as letras do alfabeto em Libras',
      difficultyLevel: 'iniciante',
      orderIndex: 1,
      iconUrl: '/icons/alfabeto.svg',
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
    }

    expect(module.slug).toBe('alfabeto')
    expect(module.difficultyLevel).toBe('iniciante')
    expect(module.orderIndex).toBe(1)
  })

  it('should validate Lesson interface', () => {
    const lesson: Lesson = {
      id: '123e4567-e89b-12d3-a456-426614174001',
      moduleId: '123e4567-e89b-12d3-a456-426614174000',
      gestureName: 'A',
      displayName: 'Letra A',
      videoRefUrl: '/videos/letra-a.mp4',
      minConfidenceThreshold: 0.75,
      xpReward: 10,
      orderIndex: 1,
      level: 1,
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
    }

    expect(lesson.gestureName).toBe('A')
    expect(lesson.minConfidenceThreshold).toBe(0.75)
    expect(lesson.xpReward).toBe(10)
  })

  it('should validate DifficultyLevel type', () => {
    const validLevels: DifficultyLevel[] = ['iniciante', 'intermediario', 'avancado']

    validLevels.forEach(level => {
      expect(['iniciante', 'intermediario', 'avancado']).toContain(level)
    })

    // This should cause a TypeScript error if uncommented:
    // const invalidLevel: DifficultyLevel = 'expert' // TypeScript error
  })

  it('should validate ModuleWithLessons interface', () => {
    const moduleWithLessons: ModuleWithLessons = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      slug: 'alfabeto',
      title: 'Alfabeto',
      description: 'Aprenda as letras do alfabeto em Libras',
      difficultyLevel: 'iniciante',
      orderIndex: 1,
      iconUrl: '/icons/alfabeto.svg',
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
      lessons: [],
      totalLessons: 0,
      completedLessons: 0,
    }

    expect(moduleWithLessons.lessons).toEqual([])
    expect(moduleWithLessons.totalLessons).toBe(0)
    expect(moduleWithLessons.completedLessons).toBe(0)
  })

  it('should validate confidence threshold range', () => {
    // These should be valid
    const validLesson: Lesson = {
      id: '123e4567-e89b-12d3-a456-426614174001',
      moduleId: '123e4567-e89b-12d3-a456-426614174000',
      gestureName: 'A',
      displayName: 'Letra A',
      videoRefUrl: '/videos/letra-a.mp4',
      minConfidenceThreshold: 0.75, // Valid: between 0 and 1
      xpReward: 10,
      orderIndex: 1,
      level: 1,
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
    }

    expect(validLesson.minConfidenceThreshold).toBeGreaterThanOrEqual(0)
    expect(validLesson.minConfidenceThreshold).toBeLessThanOrEqual(1)
  })
})
