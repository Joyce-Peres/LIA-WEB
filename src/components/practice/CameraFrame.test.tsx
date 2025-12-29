import { describe, it, expect, vi, beforeEach, beforeAll, afterAll, type Mock } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { CameraFrame } from './CameraFrame'
import type { CameraFrameProps } from './CameraFrame'

// Mock hooks
vi.mock('../../hooks/useCamera', () => ({
  useCamera: vi.fn(),
}))

vi.mock('../../hooks/useHandPose', () => ({
  useHandPose: vi.fn(),
}))

import { useCamera } from '../../hooks/useCamera'
import type { UseCameraReturn } from '../../hooks/useCamera'
import { useHandPose } from '../../hooks/useHandPose'
import type { HandResult, UseHandPoseReturn } from '../../hooks/useHandPose'

const mockedUseCamera = vi.mocked(useCamera)
const mockedUseHandPose = vi.mocked(useHandPose)

// Mock data
const mockHandResults: HandResult[] = [
  {
    landmarks: [
      { x: 0.5, y: 0.5, z: 0 },
      { x: 0.4, y: 0.4, z: 0 },
    ],
    handedness: 'Right',
    score: 0.95,
  },
]

describe('CameraFrame', () => {
  const mockStartCamera = vi.fn()
  const mockStopCamera = vi.fn()
  let mockStartProcessing: Mock
  let mockStopProcessing: Mock
  let mockProcessFrame: Mock
  let mockVideoElement: HTMLVideoElement
  let mockVideoRef: { current: HTMLVideoElement | null } = { current: null }
  type LandmarksHandler = NonNullable<CameraFrameProps['onLandmarksDetected']>
  const mockOnLandmarksDetected = vi.fn<LandmarksHandler>()
  const landmarksHandler = mockOnLandmarksDetected as unknown as LandmarksHandler
  const buildCameraReturn = (overrides: Partial<UseCameraReturn> = {}): UseCameraReturn => ({
    videoRef: mockVideoRef,
    stream: null,
    startCamera: mockStartCamera,
    stopCamera: mockStopCamera,
    isActive: true,
    isLoading: false,
    error: null,
    ...overrides,
  })
  const buildHandPoseReturn = (overrides: Partial<UseHandPoseReturn> = {}): UseHandPoseReturn => ({
    results: [],
    isProcessing: false,
    isReady: true,
    error: null,
    fps: 0,
    processFrame: mockProcessFrame,
    startProcessing: mockStartProcessing,
    stopProcessing: mockStopProcessing,
    ...overrides,
  })
  const mockCanvasContext = {
    clearRect: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    fillStyle: '#fff',
    strokeStyle: '#fff',
    lineWidth: 0,
    globalAlpha: 1,
    canvas: {
      width: 640,
      height: 480,
      style: {},
    },
  } as unknown as CanvasRenderingContext2D;
  const originalGetContext = HTMLCanvasElement.prototype.getContext

  beforeAll(() => {
    const mockGetContext = ((contextId: unknown) => (
      contextId === '2d' ? mockCanvasContext : null
    )) as typeof HTMLCanvasElement.prototype.getContext

    HTMLCanvasElement.prototype.getContext = mockGetContext
  })

  afterAll(() => {
    HTMLCanvasElement.prototype.getContext = originalGetContext
  })

  beforeEach(() => {
    vi.clearAllMocks()
    mockVideoElement = document.createElement('video') as HTMLVideoElement
    mockVideoRef = { current: mockVideoElement }
    mockStartProcessing = vi.fn()
    mockStopProcessing = vi.fn()
    mockProcessFrame = vi.fn()

    // Default mock implementations
    mockedUseCamera.mockReturnValue(buildCameraReturn())

    mockedUseHandPose.mockReturnValue(buildHandPoseReturn())
  })

  it('shows loading state when camera is not ready', () => {
    mockedUseCamera.mockReturnValue(buildCameraReturn({
      isActive: false,
      isLoading: true,
    }))

    render(<CameraFrame />)

    expect(screen.getByText('Inicializando câmera...')).toBeInTheDocument()
    expect(screen.getByText('Permita o acesso à câmera quando solicitado')).toBeInTheDocument()
  })

  it('shows loading state when hand pose is not ready', () => {
    mockedUseHandPose.mockReturnValue(buildHandPoseReturn({
      isReady: false,
    }))

    render(<CameraFrame />)

    expect(screen.getByText('Carregando detecção de mãos...')).toBeInTheDocument()
  })

  it('shows error state when camera has error', () => {
    mockedUseCamera.mockReturnValue(buildCameraReturn({
      error: 'Camera access denied',
    }))

    render(<CameraFrame />)

    expect(screen.getByText('Erro na câmera')).toBeInTheDocument()
    expect(screen.getByText('Camera access denied')).toBeInTheDocument()
    expect(screen.getByText('Tentar novamente')).toBeInTheDocument()
  })

  it('shows error state when hand pose has error', () => {
    mockedUseHandPose.mockReturnValue(buildHandPoseReturn({
      error: 'MediaPipe initialization failed',
    }))

    render(<CameraFrame />)

    expect(screen.getByText('Erro na câmera')).toBeInTheDocument()
    expect(screen.getByText('MediaPipe initialization failed')).toBeInTheDocument()
  })

  it('renders video and canvas elements when ready', () => {
    render(<CameraFrame />)

    const video = document.querySelector('video')
    const canvas = document.querySelector('canvas')

    expect(video).toBeInTheDocument()
    expect(canvas).toBeInTheDocument()
  })

  it('calls startCamera on mount', () => {
    render(<CameraFrame />)

    expect(mockStartCamera).toHaveBeenCalledTimes(1)
  })

  it('calls stopCamera on unmount', () => {
    const { unmount } = render(<CameraFrame />)

    unmount()

    expect(mockStopCamera).toHaveBeenCalledTimes(1)
  })

  it('calls onLandmarksDetected when hands are detected', () => {
    mockedUseHandPose.mockReturnValue(buildHandPoseReturn({
      results: mockHandResults,
    }))

    render(<CameraFrame onLandmarksDetected={landmarksHandler} />)

    // Wait for effect to run
    return waitFor(() => {
      expect(mockOnLandmarksDetected).toHaveBeenCalledWith(
        [mockHandResults[0].landmarks],
        { width: 640, height: 480 }
      )
    })
  })

  it('does not call onLandmarksDetected when no hands detected', () => {
    render(<CameraFrame onLandmarksDetected={landmarksHandler} />)

    expect(mockOnLandmarksDetected).not.toHaveBeenCalled()
  })

  it('applies custom className', () => {
    const { container } = render(<CameraFrame className="custom-class" />)

    expect(container.firstChild).toHaveClass('custom-class')
  })

  it('shows debug info in development mode', () => {
    const originalEnv = process.env.NODE_ENV
    process.env.NODE_ENV = 'development'

    render(<CameraFrame />)

    expect(screen.getByText('Mãos detectadas: 0')).toBeInTheDocument()
    expect(screen.getByText('Dimensões: 640x480')).toBeInTheDocument()

    process.env.NODE_ENV = originalEnv
  })

  it('does not show debug info in production mode', () => {
    const originalEnv = process.env.NODE_ENV
    process.env.NODE_ENV = 'production'

    render(<CameraFrame />)

    expect(screen.queryByText('Mãos detectadas:')).not.toBeInTheDocument()

    process.env.NODE_ENV = originalEnv
  })

  it('handles retry button click', () => {
    mockedUseCamera.mockReturnValue(buildCameraReturn({
      error: 'Camera error',
    }))

    render(<CameraFrame />)

    const retryButton = screen.getByText('Tentar novamente')
    fireEvent.click(retryButton)

    expect(mockStopCamera).toHaveBeenCalledTimes(1)
    // startCamera should be called after timeout, but we can't easily test setTimeout in this test
  })

  it('video has correct attributes for camera feed', () => {
    render(<CameraFrame />)

    const video = document.querySelector('video') as HTMLVideoElement

    expect(video).toHaveAttribute('autoPlay')
    expect(video).toHaveAttribute('playsInline')
    expect(video.muted).toBe(true)
  })

  it('canvas has correct styling for overlay', () => {
    render(<CameraFrame />)

    const canvas = document.querySelector('canvas') as HTMLCanvasElement

    expect(canvas).toHaveClass('absolute', 'inset-0', 'pointer-events-none')
    expect(canvas).toHaveStyle({ mixBlendMode: 'screen' })
  })
})
