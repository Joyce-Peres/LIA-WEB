/**
 * Mock Content Repository Tests
 *
 * Tests for the mock content repository.
 *
 * @module repositories/mockContentRepository.test
 * @category Test
 */

import { describe, it, expect } from 'vitest'
import { mockContentRepository } from './mockContentRepository'
import { mockModules } from '../data/mockContent'

describe('MockContentRepository', () => {
  describe('getModules', () => {
    it('should return all mock modules', async () => {
      const modules = await mockContentRepository.getModules()
      expect(modules).toEqual(mockModules)
      expect(modules.length).toBe(11)
    })
  })

  describe('getModuleById', () => {
    it('should return a module by ID', async () => {
      const module = await mockContentRepository.getModuleById('mod-alfabeto')
      expect(module).toBeTruthy()
      expect(module?.title).toBe('Alfabeto')
    })

    it('should return null for non-existent module', async () => {
      const module = await mockContentRepository.getModuleById('non-existent')
      expect(module).toBeNull()
    })
  })

  describe('getModuleBySlug', () => {
    it('should return a module by slug', async () => {
      const module = await mockContentRepository.getModuleBySlug('alfabeto')
      expect(module).toBeTruthy()
      expect(module?.id).toBe('mod-alfabeto')
    })

    it('should return null for non-existent slug', async () => {
      const module = await mockContentRepository.getModuleBySlug('non-existent')
      expect(module).toBeNull()
    })
  })

  describe('getLessonsByModule', () => {
    it('should return lessons for a module', async () => {
      const lessons = await mockContentRepository.getLessonsByModule('mod-alfabeto')
      expect(lessons.length).toBeGreaterThan(0)
      expect(lessons.every((l) => l.moduleId === 'mod-alfabeto')).toBe(true)
    })

    it('should return empty array for module with no lessons', async () => {
      const lessons = await mockContentRepository.getLessonsByModule('non-existent')
      expect(lessons).toEqual([])
    })
  })

  describe('getLessonsByModuleAndLevel', () => {
    it('should return lessons for a module and level', async () => {
      const lessons = await mockContentRepository.getLessonsByModuleAndLevel('mod-alfabeto', 1)
      expect(lessons.length).toBeGreaterThan(0)
      expect(lessons.every((l) => l.moduleId === 'mod-alfabeto' && l.level === 1)).toBe(true)
    })
  })

  describe('getLessonById', () => {
    it('should return a lesson by ID', async () => {
      const lesson = await mockContentRepository.getLessonById('les-a')
      expect(lesson).toBeTruthy()
      expect(lesson?.gestureName).toBe('A')
    })

    it('should return null for non-existent lesson', async () => {
      const lesson = await mockContentRepository.getLessonById('non-existent')
      expect(lesson).toBeNull()
    })
  })

  describe('getModulesWithStats', () => {
    it('should return modules with lesson counts', async () => {
      const modules = await mockContentRepository.getModulesWithStats()
      expect(modules.length).toBe(11)
      
      // Check that each module has a lessonCount
      modules.forEach((module) => {
        expect(typeof module.lessonCount).toBe('number')
        expect(module.lessonCount).toBeGreaterThanOrEqual(0)
      })

      // Alfabeto should have multiple lessons
      const alfabeto = modules.find((m) => m.id === 'mod-alfabeto')
      expect(alfabeto?.lessonCount).toBeGreaterThan(0)
    })
  })

  describe('getLevelsForModule', () => {
    it('should return levels for a module', async () => {
      const levels = await mockContentRepository.getLevelsForModule('mod-alfabeto')
      expect(levels.length).toBeGreaterThan(0)
      expect(levels).toContain(1)
    })

    it('should return levels in order', async () => {
      const levels = await mockContentRepository.getLevelsForModule('mod-alfabeto')
      const sortedLevels = [...levels].sort((a, b) => a - b)
      expect(levels).toEqual(sortedLevels)
    })
  })

  describe('searchLessons', () => {
    it('should search lessons by gesture name', async () => {
      const lessons = await mockContentRepository.searchLessons('A')
      expect(lessons.length).toBeGreaterThan(0)
    })

    it('should be case insensitive', async () => {
      const upper = await mockContentRepository.searchLessons('LETRA')
      const lower = await mockContentRepository.searchLessons('letra')
      expect(upper.length).toBe(lower.length)
    })
  })
})
