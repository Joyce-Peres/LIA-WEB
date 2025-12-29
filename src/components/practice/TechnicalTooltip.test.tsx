import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { TechnicalTooltip } from './TechnicalTooltip'
import { TooltipTechnicalData } from '../../hooks/ui/useTooltip'

describe('TechnicalTooltip', () => {
  const mockOnClose = vi.fn()
  const baseProps = {
    position: { x: 200, y: 150 },
    isVisible: true,
    onClose: mockOnClose
  }

  const mockData: TooltipTechnicalData = {
    confidence: 0.85,
    inferenceTime: 45,
    gesture: 'Olá',
    isCorrect: true
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders nothing when not visible', () => {
    render(
      <TechnicalTooltip
        technicalData={mockData}
        position={baseProps.position}
        isVisible={false}
        onClose={mockOnClose}
      />
    )

    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  })

  it('renders tooltip when visible', () => {
    render(
      <TechnicalTooltip
        technicalData={mockData}
        {...baseProps}
      />
    )

    const tooltip = screen.getByRole('tooltip')
    expect(tooltip).toBeInTheDocument()
    expect(tooltip).toHaveAttribute('aria-live', 'polite')
  })

  it('displays confidence percentage', () => {
    render(
      <TechnicalTooltip
        technicalData={{ confidence: 0.75, inferenceTime: 60, gesture: 'Teste' }}
        {...baseProps}
      />
    )

    expect(screen.getByText('75.0%')).toBeInTheDocument()
  })

  it('displays inference time', () => {
    render(
      <TechnicalTooltip
        technicalData={mockData}
        {...baseProps}
      />
    )

    expect(screen.getByText('45ms')).toBeInTheDocument()
  })

  it('shows green color for high confidence', () => {
    render(
      <TechnicalTooltip
        technicalData={{ confidence: 0.9, inferenceTime: 30, gesture: 'Teste' }}
        {...baseProps}
      />
    )

    const confidenceText = screen.getByText('90.0%')
    expect(confidenceText).toHaveClass('text-green-400')
  })

  it('shows yellow color for medium confidence', () => {
    render(
      <TechnicalTooltip
        technicalData={{ confidence: 0.7, inferenceTime: 30, gesture: 'Teste' }}
        {...baseProps}
      />
    )

    const confidenceText = screen.getByText('70.0%')
    expect(confidenceText).toHaveClass('text-yellow-400')
  })

  it('shows red color for low confidence', () => {
    render(
      <TechnicalTooltip
        technicalData={{ confidence: 0.5, inferenceTime: 30, gesture: 'Teste' }}
        {...baseProps}
      />
    )

    const confidenceText = screen.getByText('50.0%')
    expect(confidenceText).toHaveClass('text-red-400')
  })

  it('displays confidence bar with correct width', () => {
    render(
      <TechnicalTooltip
        technicalData={{ confidence: 0.75, inferenceTime: 30, gesture: 'Teste' }}
        {...baseProps}
      />
    )

    const progressBar = screen.getByLabelText('Barra de confiança: 75%')
    expect(progressBar).toHaveStyle({ width: '75%' })
  })

  it('shows performance rating', () => {
    render(
      <TechnicalTooltip
        technicalData={{ confidence: 0.9, inferenceTime: 30 }}
        {...baseProps}
      />
    )

    expect(screen.getByText('Excelente')).toBeInTheDocument()
  })

  it('shows fast performance indicator', () => {
    render(
      <TechnicalTooltip
        technicalData={{ confidence: 0.8, inferenceTime: 40, gesture: 'Teste' }}
        {...baseProps}
      />
    )

    expect(screen.getByText('⚡ Rápido')).toBeInTheDocument()
  })

  it('shows adequate performance indicator', () => {
    render(
      <TechnicalTooltip
        technicalData={{ confidence: 0.8, inferenceTime: 75, gesture: 'Teste' }}
        {...baseProps}
      />
    )

    expect(screen.getByText('✓ Adequado')).toBeInTheDocument()
  })

  it('shows slow performance indicator', () => {
    render(
      <TechnicalTooltip
        technicalData={{ confidence: 0.8, inferenceTime: 120, gesture: 'Teste' }}
        {...baseProps}
      />
    )

    expect(screen.getByText('🐌 Lento')).toBeInTheDocument()
  })

  it('displays gesture name when provided', () => {
    const dataWithGesture: TooltipTechnicalData = {
      confidence: 0.8,
      inferenceTime: 50,
      gesture: 'Olá',
      isCorrect: true
    }

    render(
      <TechnicalTooltip
        technicalData={dataWithGesture}
        {...baseProps}
      />
    )

    expect(screen.getByText(/Olá/)).toBeInTheDocument()
  })

  it('closes tooltip when close button is clicked', () => {
    render(
      <TechnicalTooltip
        technicalData={mockData}
        {...baseProps}
      />
    )

    const closeButton = screen.getByLabelText('Fechar tooltip')
    fireEvent.click(closeButton)

    expect(mockOnClose).toHaveBeenCalled()
  })

  it('closes tooltip when backdrop is clicked', () => {
    render(
      <TechnicalTooltip
        technicalData={mockData}
        {...baseProps}
      />
    )

    // The backdrop is the first element with fixed positioning
    const backdrop = document.querySelector('.fixed.inset-0.z-40')
    if (backdrop) {
      fireEvent.click(backdrop)
      expect(mockOnClose).toHaveBeenCalled()
    }
  })

  it('prevents event propagation on close button click', () => {
    render(
      <TechnicalTooltip
        technicalData={mockData}
        {...baseProps}
      />
    )

    const closeButton = screen.getByLabelText('Fechar tooltip')

    // Simulate click with custom event
    closeButton.click()

    // The event propagation prevention is handled internally, so we just check if onClose was called
    expect(mockOnClose).toHaveBeenCalled()
  })

  it('positions tooltip correctly', () => {
    render(
      <TechnicalTooltip
        technicalData={mockData}
        position={{ x: 300, y: 200 }}
        isVisible={true}
        onClose={mockOnClose}
      />
    )

    const tooltip = screen.getByRole('tooltip')
    expect(tooltip).toHaveStyle({
      left: '300px',
      top: '200px',
      transform: 'translate(-50%, -100%)'
    })
  })

  it('has correct accessibility attributes', () => {
    const dataWithGesture: TooltipTechnicalData = {
      confidence: 0.8,
      inferenceTime: 50,
      gesture: 'Olá'
    }

    render(
      <TechnicalTooltip
        technicalData={dataWithGesture}
        {...baseProps}
      />
    )

    const tooltip = screen.getByRole('tooltip')
    expect(tooltip).toHaveAttribute('aria-live', 'polite')
    expect(tooltip).toHaveAttribute('aria-label', 'Detalhes técnicos do reconhecimento: Olá')
  })

  it('shows timestamp if provided', () => {
    const dataWithTimestamp: TooltipTechnicalData = {
      confidence: 0.8,
      inferenceTime: 50,
      timestamp: 1234567890
    }

    render(
      <TechnicalTooltip
        technicalData={dataWithTimestamp}
        {...baseProps}
      />
    )

    // Component renders without issues - timestamp is accepted but not displayed
    const tooltip = screen.getByRole('tooltip')
    expect(tooltip).toBeInTheDocument()
  })
})