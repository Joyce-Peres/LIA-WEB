import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ModulesCatalog } from './ModulesCatalog'
import { contentRepository } from '../repositories/contentRepository'
import { Module } from '../types/database'

// Mock do React Router
const mockNavigate = vi.fn()
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}))

// Mock do contentRepository
vi.mock('../repositories/contentRepository', () => ({
  contentRepository: {
    getModules: vi.fn(),
  },
}))

// Mock do módulo
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
    iconUrl: undefined,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
]

describe('ModulesCatalog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows loading skeleton initially', async () => {
    vi.mocked(contentRepository.getModules).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    )

    render(<ModulesCatalog />)

    // Loading skeleton shows skeleton elements
    const skeletons = document.querySelectorAll('.animate-pulse')
    expect(skeletons.length).toBeGreaterThan(0)
  })

  it('loads and displays modules successfully', async () => {
    vi.mocked(contentRepository.getModules).mockResolvedValue(mockModules)

    render(<ModulesCatalog />)

    await waitFor(() => {
      expect(screen.getByText('Alfabeto')).toBeInTheDocument()
      expect(screen.getByText('Números')).toBeInTheDocument()
    })

    await waitFor(() => {
      expect(screen.getByText('Alfabeto')).toBeInTheDocument()
      expect(screen.getByText('Números')).toBeInTheDocument()
    })
    
    // Check for modules count text (may be split across multiple span elements)
    const container = document.body
    const modulesText = container.textContent || ''
    expect(modulesText).toContain('2 módulos disponíveis')
    
    // Check for statistics text (may be split across elements)
    expect(modulesText).toContain('1 iniciante')
    expect(modulesText).toContain('intermediário')
  })

  it('shows error state when loading fails', async () => {
    const errorMessage = 'Network error'
    vi.mocked(contentRepository.getModules).mockRejectedValue(new Error(errorMessage))

    render(<ModulesCatalog />)

    await waitFor(() => {
      expect(screen.getByText('Erro ao carregar módulos')).toBeInTheDocument()
    })

    expect(screen.getByText('Erro ao carregar módulos. Verifique sua conexão com a internet.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Tentar novamente' })).toBeInTheDocument()
  })

  it('shows empty state when no modules are available', async () => {
    vi.mocked(contentRepository.getModules).mockResolvedValue([])

    render(<ModulesCatalog />)

    await waitFor(() => {
      expect(screen.getByText('Nenhum módulo disponível')).toBeInTheDocument()
    })

    // Check for empty state message - use getAllByText since there might be multiple matches
    const emptyMessages = screen.getAllByText((content, element) => {
      const text = element?.textContent || ''
      return text.includes('Nenhum módulo disponível') || text.includes('não há módulos')
    })
    expect(emptyMessages.length).toBeGreaterThan(0)
  })

  it('handles module click (placeholder functionality)', async () => {
    vi.mocked(contentRepository.getModules).mockResolvedValue(mockModules)

    // Mock window.alert
    const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {})

    render(<ModulesCatalog />)

    await waitFor(() => {
      expect(screen.getByText('Alfabeto')).toBeInTheDocument()
    })

    const moduleCard = screen.getByText('Alfabeto').closest('div')
    if (moduleCard) {
      fireEvent.click(moduleCard)
    }

    expect(alertMock).toHaveBeenCalledWith(
      'Funcionalidade em desenvolvimento!\n\nMódulo: Alfabeto\nSlug: alfabeto\n\nEm breve você poderá ver todas as lições deste módulo.'
    )

    alertMock.mockRestore()
  })

  it('retries loading when retry button is clicked', async () => {
    vi.mocked(contentRepository.getModules)
      .mockRejectedValueOnce(new Error('First error'))
      .mockResolvedValueOnce(mockModules)

    render(<ModulesCatalog />)

    await waitFor(() => {
      expect(screen.getByText('Erro ao carregar módulos')).toBeInTheDocument()
    })

    const retryButton = screen.getByRole('button', { name: 'Tentar novamente' })
    fireEvent.click(retryButton)

    await waitFor(() => {
      expect(screen.getByText('Alfabeto')).toBeInTheDocument()
    })

    expect(contentRepository.getModules).toHaveBeenCalledTimes(2)
  })

  it('displays correct module statistics', async () => {
    const modulesWithDifferentLevels: Module[] = [
      { ...mockModules[0], difficultyLevel: 'iniciante' },
      { ...mockModules[1], difficultyLevel: 'intermediario' },
      {
        ...mockModules[0],
        id: 'module-3',
        slug: 'avancado-test',
        title: 'Avançado',
        difficultyLevel: 'avancado' as const,
      },
    ]

    vi.mocked(contentRepository.getModules).mockResolvedValue(modulesWithDifferentLevels)

    render(<ModulesCatalog />)

    await waitFor(() => {
      expect(screen.getByText('Alfabeto')).toBeInTheDocument()
      expect(screen.getByText('Números')).toBeInTheDocument()
      expect(screen.getByText('Avançado')).toBeInTheDocument()
    })

    // Check for modules count and statistics text (may be split across multiple span elements)
    const container = document.body
    const modulesText = container.textContent || ''
    expect(modulesText).toContain('3 módulos disponíveis')
    expect(modulesText).toContain('1 iniciante')
    expect(modulesText).toContain('1 intermediário')
    expect(modulesText).toContain('1 avançado')
  })

  it('logs loading information to console', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

    vi.mocked(contentRepository.getModules).mockResolvedValue(mockModules)

    render(<ModulesCatalog />)

    await waitFor(() => {
      expect(screen.getByText('Alfabeto')).toBeInTheDocument()
    })

    expect(consoleSpy).toHaveBeenCalledWith('Loading modules from repository...')
    expect(consoleSpy).toHaveBeenCalledWith('Loaded 2 modules:', ['Alfabeto', 'Números'])

    consoleSpy.mockRestore()
  })

  it('logs errors to console', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    vi.mocked(contentRepository.getModules).mockRejectedValue(new Error('Test error'))

    render(<ModulesCatalog />)

    await waitFor(() => {
      expect(screen.getByText('Erro ao carregar módulos')).toBeInTheDocument()
    })

    expect(consoleSpy).toHaveBeenCalledWith('Failed to load modules:', expect.any(Error))

    consoleSpy.mockRestore()
  })
})
