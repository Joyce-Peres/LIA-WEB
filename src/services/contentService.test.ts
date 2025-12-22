import { describe, it, expect, vi, beforeEach } from 'vitest'
import { contentService, ContentServiceUtils } from './contentService'
import { mockLessons } from '../data/mockContent'

// Mock console.error to avoid noise in tests
vi.spyOn(console, 'error').mockImplementation(() => {})

describe('ContentService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getModules', () => {
    it('deve retornar todos os módulos ordenados por orderIndex', async () => {
      const response = await contentService.getModules()

      expect(response.data).toHaveLength(3)
      expect(response.total).toBe(3)
      expect(response.hasMore).toBe(false)

      // Verificar ordenação
      expect(response.data[0].slug).toBe('alfabeto')
      expect(response.data[1].slug).toBe('numeros')
      expect(response.data[2].slug).toBe('saudacoes')
    })

    it('deve filtrar por difficulty level', async () => {
      const response = await contentService.getModules({
        difficultyLevel: 'iniciante'
      })

      expect(response.data).toHaveLength(2)
      expect(response.data.every(m => m.difficultyLevel === 'iniciante')).toBe(true)
    })

    it('deve suportar paginação', async () => {
      const response = await contentService.getModules({
        limit: 1,
        offset: 1
      })

      expect(response.data).toHaveLength(1)
      expect(response.data[0].slug).toBe('numeros')
      expect(response.hasMore).toBe(true)
    })
  })

  describe('getModuleById', () => {
    it('deve retornar módulo existente', async () => {
      const module = await contentService.getModuleById('mod-alfabeto')

      expect(module).not.toBeNull()
      expect(module!.id).toBe('mod-alfabeto')
      expect(module!.title).toBe('Alfabeto')
    })

    it('deve retornar null para módulo inexistente', async () => {
      const module = await contentService.getModuleById('mod-inexistente')

      expect(module).toBeNull()
    })
  })

  describe('getModuleBySlug', () => {
    it('deve retornar módulo por slug', async () => {
      const module = await contentService.getModuleBySlug('alfabeto')

      expect(module).not.toBeNull()
      expect(module!.slug).toBe('alfabeto')
      expect(module!.title).toBe('Alfabeto')
    })

    it('deve retornar null para slug inexistente', async () => {
      const module = await contentService.getModuleBySlug('inexistente')

      expect(module).toBeNull()
    })
  })

  describe('getLessons', () => {
    it('deve retornar todas as lições', async () => {
      const response = await contentService.getLessons()

      expect(response.data.length).toBeGreaterThan(0)
      expect(response.total).toBe(mockLessons.length)
    })

    it('deve filtrar por moduleId', async () => {
      const response = await contentService.getLessons({
        moduleId: 'mod-alfabeto'
      })

      expect(response.data.length).toBe(5) // 5 letras do alfabeto
      expect(response.data.every(l => l.moduleId === 'mod-alfabeto')).toBe(true)
    })

    it('deve incluir relações quando solicitado', async () => {
      const response = await contentService.getLessons({
        includeRelations: true,
        limit: 1
      })

      expect(response.data[0].module).toBeDefined()
      expect(response.data[0].module!.id).toBe(response.data[0].moduleId)
    })
  })

  describe('getLessonsByModule', () => {
    it('deve retornar lições de um módulo existente', async () => {
      const response = await contentService.getLessonsByModule('mod-alfabeto')

      expect(response.data.length).toBe(5)
      expect(response.data[0].module).toBeDefined()
      expect(response.data[0].module!.title).toBe('Alfabeto')
    })

    it('deve retornar lista vazia para módulo inexistente', async () => {
      const response = await contentService.getLessonsByModule('mod-inexistente')

      expect(response.data).toHaveLength(0)
      expect(response.total).toBe(0)
    })
  })

  describe('getLessonById', () => {
    it('deve retornar lição existente com módulo populado', async () => {
      const lesson = await contentService.getLessonById('les-a')

      expect(lesson).not.toBeNull()
      expect(lesson!.id).toBe('les-a')
      expect(lesson!.gestureName).toBe('A')
      expect(lesson!.module).toBeDefined()
      expect(lesson!.module!.title).toBe('Alfabeto')
    })

    it('deve retornar null para lição inexistente', async () => {
      const lesson = await contentService.getLessonById('les-inexistente')

      expect(lesson).toBeNull()
    })
  })

  describe('getModuleWithLessons', () => {
    it('deve retornar módulo com todas as lições', async () => {
      const result = await contentService.getModuleWithLessons('mod-alfabeto')

      expect(result).not.toBeNull()
      expect(result!.module.title).toBe('Alfabeto')
      expect(result!.lessons).toHaveLength(5)
      expect(result!.lessons.every(l => l.moduleId === 'mod-alfabeto')).toBe(true)
    })

    it('deve retornar null para módulo inexistente', async () => {
      const result = await contentService.getModuleWithLessons('mod-inexistente')

      expect(result).toBeNull()
    })
  })
})

describe('ContentServiceUtils', () => {
  describe('validateModule', () => {
    it('deve validar módulo válido', () => {
      const validModule = {
        id: 'test-id',
        slug: 'test-slug',
        title: 'Test Module',
        difficultyLevel: 'iniciante' as const,
        orderIndex: 1,
      }

      const result = ContentServiceUtils.validateModule(validModule)

      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('deve rejeitar módulo inválido', () => {
      const invalidModule = {
        // id faltando
        title: 'Test Module',
        // difficultyLevel faltando
        orderIndex: 'not-a-number',
      }

      const result = ContentServiceUtils.validateModule(invalidModule)

      expect(result.valid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })
  })

  describe('validateLesson', () => {
    it('deve validar lição válida', () => {
      const validLesson = {
        id: 'test-id',
        moduleId: 'mod-test',
        gestureName: 'TEST',
        displayName: 'Test Gesture',
        minConfidenceThreshold: 0.75,
        xpReward: 10,
      }

      const result = ContentServiceUtils.validateLesson(validLesson)

      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('deve rejeitar lição inválida', () => {
      const invalidLesson = {
        // id faltando
        gestureName: 'TEST',
        displayName: 'Test Gesture',
        minConfidenceThreshold: 'not-a-number',
      }

      const result = ContentServiceUtils.validateLesson(invalidLesson)

      expect(result.valid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })
  })

  describe('getContentStats', () => {
    it('deve retornar estatísticas corretas', () => {
      const stats = ContentServiceUtils.getContentStats()

      expect(stats.totalModules).toBe(3)
      expect(stats.totalLessons).toBe(mockLessons.length)
      expect(stats.modulesByDifficulty.iniciante).toBe(2)
      expect(stats.modulesByDifficulty.intermediario).toBe(1)
      expect(stats.averageXpPerLesson).toBeGreaterThan(0)
    })
  })
})
