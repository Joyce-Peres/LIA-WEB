/**
 * Mock Content Data
 *
 * Mock data for modules and lessons to simulate Supabase database.
 * This provides initial content for development and testing.
 *
 * @module data/mockContent
 * @category Mock Data
 */

import type { Module, Lesson } from '../types/content'

/**
 * Mock modules data
 * Following the acceptance criteria: Alfabeto, Números, Saudações
 */
export const mockModules: Module[] = [
  {
    id: 'mod-alfabeto',
    slug: 'alfabeto',
    title: 'Alfabeto',
    description: 'Aprenda as letras do alfabeto em Libras através de gestos manuais',
    difficultyLevel: 'iniciante',
    orderIndex: 1,
    iconUrl: '/icons/alfabeto.svg',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'mod-numeros',
    slug: 'numeros',
    title: 'Números',
    description: 'Aprenda a representar números de 0 a 9 em Libras',
    difficultyLevel: 'iniciante',
    orderIndex: 2,
    iconUrl: '/icons/numeros.svg',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'mod-saudacoes',
    slug: 'saudacoes',
    title: 'Saudações',
    description: 'Expressões básicas de saudação e cortesia em Libras',
    difficultyLevel: 'intermediario',
    orderIndex: 3,
    iconUrl: '/icons/saudacoes.svg',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
]

/**
 * Mock lessons data
 * Sample lessons for each module
 */
export const mockLessons: Lesson[] = [
  // Alfabeto Module
  {
    id: 'les-a',
    moduleId: 'mod-alfabeto',
    gestureName: 'A',
    displayName: 'Letra A',
    videoRefUrl: '/videos/gestures/A.mp4',
    minConfidenceThreshold: 0.75,
    xpReward: 10,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'les-b',
    moduleId: 'mod-alfabeto',
    gestureName: 'B',
    displayName: 'Letra B',
    videoRefUrl: '/videos/gestures/B.mp4',
    minConfidenceThreshold: 0.75,
    xpReward: 10,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'les-c',
    moduleId: 'mod-alfabeto',
    gestureName: 'C',
    displayName: 'Letra C',
    videoRefUrl: '/videos/gestures/C.mp4',
    minConfidenceThreshold: 0.75,
    xpReward: 10,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'les-d',
    moduleId: 'mod-alfabeto',
    gestureName: 'D',
    displayName: 'Letra D',
    videoRefUrl: '/videos/gestures/D.mp4',
    minConfidenceThreshold: 0.75,
    xpReward: 10,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'les-e',
    moduleId: 'mod-alfabeto',
    gestureName: 'E',
    displayName: 'Letra E',
    videoRefUrl: '/videos/gestures/E.mp4',
    minConfidenceThreshold: 0.75,
    xpReward: 10,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },

  // Números Module
  {
    id: 'les-0',
    moduleId: 'mod-numeros',
    gestureName: '0',
    displayName: 'Número 0',
    videoRefUrl: '/videos/gestures/0.mp4',
    minConfidenceThreshold: 0.80,
    xpReward: 12,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'les-1',
    moduleId: 'mod-numeros',
    gestureName: '1',
    displayName: 'Número 1',
    videoRefUrl: '/videos/gestures/1.mp4',
    minConfidenceThreshold: 0.80,
    xpReward: 12,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'les-2',
    moduleId: 'mod-numeros',
    gestureName: '2',
    displayName: 'Número 2',
    videoRefUrl: '/videos/gestures/2.mp4',
    minConfidenceThreshold: 0.80,
    xpReward: 12,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'les-3',
    moduleId: 'mod-numeros',
    gestureName: '3',
    displayName: 'Número 3',
    videoRefUrl: '/videos/gestures/3.mp4',
    minConfidenceThreshold: 0.80,
    xpReward: 12,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'les-4',
    moduleId: 'mod-numeros',
    gestureName: '4',
    displayName: 'Número 4',
    videoRefUrl: '/videos/gestures/4.mp4',
    minConfidenceThreshold: 0.80,
    xpReward: 12,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'les-5',
    moduleId: 'mod-numeros',
    gestureName: '5',
    displayName: 'Número 5',
    videoRefUrl: '/videos/gestures/5.mp4',
    minConfidenceThreshold: 0.80,
    xpReward: 12,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },

  // Saudações Module
  {
    id: 'les-ola',
    moduleId: 'mod-saudacoes',
    gestureName: 'OLA',
    displayName: 'Olá',
    videoRefUrl: '/videos/gestures/OLA.mp4',
    minConfidenceThreshold: 0.70,
    xpReward: 15,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'les-obrigado',
    moduleId: 'mod-saudacoes',
    gestureName: 'OBRIGADO',
    displayName: 'Obrigado',
    videoRefUrl: '/videos/gestures/OBRIGADO.mp4',
    minConfidenceThreshold: 0.70,
    xpReward: 15,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'les-tchau',
    moduleId: 'mod-saudacoes',
    gestureName: 'TCHAU',
    displayName: 'Tchau',
    videoRefUrl: '/videos/gestures/TCHAU.mp4',
    minConfidenceThreshold: 0.70,
    xpReward: 15,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'les-bom-dia',
    moduleId: 'mod-saudacoes',
    gestureName: 'BOM_DIA',
    displayName: 'Bom Dia',
    videoRefUrl: '/videos/gestures/BOM_DIA.mp4',
    minConfidenceThreshold: 0.70,
    xpReward: 15,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
]

/**
 * Combined mock data for easy import
 */
export const mockContentData = {
  modules: mockModules,
  lessons: mockLessons,
}

/**
 * Utility functions for working with mock data
 */
export const MockContentUtils = {
  /**
   * Get lessons for a specific module
   */
  getLessonsForModule: (moduleId: string): Lesson[] => {
    return mockLessons.filter(lesson => lesson.moduleId === moduleId)
  },

  /**
   * Get module with populated lessons
   */
  getModuleWithLessons: (moduleId: string) => {
    const module = mockModules.find(m => m.id === moduleId)
    if (!module) return null

    const lessons = MockContentUtils.getLessonsForModule(moduleId)
    return {
      ...module,
      lessons,
    }
  },

  /**
   * Get all modules with lesson counts
   */
  getModulesWithStats: () => {
    return mockModules.map(module => ({
      ...module,
      lessonCount: MockContentUtils.getLessonsForModule(module.id).length,
    }))
  },
} as const
