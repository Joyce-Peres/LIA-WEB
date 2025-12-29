import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import { LessonDetail } from './LessonDetail'
import { contentRepository } from '../repositories/contentRepository'
import { LessonWithModule } from '../types/database'

// Mock React Router
const mockNavigate = vi.fn()
const mockParams: { lessonId?: string } = { lessonId: 'lesson-1' }

vi.mock('react-router-dom', () => ({
  useParams: () => mockParams,
  useNavigate: () => mockNavigate,
}))

// Mock contentRepository
vi.mock('../repositories/contentRepository', () => ({
  contentRepository: {
    getLessonById: vi.fn(),
  },
}))

// Mock lesson data
const mockLesson: LessonWithModule = {
  id: 'lesson-1',
  moduleId: 'module-1',
  gestureName: 'A',
  displayName: 'Letra A',
  videoRefUrl: '/videos/a.mp4',
  minConfidenceThreshold: 0.75,
  xpReward: 10,
  orderIndex: 1,
  level: 1,
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z',
  module: {
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
}

const mockLockedLesson: LessonWithModule = {
  ...mockLesson,
  orderIndex: 5, // Will be locked based on placeholder logic
}

describe('LessonDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockNavigate.mockClear()
    mockParams.lessonId = 'lesson-1'
  })

  it('shows loading skeleton initially', () => {
    vi.mocked(contentRepository.getLessonById).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    )

    render(<LessonDetail />)

    const shimmerBlocks = document.querySelectorAll('.animate-pulse')
    expect(shimmerBlocks.length).toBeGreaterThan(0)
  })

  it('loads and displays lesson data successfully', async () => {
    vi.mocked(contentRepository.getLessonById).mockResolvedValue(mockLesson)

    render(<LessonDetail />)

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Letra A/ })).toBeInTheDocument()
    })

    const header = screen.getByRole('heading', { name: /Letra A/ }).closest('div')
    expect(header).not.toBeNull()

    expect(screen.getByText(/Sinal:/)).toBeInTheDocument()
    expect(screen.getByText(/Módulo:/)).toBeInTheDocument()

    const rewardBadge = screen.getByText('Recompensa').parentElement
    expect(rewardBadge).not.toBeNull()
    expect(
      within(rewardBadge as HTMLElement).getByText(/10\s+XP/)
    ).toBeInTheDocument()
    expect(screen.getByText('Sobre esta lição')).toBeInTheDocument()
  })

  it('shows error state when lesson not found', async () => {
    vi.mocked(contentRepository.getLessonById).mockResolvedValue(null)

    render(<LessonDetail />)

    await waitFor(() => {
      expect(screen.getByText('Erro ao carregar lição')).toBeInTheDocument()
    })

    expect(screen.getByText('Lição não encontrada')).toBeInTheDocument()
  })

  it('shows error state when loading fails', async () => {
    vi.mocked(contentRepository.getLessonById).mockRejectedValue(new Error('Network error'))

    render(<LessonDetail />)

    await waitFor(() => {
      expect(screen.getByText('Erro ao carregar lição')).toBeInTheDocument()
    })

    expect(screen.getByText('Erro ao carregar lição. Verifique sua conexão.')).toBeInTheDocument()
  })

  it('shows video player when video URL is available', async () => {
    vi.mocked(contentRepository.getLessonById).mockResolvedValue(mockLesson)

    render(<LessonDetail />)

    await waitFor(() => {
      expect(screen.getByTitle('Vídeo de referência: Letra A')).toBeInTheDocument()
    })
  })

  it('shows video placeholder when no video URL', async () => {
    const lessonWithoutVideo = { ...mockLesson, videoRefUrl: null }
    vi.mocked(contentRepository.getLessonById).mockResolvedValue(lessonWithoutVideo)

    render(<LessonDetail />)

    await waitFor(() => {
      expect(screen.getByText('Vídeo de referência')).toBeInTheDocument()
      expect(screen.getByText('não disponível')).toBeInTheDocument()
    })
  })

  it('displays practice objectives', async () => {
    vi.mocked(contentRepository.getLessonById).mockResolvedValue(mockLesson)

    render(<LessonDetail />)

    await waitFor(() => {
      expect(screen.getByText('🎯 Objetivos da prática')).toBeInTheDocument()
    })

    expect(screen.getByText(/Praticar a posição correta das mãos/)).toBeInTheDocument()
    expect(screen.getByText(/Manter o sinal por pelo menos 30 segundos/)).toBeInTheDocument()
    expect(screen.getByText(/Alcançar precisão de pelo menos 75%/)).toBeInTheDocument()
  })

  it('shows start practice button for unlocked lessons', async () => {
    vi.mocked(contentRepository.getLessonById).mockResolvedValue(mockLesson)

    render(<LessonDetail />)

    await waitFor(() => {
      expect(screen.getByText('Começar Prática')).toBeInTheDocument()
    })

    const practiceSection = screen.getByRole('heading', { name: 'Pronto para praticar?' }).closest('div')
    expect(practiceSection).not.toBeNull()
    expect(
      within(practiceSection as HTMLElement).getByText(
        (text) => text.includes('Ganhe') && text.includes('10') && text.includes('XP')
      )
    ).toBeInTheDocument()
  })

  it('shows locked state for locked lessons', async () => {
    vi.mocked(contentRepository.getLessonById).mockResolvedValue(mockLockedLesson)

    render(<LessonDetail />)

    await waitFor(() => {
      expect(screen.getByText('Esta lição está bloqueada')).toBeInTheDocument()
    })

    expect(screen.getByText('🔒')).toBeInTheDocument()
    expect(screen.getByText('Completar a lição anterior')).toBeInTheDocument()
  })

  it('handles start practice button click', async () => {
    vi.mocked(contentRepository.getLessonById).mockResolvedValue(mockLesson)

    // Mock window.alert
    const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {})

    render(<LessonDetail />)

    await waitFor(() => {
      expect(screen.getByText('Começar Prática')).toBeInTheDocument()
    })

    const startButton = screen.getByText('Começar Prática')
    fireEvent.click(startButton)

    expect(alertMock).toHaveBeenCalledWith(
      'Funcionalidade em desenvolvimento!\n\n🎯 Iniciando prática da lição:\n"Letra A"\n\n📹 Sinal: A\n⭐ Recompensa: 10 XP\n🎯 Precisão necessária: 75%\n\nEm breve você poderá praticar com a câmera!'
    )

    alertMock.mockRestore()
  })

  it('displays breadcrumb navigation', async () => {
    vi.mocked(contentRepository.getLessonById).mockResolvedValue(mockLesson)

    render(<LessonDetail />)

    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument()
    })

    const breadcrumb = screen.getByRole('navigation')
    expect(within(breadcrumb).getAllByText('›')).toHaveLength(3)
    expect(within(breadcrumb).getByText('Módulos')).toBeInTheDocument()
    expect(within(breadcrumb).getByText('Alfabeto')).toBeInTheDocument()
  })

  it('shows tips for practice', async () => {
    vi.mocked(contentRepository.getLessonById).mockResolvedValue(mockLesson)

    render(<LessonDetail />)

    await waitFor(() => {
      expect(screen.getByText('💡 Dicas para praticar')).toBeInTheDocument()
    })

    expect(screen.getByText(/Posicione-se em um local bem iluminado/)).toBeInTheDocument()
  })

  it('displays lesson metadata correctly', async () => {
    vi.mocked(contentRepository.getLessonById).mockResolvedValue(mockLesson)

    render(<LessonDetail />)

    await waitFor(() => {
      expect(screen.getByText('Dificuldade: iniciante')).toBeInTheDocument()
    })

    expect(screen.getByText('Lição 1')).toBeInTheDocument()
  })

  it('handles retry button click', async () => {
    vi.mocked(contentRepository.getLessonById)
      .mockRejectedValueOnce(new Error('First error'))
      .mockResolvedValueOnce(mockLesson)

    render(<LessonDetail />)

    await waitFor(() => {
      expect(screen.getByText('Erro ao carregar lição')).toBeInTheDocument()
    })

    const retryButton = screen.getByText('Tentar novamente')
    fireEvent.click(retryButton)

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Letra A/ })).toBeInTheDocument()
    })

    expect(contentRepository.getLessonById).toHaveBeenCalledTimes(2)
  })

  it('handles missing lessonId parameter', () => {
    // Mock useParams to return no lessonId
    mockParams.lessonId = undefined

    render(<LessonDetail />)

    expect(screen.getByText('Erro ao carregar lição')).toBeInTheDocument()
    expect(screen.getByText('ID da lição não fornecido')).toBeInTheDocument()
  })

  it('logs lesson loading to console', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

    vi.mocked(contentRepository.getLessonById).mockResolvedValue(mockLesson)

    render(<LessonDetail />)

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Letra A/ })).toBeInTheDocument()
    })

    expect(consoleSpy).toHaveBeenCalledWith('Loading lesson:', 'lesson-1')
    expect(consoleSpy).toHaveBeenCalledWith('Loaded lesson:', 'Letra A')

    consoleSpy.mockRestore()
  })
})
