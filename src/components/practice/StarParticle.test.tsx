import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { StarParticle } from './StarParticle'

describe('StarParticle', () => {
  const mockOnComplete = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  it('renders star emoji', () => {
    render(
      <StarParticle
        id="test-star"
        x={100}
        y={100}
        size={24}
        color="yellow"
        onComplete={mockOnComplete}
      />
    )

    const star = screen.getByRole('img', { hidden: true })
    expect(star).toHaveTextContent('⭐')
  })

  it('applies correct color classes', () => {
    const { rerender } = render(
      <StarParticle
        id="test-star"
        x={100}
        y={100}
        size={24}
        color="yellow"
        onComplete={mockOnComplete}
      />
    )

    let container = screen.getByRole('img', { hidden: true }).parentElement
    expect(container).toHaveClass('text-yellow-400')

    rerender(
      <StarParticle
        id="test-star"
        x={100}
        y={100}
        size={24}
        color="purple"
        onComplete={mockOnComplete}
      />
    )

    container = screen.getByRole('img', { hidden: true }).parentElement
    expect(container).toHaveClass('text-purple-400')
  })

  it('starts at initial position', () => {
    render(
      <StarParticle
        id="test-star"
        x={150}
        y={200}
        size={24}
        color="yellow"
        onComplete={mockOnComplete}
      />
    )

    const container = screen.getByRole('img', { hidden: true }).parentElement
    expect(container).toHaveStyle({ left: '150px', top: '200px' })
  })

  it('applies correct size', () => {
    render(
      <StarParticle
        id="test-star"
        x={100}
        y={100}
        size={32}
        color="yellow"
        onComplete={mockOnComplete}
      />
    )

    const container = screen.getByRole('img', { hidden: true }).parentElement
    expect(container).toHaveStyle({ fontSize: '32px' })
  })

  it('has correct accessibility attributes', () => {
    render(
      <StarParticle
        id="test-star"
        x={100}
        y={100}
        size={24}
        color="yellow"
        onComplete={mockOnComplete}
      />
    )

    const star = screen.getByRole('img', { hidden: true })
    expect(star).toHaveAttribute('aria-label', 'estrela')
    expect(star).toHaveAttribute('aria-hidden', 'true')
  })

  it('has correct styling for overlay', () => {
    render(
      <StarParticle
        id="test-star"
        x={100}
        y={100}
        size={24}
        color="yellow"
        onComplete={mockOnComplete}
      />
    )

    const container = screen.getByRole('img', { hidden: true }).parentElement
    expect(container).toHaveClass('absolute', 'pointer-events-none', 'select-none')
    expect(container).toHaveStyle({ zIndex: '40' })
  })

  it('calls onComplete when animation finishes', async () => {
    render(
      <StarParticle
        id="test-star"
        x={100}
        y={100}
        size={24}
        color="yellow"
        onComplete={mockOnComplete}
        duration={100} // Short duration for test
      />
    )

    // Wait for animation to complete
    await waitFor(
      () => {
        expect(mockOnComplete).toHaveBeenCalledWith('test-star')
      },
      { timeout: 500 }
    )
  })

  it('supports custom duration', async () => {
    const customDuration = 2000

    render(
      <StarParticle
        id="test-star"
        x={100}
        y={100}
        size={24}
        color="yellow"
        onComplete={mockOnComplete}
        duration={customDuration}
      />
    )

    // Should not complete immediately
    expect(mockOnComplete).not.toHaveBeenCalled()

    // Fast-forward time
    vi.advanceTimersByTime(customDuration + 100)

    await waitFor(() => {
      expect(mockOnComplete).toHaveBeenCalledWith('test-star')
    })
  })

  it('has drop shadow effect', () => {
    render(
      <StarParticle
        id="test-star"
        x={100}
        y={100}
        size={24}
        color="yellow"
        onComplete={mockOnComplete}
      />
    )

    const container = screen.getByRole('img', { hidden: true }).parentElement
    expect(container).toHaveClass('drop-shadow-[0_0_4px_rgba(251,191,36,0.5)]')
  })

  it('purple stars have purple drop shadow', () => {
    render(
      <StarParticle
        id="test-star"
        x={100}
        y={100}
        size={24}
        color="purple"
        onComplete={mockOnComplete}
      />
    )

    const container = screen.getByRole('img', { hidden: true }).parentElement
    expect(container).toHaveClass('drop-shadow-[0_0_4px_rgba(147,51,234,0.5)]')
  })

  it('supports custom gravity', () => {
    render(
      <StarParticle
        id="test-star"
        x={100}
        y={100}
        size={24}
        color="yellow"
        onComplete={mockOnComplete}
        gravity={300}
      />
    )

    // Component should render without issues
    const star = screen.getByRole('img', { hidden: true })
    expect(star).toBeInTheDocument()
  })

  it('different instances have different IDs', () => {
    render(
      <>
        <StarParticle
          id="star-1"
          x={100}
          y={100}
          size={24}
          color="yellow"
          onComplete={mockOnComplete}
        />
        <StarParticle
          id="star-2"
          x={150}
          y={150}
          size={24}
          color="purple"
          onComplete={mockOnComplete}
        />
      </>
    )

    const stars = screen.getAllByRole('img', { hidden: true })
    expect(stars).toHaveLength(2)
  })
})
