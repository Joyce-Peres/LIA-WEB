import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { LearningPath } from './LearningPath'
import { Lesson, Module } from '../../types/database'

// Mock data
const mockModules: Module[] = [
  {
    id: 'module-1',
    slug: 'alfabeto',
    title: 'Alfabeto',
    description: 'Aprenda as letras',
    difficultyLevel: 'iniciante',
    orderIndex: 1,
    iconUrl: '/icons/alfabeto.svg',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'module-2',
    slug: 'numeros',
    title: 'Números',
    description: 'Aprenda os números',
    difficultyLevel: 'intermediario',
    orderIndex: 2,
    iconUrl: '/icons/numeros.svg',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
]

const mockLessons: Lesson[] = [
  {
    id: 'lesson-1',
    moduleId: 'module-1',
    gestureName: 'A',
    displayName: 'Letra A',
    videoRefUrl: '/videos/a.mp4',
    minConfidenceThreshold: 0.75,
    xpReward: 10,
    orderIndex: 1,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'lesson-2',
    moduleId: 'module-1',
    gestureName: 'B',
    displayName: 'Letra B',
    videoRefUrl: '/videos/b.mp4',
    minConfidenceThreshold: 0.75,
    xpReward: 10,
    orderIndex: 2,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'lesson-3',
    moduleId: 'module-2',
    gestureName: '1',
    displayName: 'Número 1',
    videoRefUrl: '/videos/1.mp4',
    minConfidenceThreshold: 0.75,
    xpReward: 10,
    orderIndex: 1,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
]

describe('LearningPath', () => {
  const mockOnLessonClick = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders learning path with lessons', () => {
    render(
      <LearningPath
        lessons={mockLessons}
        modules={mockModules}
        onLessonClick={mockOnLessonClick}
      />
    )

    expect(screen.getByText('Seu Progresso Geral')).toBeInTheDocument()
    expect(screen.getByText('Alfabeto')).toBeInTheDocument()
    expect(screen.getByText('Números')).toBeInTheDocument()
    expect(screen.getByText('Letra A')).toBeInTheDocument()
    expect(screen.getByText('Letra B')).toBeInTheDocument()
    expect(screen.getByText('Número 1')).toBeInTheDocument()
  })

  it('shows progress statistics', () => {
    render(
      <LearningPath
        lessons={mockLessons}
        modules={mockModules}
        onLessonClick={mockOnLessonClick}
      />
    )

    expect(screen.getByText('3 módulos disponíveis')).toBeInTheDocument()
    expect(screen.getByText('1 iniciante, 1 intermediário, 0 avançado')).toBeInTheDocument()
  })

  it('calculates and displays progress overview', () => {
    render(
      <LearningPath
        lessons={mockLessons}
        modules={mockModules}
        onLessonClick={mockOnLessonClick}
      />
    )

    // With demo logic: lessons 1-5 completed, 6-8 in progress, rest locked
    // So 2 out of 3 lessons should be completed (67%)
    expect(screen.getByText('67%')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument() // completed
    expect(screen.getByText('0')).toBeInTheDocument() // in progress
    expect(screen.getByText('1')).toBeInTheDocument() // locked
  })

  it('groups lessons by modules correctly', () => {
    render(
      <LearningPath
        lessons={mockLessons}
        modules={mockModules}
        onLessonClick={mockOnLessonClick}
      />
    )

    // Should show modules in order
    const alfabetoSection = screen.getByText('Alfabeto').closest('div')
    const numerosSection = screen.getByText('Números').closest('div')

    expect(alfabetoSection).toBeInTheDocument()
    expect(numerosSection).toBeInTheDocument()
  })

  it('calls onLessonClick when lesson is clicked', () => {
    render(
      <LearningPath
        lessons={mockLessons}
        modules={mockModules}
        onLessonClick={mockOnLessonClick}
      />
    )

    // Find and click on a lesson star (should be completed based on demo logic)
    const lessonStar = screen.getByLabelText('Letra A - Concluída')
    fireEvent.click(lessonStar)

    expect(mockOnLessonClick).toHaveBeenCalledWith(mockLessons[0])
  })

  it('shows motivational message', () => {
    render(
      <LearningPath
        lessons={mockLessons}
        modules={mockModules}
        onLessonClick={mockOnLessonClick}
      />
    )

    expect(screen.getByText('Você está indo muito bem!')).toBeInTheDocument()
  })

  it('shows empty state when no lessons', () => {
    render(
      <LearningPath
        lessons={[]}
        modules={[]}
        onLessonClick={mockOnLessonClick}
      />
    )

    expect(screen.getByText('Nenhum conteúdo disponível')).toBeInTheDocument()
    expect(screen.getByText('No momento não há lições disponíveis para estudo.')).toBeInTheDocument()
  })

  it('shows module progress summary', () => {
    render(
      <LearningPath
        lessons={mockLessons}
        modules={mockModules}
        onLessonClick={mockOnLessonClick}
      />
    )

    expect(screen.getByText('2 de 2 lições concluídas')).toBeInTheDocument() // Alfabeto
    expect(screen.getByText('1 de 1 lições concluídas')).toBeInTheDocument() // Números
  })

  it('sorts modules by orderIndex', () => {
    const reversedModules = [...mockModules].reverse() // Wrong order

    render(
      <LearningPath
        lessons={mockLessons}
        modules={reversedModules}
        onLessonClick={mockOnLessonClick}
      />
    )

    // Should still show Alfabeto first, then Números
    const modules = screen.getAllByText(/Alfabeto|Números/)
    expect(modules[0]).toHaveTextContent('Alfabeto')
    expect(modules[1]).toHaveTextContent('Números')
  })

  it('applies custom className', () => {
    render(
      <LearningPath
        lessons={mockLessons}
        modules={mockModules}
        onLessonClick={mockOnLessonClick}
        className="custom-path-class"
      />
    )

    const pathContainer = document.querySelector('.learning-path')
    expect(pathContainer).toHaveClass('custom-path-class')
  })

  it('shows different motivational messages based on progress', () => {
    // Test with 100% progress (all lessons completed)
    const allCompletedLessons = mockLessons.map((lesson, index) => ({
      ...lesson,
      gestureName: index < 10 ? '1' : '9', // Make all appear completed
    }))

    const { rerender } = render(
      <LearningPath
        lessons={allCompletedLessons}
        modules={mockModules}
        onLessonClick={mockOnLessonClick}
      />
    )

    expect(screen.getByText('Parabéns! Você completou todo o caminho!')).toBeInTheDocument()

    // Test with low progress
    const lowProgressLessons = mockLessons.map((lesson, index) => ({
      ...lesson,
      gestureName: '9', // Make all appear locked
    }))

    rerender(
      <LearningPath
        lessons={lowProgressLessons}
        modules={mockModules}
        onLessonClick={mockOnLessonClick}
      />
    )

    expect(screen.getByText('Continue praticando!')).toBeInTheDocument()
  })
})
