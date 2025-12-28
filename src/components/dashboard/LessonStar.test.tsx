import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { LessonStar } from './LessonStar'
import { Lesson } from '../../types/database'

// Mock lesson data
const mockLesson: Lesson = {
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
}

describe('LessonStar', () => {
  const mockOnClick = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders completed lesson correctly', () => {
    render(<LessonStar lesson={mockLesson} status="completed" onClick={mockOnClick} />)

    expect(screen.getByText('Letra A')).toBeInTheDocument()
    expect(screen.getByText('Concluída')).toBeInTheDocument()
    expect(screen.getByText('1')).toBeInTheDocument() // orderIndex badge
  })

  it('renders in-progress lesson correctly', () => {
    render(<LessonStar lesson={mockLesson} status="in-progress" onClick={mockOnClick} />)

    expect(screen.getByText('Em andamento')).toBeInTheDocument()
  })

  it('renders locked lesson correctly', () => {
    render(<LessonStar lesson={mockLesson} status="locked" onClick={mockOnClick} />)

    expect(screen.getByText('Bloqueada')).toBeInTheDocument()
  })

  it('calls onClick when star is clicked (completed)', () => {
    render(<LessonStar lesson={mockLesson} status="completed" onClick={mockOnClick} />)

    const starButton = screen.getByRole('button')
    fireEvent.click(starButton)

    expect(mockOnClick).toHaveBeenCalledTimes(1)
  })

  it('calls onClick when star is clicked (in-progress)', () => {
    render(<LessonStar lesson={mockLesson} status="in-progress" onClick={mockOnClick} />)

    const starButton = screen.getByRole('button')
    fireEvent.click(starButton)

    expect(mockOnClick).toHaveBeenCalledTimes(1)
  })

  it('does not call onClick when locked star is clicked', () => {
    render(<LessonStar lesson={mockLesson} status="locked" onClick={mockOnClick} />)

    // When locked, the element has role="presentation", not "button"
    const starElement = screen.getByLabelText('Letra A - Bloqueada')
    expect(starElement).toHaveAttribute('role', 'presentation')
    
    fireEvent.click(starElement)

    expect(mockOnClick).not.toHaveBeenCalled()
  })

  it('calls onClick on Enter key press', () => {
    render(<LessonStar lesson={mockLesson} status="completed" onClick={mockOnClick} />)

    const starButton = screen.getByRole('button')
    fireEvent.keyDown(starButton, { key: 'Enter' })

    expect(mockOnClick).toHaveBeenCalledTimes(1)
  })

  it('calls onClick on Space key press', () => {
    render(<LessonStar lesson={mockLesson} status="completed" onClick={mockOnClick} />)

    const starButton = screen.getByRole('button')
    fireEvent.keyDown(starButton, { key: ' ' })

    expect(mockOnClick).toHaveBeenCalledTimes(1)
  })

  it('shows correct accessibility attributes', () => {
    render(<LessonStar lesson={mockLesson} status="completed" onClick={mockOnClick} />)

    const starButton = screen.getByRole('button')
    expect(starButton).toHaveAttribute('aria-label', 'Letra A - Concluída')
    expect(starButton).toHaveAttribute('tabIndex', '0')
  })

  it('shows sparkle effects for completed lessons', () => {
    render(<LessonStar lesson={mockLesson} status="completed" onClick={mockOnClick} />)

    // Check for sparkle elements (they have specific positioning classes)
    const sparkleElements = document.querySelectorAll('.absolute.top-1, .absolute.bottom-2, .absolute.top-3')
    expect(sparkleElements.length).toBeGreaterThan(0)
  })

  it('does not show sparkle effects for non-completed lessons', () => {
    render(<LessonStar lesson={mockLesson} status="locked" onClick={mockOnClick} />)

    const sparkleElements = document.querySelectorAll('.absolute.top-1, .absolute.bottom-2, .absolute.top-3')
    expect(sparkleElements.length).toBe(0)
  })

  it('shows tooltip on hover', () => {
    render(<LessonStar lesson={mockLesson} status="completed" onClick={mockOnClick} />)

    const starContainer = screen.getByRole('button').parentElement!

    // Initially tooltip should not be visible (opacity-0)
    let tooltip = screen.getByText('Concluída').closest('.absolute')
    expect(tooltip).toHaveClass('opacity-0')

    // Simulate hover
    fireEvent.mouseEnter(starContainer)

    tooltip = screen.getByText('Concluída').closest('.absolute')!
    expect(tooltip).toHaveClass('opacity-100')

    // Simulate mouse leave
    fireEvent.mouseLeave(starContainer)
    expect(tooltip).toHaveClass('opacity-0')
  })

  it('applies custom className', () => {
    render(<LessonStar lesson={mockLesson} status="completed" onClick={mockOnClick} className="custom-class" />)

    const container = screen.getByRole('button').closest('.lesson-star')
    expect(container).toHaveClass('custom-class')
  })

  it('renders different lessons with different order indices', () => {
    const lesson2 = { ...mockLesson, displayName: 'Letra B', orderIndex: 2 }

    render(<LessonStar lesson={lesson2} status="completed" onClick={mockOnClick} />)

    expect(screen.getByText('Letra B')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
  })
})
