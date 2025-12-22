import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { Practice } from './Practice'
import { contentRepository } from '../repositories/contentRepository'
import { LessonWithModule } from '../types/database'

// Mock React Router
const mockNavigate = vi.fn()
const mockParams = { lessonId: 'lesson-1' }

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

// Mock CameraFrame component
vi.mock('../components/practice/CameraFrame', () => ({
  CameraFrame: ({ onLandmarksDetected, className }: any) => (
    <div data-testid="camera-frame" className={className}>
      <video data-testid="camera-video" />
      <canvas data-testid="camera-canvas" />
      <button
        data-testid="mock-landmarks-btn"
        onClick={() => onLandmarksDetected([[[{ x: 0.5, y: 0.5, z: 0 }]]], { width: 640, height: 480 })}
      >
        Mock Landmarks
      </button>
    </div>
  ),
}))

import { contentRepository as mockedContentRepository } from '../repositories/contentRepository'

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

describe('Practice', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows loading skeleton initially', () => {
    ;(mockedContentRepository.getLessonById as any).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    )

    render(<Practice />)

    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument()
  })

  it('loads and displays lesson data successfully', async () => {
    ;(mockedContentRepository.getLessonById as any).mockResolvedValue(mockLesson)

    render(<Practice />)

    await waitFor(() => {
      expect(screen.getByText('Praticando: Letra A')).toBeInTheDocument()
    })

    expect(screen.getByText('Sinal: A')).toBeInTheDocument()
    expect(screen.getByText('Módulo: Alfabeto')).toBeInTheDocument()
    expect(screen.getByText('10 XP')).toBeInTheDocument()
  })

  it('shows error state when lesson not found', async () => {
    ;(mockedContentRepository.getLessonById as any).mockResolvedValue(null)

    render(<Practice />)

    await waitFor(() => {
      expect(screen.getByText('Erro ao carregar prática')).toBeInTheDocument()
    })

    expect(screen.getByText('Lição não encontrada')).toBeInTheDocument()
  })

  it('shows error state when loading fails', async () => {
    ;(mockedContentRepository.getLessonById as any).mockRejectedValue(new Error('Network error'))

    render(<Practice />)

    await waitFor(() => {
      expect(screen.getByText('Erro ao carregar prática')).toBeInTheDocument()
    })
  })

  it('displays camera section with practice instructions', async () => {
    ;(mockedContentRepository.getLessonById as any).mockResolvedValue(mockLesson)

    render(<Practice />)

    await waitFor(() => {
      expect(screen.getByText('Sua Prática')).toBeInTheDocument()
    })

    expect(screen.getByText(/Posicione sua mão na câmera/)).toBeInTheDocument()
    expect(screen.getByTestId('camera-frame')).toBeInTheDocument()
  })

  it('displays reference video section', async () => {
    ;(mockedContentRepository.getLessonById as any).mockResolvedValue(mockLesson)

    render(<Practice />)

    await waitFor(() => {
      expect(screen.getByText('Vídeo de Referência')).toBeInTheDocument()
    })

    const video = document.querySelector('video')
    expect(video).toBeInTheDocument()
    expect(video).toHaveAttribute('src', '/videos/a.mp4')
  })

  it('shows video placeholder when no video URL', async () => {
    const lessonWithoutVideo = { ...mockLesson, videoRefUrl: null }
    ;(mockedContentRepository.getLessonById as any).mockResolvedValue(lessonWithoutVideo)

    render(<Practice />)

    await waitFor(() => {
      expect(screen.getByText('Vídeo não disponível')).toBeInTheDocument()
    })
  })

  it('displays controls section with start button initially', async () => {
    ;(mockedContentRepository.getLessonById as any).mockResolvedValue(mockLesson)

    render(<Practice />)

    await waitFor(() => {
      expect(screen.getByText('Controles da Prática')).toBeInTheDocument()
    })

    expect(screen.getByText('Começar Prática')).toBeInTheDocument()
  })

  it('shows ready state overlay when practice not started', async () => {
    ;(mockedContentRepository.getLessonById as any).mockResolvedValue(mockLesson)

    render(<Practice />)

    await waitFor(() => {
      expect(screen.getByText('Pronto para começar?')).toBeInTheDocument()
    })
  })

  it('handles start practice button click', async () => {
    ;(mockedContentRepository.getLessonById as any).mockResolvedValue(mockLesson)

    render(<Practice />)

    await waitFor(() => {
      expect(screen.getByText('Começar Prática')).toBeInTheDocument()
    })

    const startButton = screen.getByText('Começar Prática')
    fireEvent.click(startButton)

    expect(screen.getByText('🎥 Ativo')).toBeInTheDocument()
  })

  it('shows pause button when practice is active', async () => {
    ;(mockedContentRepository.getLessonById as any).mockResolvedValue(mockLesson)

    render(<Practice />)

    await waitFor(() => {
      expect(screen.getByText('Começar Prática')).toBeInTheDocument()
    })

    // Start practice
    fireEvent.click(screen.getByText('Começar Prática'))

    expect(screen.getByText('⏸️ Pausar')).toBeInTheDocument()
  })

  it('shows continue and reset buttons when paused', async () => {
    ;(mockedContentRepository.getLessonById as any).mockResolvedValue(mockLesson)

    render(<Practice />)

    await waitFor(() => {
      expect(screen.getByText('Começar Prática')).toBeInTheDocument()
    })

    // Start and pause practice
    fireEvent.click(screen.getByText('Começar Prática'))
    fireEvent.click(screen.getByText('⏸️ Pausar'))

    expect(screen.getByText('▶️ Continuar')).toBeInTheDocument()
    expect(screen.getByText('🔄 Reiniciar')).toBeInTheDocument()
  })

  it('handles landmarks detected callback', async () => {
    ;(mockedContentRepository.getLessonById as any).mockResolvedValue(mockLesson)

    render(<Practice />)

    await waitFor(() => {
      expect(screen.getByText('Começar Prática')).toBeInTheDocument()
    })

    // Start practice
    fireEvent.click(screen.getByText('Começar Prática'))

    // Trigger mock landmarks detection
    const mockButton = screen.getByTestId('mock-landmarks-btn')
    fireEvent.click(mockButton)

    await waitFor(() => {
      expect(screen.getByText('Reconhecimento Atual')).toBeInTheDocument()
    })

    // Should show some prediction result
    expect(screen.getByText('Aguardando detecção de gestos...')).toBeInTheDocument()
  })

  it('displays breadcrumb navigation', async () => {
    ;(mockedContentRepository.getLessonById as any).mockResolvedValue(mockLesson)

    render(<Practice />)

    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument()
    })

    expect(screen.getByText('›')).toBeInTheDocument()
    expect(screen.getByText('Módulos')).toBeInTheDocument()
    expect(screen.getByText('Alfabeto')).toBeInTheDocument()
    expect(screen.getByText('Letra A')).toBeInTheDocument()
    expect(screen.getByText('Prática')).toBeInTheDocument()
  })

  it('shows practice tips', async () => {
    ;(mockedContentRepository.getLessonById as any).mockResolvedValue(mockLesson)

    render(<Practice />)

    await waitFor(() => {
      expect(screen.getByText('💡 Dicas para praticar:')).toBeInTheDocument()
    })

    expect(screen.getByText('Mantenha a mão relaxada e natural')).toBeInTheDocument()
  })

  it('displays practice statistics', async () => {
    ;(mockedContentRepository.getLessonById as any).mockResolvedValue(mockLesson)

    render(<Practice />)

    await waitFor(() => {
      expect(screen.getByText('Controles da Prática')).toBeInTheDocument()
    })

    expect(screen.getByText('30')).toBeInTheDocument() // Segundos
    expect(screen.getByText('5')).toBeInTheDocument() // Tentativas
    expect(screen.getByText('3')).toBeInTheDocument() // Corretas
    expect(screen.getByText('75%')).toBeInTheDocument() // Precisão
  })

  it('handles missing lessonId parameter', () => {
    // Mock useParams to return no lessonId
    vi.mocked(vi.importMock('react-router-dom')).useParams.mockReturnValue({})

    render(<Practice />)

    expect(screen.getByText('Erro ao carregar prática')).toBeInTheDocument()
    expect(screen.getByText('ID da lição não fornecido')).toBeInTheDocument()
  })

  it('handles retry button click', async () => {
    ;(mockedContentRepository.getLessonById as any)
      .mockRejectedValueOnce(new Error('First error'))
      .mockResolvedValueOnce(mockLesson)

    render(<Practice />)

    await waitFor(() => {
      expect(screen.getByText('Erro ao carregar prática')).toBeInTheDocument()
    })

    const retryButton = screen.getByText('Tentar novamente')
    fireEvent.click(retryButton)

    await waitFor(() => {
      expect(screen.getByText('Praticando: Letra A')).toBeInTheDocument()
    })

    expect(mockedContentRepository.getLessonById).toHaveBeenCalledTimes(2)
  })

  it('logs lesson loading to console', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

    ;(mockedContentRepository.getLessonById as any).mockResolvedValue(mockLesson)

    render(<Practice />)

    await waitFor(() => {
      expect(screen.getByText('Praticando: Letra A')).toBeInTheDocument()
    })

    expect(consoleSpy).toHaveBeenCalledWith('Loading lesson for practice:', 'lesson-1')
    expect(consoleSpy).toHaveBeenCalledWith('Loaded lesson for practice:', 'Letra A')

    consoleSpy.mockRestore()
  })
})
