import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import { Practice } from './Practice'
import { contentRepository as mockedContentRepository } from '../repositories/contentRepository'
import { LessonWithModule } from '../types/database'
import type { CameraFrameProps, HandLandmark } from '../components/practice/CameraFrame'

// Mock React Router
const mockNavigate = vi.fn()
const mockParams: { lessonId?: string } = { lessonId: 'lesson-1' }

type MockCameraFrameProps = Pick<CameraFrameProps, 'onLandmarksDetected' | 'className'>

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

const getLessonByIdMock = vi.mocked(mockedContentRepository.getLessonById)

// Mock CameraFrame component
vi.mock('../components/practice/CameraFrame', () => ({
  CameraFrame: ({ onLandmarksDetected, className }: MockCameraFrameProps) => {
    const mockLandmarks: HandLandmark[][] = [[{ x: 0.5, y: 0.5, z: 0 }]]

    return (
      <div data-testid="camera-frame" className={className}>
        <video data-testid="camera-video" />
        <canvas data-testid="camera-canvas" />
        <button
          data-testid="mock-landmarks-btn"
          onClick={() => onLandmarksDetected?.(mockLandmarks, { width: 640, height: 480 })}
        >
          Mock Landmarks
        </button>
      </div>
    )
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

const getStartButton = () => screen.getByRole('button', { name: /Começar Prática/ })

describe('Practice', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockParams.lessonId = 'lesson-1'
  })

  it('shows loading skeleton initially', () => {
    getLessonByIdMock.mockImplementation(
      () => new Promise(() => {}) // Never resolves
    )

    render(<Practice />)

    const shimmerBlocks = document.querySelectorAll('.bg-gray-200')
    expect(shimmerBlocks.length).toBeGreaterThan(0)
  })

  it('loads and displays lesson data successfully', async () => {
    getLessonByIdMock.mockResolvedValue(mockLesson)

    render(<Practice />)

    await waitFor(() => {
      expect(screen.getByText('Praticando: Letra A')).toBeInTheDocument()
    })

    expect(screen.getByRole('heading', { name: /Praticando:\s*Letra A/ })).toBeInTheDocument()
    expect(screen.getByText(/Sinal:/)).toBeInTheDocument()
    expect(screen.getByText(/Módulo:/)).toBeInTheDocument()
    expect(screen.getByText(/10\s+XP/)).toBeInTheDocument()
  })

  it('shows error state when lesson not found', async () => {
    getLessonByIdMock.mockResolvedValue(null)

    render(<Practice />)

    await waitFor(() => {
      expect(screen.getByText('Erro ao carregar prática')).toBeInTheDocument()
    })

    expect(screen.getByText('Lição não encontrada')).toBeInTheDocument()
  })

  it('shows error state when loading fails', async () => {
    getLessonByIdMock.mockRejectedValue(new Error('Network error'))

    render(<Practice />)

    await waitFor(() => {
      expect(screen.getByText('Erro ao carregar prática')).toBeInTheDocument()
    })
  })

  it('displays camera section with practice instructions', async () => {
    getLessonByIdMock.mockResolvedValue(mockLesson)

    render(<Practice />)

    await waitFor(() => {
      expect(screen.getByText('Sua Prática')).toBeInTheDocument()
    })

    const cameraSection = screen.getByRole('heading', { name: 'Sua Prática' }).closest('div')
    expect(cameraSection).not.toBeNull()
    expect(
      within(cameraSection as HTMLElement).getByText(/Posicione sua mão na câmera e pratique/)
    ).toBeInTheDocument()
    expect(screen.getByTestId('camera-frame')).toBeInTheDocument()
  })

  it('displays reference video section', async () => {
    getLessonByIdMock.mockResolvedValue(mockLesson)

    render(<Practice />)

    await waitFor(() => {
      expect(screen.getByText('Vídeo de Referência')).toBeInTheDocument()
    })

    const referenceVideo = screen.getByTestId('reference-video') as HTMLVideoElement
    expect(referenceVideo).toHaveAttribute('src', '/videos/a.mp4')
  })

  it('shows video placeholder when no video URL', async () => {
    const lessonWithoutVideo = { ...mockLesson, videoRefUrl: null }
    getLessonByIdMock.mockResolvedValue(lessonWithoutVideo)

    render(<Practice />)

    await waitFor(() => {
      expect(screen.getByText('Vídeo não disponível')).toBeInTheDocument()
    })

    expect(screen.getByTestId('reference-video-placeholder')).toBeInTheDocument()
  })

  it('displays controls section with start button initially', async () => {
    getLessonByIdMock.mockResolvedValue(mockLesson)

    render(<Practice />)

    await waitFor(() => {
      expect(screen.getByText('Controles da Prática')).toBeInTheDocument()
    })

    expect(getStartButton()).toBeInTheDocument()
  })

  it('shows ready state overlay when practice not started', async () => {
    getLessonByIdMock.mockResolvedValue(mockLesson)

    render(<Practice />)

    await waitFor(() => {
      expect(screen.getByText('Pronto para começar?')).toBeInTheDocument()
    })
  })

  it('handles start practice button click', async () => {
    getLessonByIdMock.mockResolvedValue(mockLesson)

    render(<Practice />)

    await waitFor(() => {
      expect(getStartButton()).toBeInTheDocument()
    })

    const startButton = getStartButton()
    fireEvent.click(startButton)

    expect(screen.getByText('🎥 Ativo')).toBeInTheDocument()
  })

  it('shows pause button when practice is active', async () => {
    getLessonByIdMock.mockResolvedValue(mockLesson)

    render(<Practice />)

    await waitFor(() => {
      expect(getStartButton()).toBeInTheDocument()
    })

    // Start practice
    fireEvent.click(getStartButton())

    expect(screen.getByText('⏸️ Pausar')).toBeInTheDocument()
  })

  it('shows continue and reset buttons when paused', async () => {
    getLessonByIdMock.mockResolvedValue(mockLesson)

    render(<Practice />)

    await waitFor(() => {
        expect(getStartButton()).toBeInTheDocument()
    })

    // Start and pause practice
      fireEvent.click(getStartButton())
    fireEvent.click(screen.getByText('⏸️ Pausar'))

    expect(screen.getByText('▶️ Continuar')).toBeInTheDocument()
    expect(screen.getByText('🔄 Reiniciar')).toBeInTheDocument()
  })

  it('handles landmarks detected callback', async () => {
    getLessonByIdMock.mockResolvedValue(mockLesson)

    render(<Practice />)

    await waitFor(() => {
        expect(getStartButton()).toBeInTheDocument()
    })

    // Start practice
      fireEvent.click(getStartButton())

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
    getLessonByIdMock.mockResolvedValue(mockLesson)

    render(<Practice />)

    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument()
    })

    const breadcrumb = screen.getByRole('navigation')

    expect(within(breadcrumb).getAllByText('›')).toHaveLength(4)
    expect(within(breadcrumb).getByText('Módulos')).toBeInTheDocument()
    expect(within(breadcrumb).getByText('Alfabeto')).toBeInTheDocument()
    expect(within(breadcrumb).getByText('Letra A')).toBeInTheDocument()
    expect(within(breadcrumb).getByText('Prática')).toBeInTheDocument()
  })

  it('shows practice tips', async () => {
    getLessonByIdMock.mockResolvedValue(mockLesson)

    render(<Practice />)

    await waitFor(() => {
      expect(screen.getByText('💡 Dicas para praticar:')).toBeInTheDocument()
    })

    expect(screen.getByText(/Mantenha a mão relaxada/)).toBeInTheDocument()
  })

  it('displays practice statistics', async () => {
    getLessonByIdMock.mockResolvedValue(mockLesson)

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
    mockParams.lessonId = undefined

    render(<Practice />)

    expect(screen.getByText('Erro ao carregar prática')).toBeInTheDocument()
    expect(screen.getByText('ID da lição não fornecido')).toBeInTheDocument()
  })

  it('handles retry button click', async () => {
    getLessonByIdMock.mockRejectedValueOnce(new Error('First error')).mockResolvedValueOnce(mockLesson)

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

    getLessonByIdMock.mockResolvedValue(mockLesson)

    render(<Practice />)

    await waitFor(() => {
      expect(screen.getByText('Praticando: Letra A')).toBeInTheDocument()
    })

    expect(consoleSpy).toHaveBeenCalledWith('Loading lesson for practice:', 'lesson-1')
    expect(consoleSpy).toHaveBeenCalledWith('Loaded lesson for practice:', 'Letra A')

    consoleSpy.mockRestore()
  })
})
