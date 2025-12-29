import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ModuleCard, ModuleProgress } from './ModuleCard'
import { Module } from '../../types/database'

// Mock do módulo
const mockModule: Module = {
  id: 'module-1',
  slug: 'alfabeto',
  title: 'Alfabeto',
  description: 'Aprenda as letras do alfabeto em Libras',
  difficultyLevel: 'iniciante',
  orderIndex: 1,
  iconUrl: '/icons/alfabeto.svg',
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z',
}

const mockModuleWithoutIcon: Module = {
  ...mockModule,
  iconUrl: null,
  title: 'Módulo sem ícone',
}

describe('ModuleCard', () => {
  const mockOnClick = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders module information correctly', () => {
    render(<ModuleCard module={mockModule} onClick={mockOnClick} />)

    expect(screen.getByText('Alfabeto')).toBeInTheDocument()
    expect(screen.getByText('Aprenda as letras do alfabeto em Libras')).toBeInTheDocument()
    expect(screen.getByText('Iniciante')).toBeInTheDocument()
    expect(screen.getByText('Não iniciado')).toBeInTheDocument()
    expect(screen.getByText('0%')).toBeInTheDocument()
  })

  it('displays default icon when iconUrl is not provided', () => {
    render(<ModuleCard module={mockModuleWithoutIcon} onClick={mockOnClick} />)

    expect(screen.getByText('Módulo sem ícone')).toBeInTheDocument()
    expect(screen.getByRole('img', { hidden: true })).toBeInTheDocument()
  })

  it('calls onClick when card is clicked', () => {
    render(<ModuleCard module={mockModule} onClick={mockOnClick} />)

    const card = screen.getByRole('button')
    fireEvent.click(card)

    expect(mockOnClick).toHaveBeenCalledWith(mockModule)
    expect(mockOnClick).toHaveBeenCalledTimes(1)
  })

  it('calls onClick when Enter key is pressed', () => {
    render(<ModuleCard module={mockModule} onClick={mockOnClick} />)

    const card = screen.getByRole('button')
    fireEvent.keyDown(card, { key: 'Enter' })

    expect(mockOnClick).toHaveBeenCalledWith(mockModule)
  })

  it('calls onClick when Space key is pressed', () => {
    render(<ModuleCard module={mockModule} onClick={mockOnClick} />)

    const card = screen.getByRole('button')
    fireEvent.keyDown(card, { key: ' ' })

    expect(mockOnClick).toHaveBeenCalledWith(mockModule)
  })

  it('displays correct difficulty colors', () => {
    const { rerender } = render(<ModuleCard module={mockModule} onClick={mockOnClick} />)

    // Iniciante - green
    expect(screen.getByText('Iniciante')).toHaveClass('bg-green-100', 'text-green-800')

    // Intermediário
    const intermediarioModule = { ...mockModule, difficultyLevel: 'intermediario' as const }
    rerender(<ModuleCard module={intermediarioModule} onClick={mockOnClick} />)
    expect(screen.getByText('Intermediario')).toHaveClass('bg-yellow-100', 'text-yellow-800')

    // Avançado
    const avancadoModule = { ...mockModule, difficultyLevel: 'avancado' as const }
    rerender(<ModuleCard module={avancadoModule} onClick={mockOnClick} />)
    expect(screen.getByText('Avancado')).toHaveClass('bg-red-100', 'text-red-800')
  })

  it('displays progress information when provided', () => {
    const mockProgress: ModuleProgress = {
      moduleId: 'module-1',
      completedLessons: 2,
      totalLessons: 4,
      status: 'in-progress',
    }

    render(<ModuleCard module={mockModule} progress={mockProgress} onClick={mockOnClick} />)

    expect(screen.getByText('50% concluído')).toBeInTheDocument()
    expect(screen.getByText('50%')).toBeInTheDocument()
  })

  it('displays completed status correctly', () => {
    const mockProgress: ModuleProgress = {
      moduleId: 'module-1',
      completedLessons: 5,
      totalLessons: 5,
      status: 'completed',
    }

    render(<ModuleCard module={mockModule} progress={mockProgress} onClick={mockOnClick} />)

    expect(screen.getByText('Concluído')).toBeInTheDocument()
    expect(screen.getByText('100%')).toBeInTheDocument()
  })

  it('handles modules without description', () => {
    const moduleWithoutDesc = { ...mockModule, description: null }

    render(<ModuleCard module={moduleWithoutDesc} onClick={mockOnClick} />)

    expect(screen.getByText('Descrição não disponível')).toBeInTheDocument()
  })

  it('has correct accessibility attributes', () => {
    render(<ModuleCard module={mockModule} onClick={mockOnClick} />)

    const card = screen.getByRole('button')
    expect(card).toHaveAttribute('aria-label', `Módulo ${mockModule.title} - ${mockModule.description}`)
    expect(card).toHaveAttribute('tabIndex', '0')
  })

  it('has hover and focus styles', () => {
    render(<ModuleCard module={mockModule} onClick={mockOnClick} />)

    const card = screen.getByRole('button')

    // Check for hover classes (shadow-lg on hover)
    expect(card).toHaveClass('hover:shadow-lg')

    // Check for focus styles
    expect(card).toHaveClass('focus-within:ring-2', 'focus-within:ring-blue-500')
  })

  it('renders progress bar with correct width', () => {
    const mockProgress: ModuleProgress = {
      moduleId: 'module-1',
      completedLessons: 3,
      totalLessons: 10,
      status: 'in-progress',
    }

    render(<ModuleCard module={mockModule} progress={mockProgress} onClick={mockOnClick} />)

    const progressBar = screen.getByLabelText('Progresso: 30%')
    expect(progressBar).toHaveStyle({ width: '30%' }) // 3/10 = 30%
  })
})
