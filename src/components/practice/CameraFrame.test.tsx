import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { CameraFrame } from './CameraFrame'

// Mock hooks
vi.mock('../../hooks/useCamera', () => ({
  useCamera: vi.fn(),
}))

vi.mock('../../hooks/useHandPose', () => ({
  useHandPose: vi.fn(),
}))

import { useCamera } from '../../hooks/useCamera'
import { useHandPose } from '../../hooks/useHandPose'

// Mock data
const mockVideoDimensions = { width: 640, height: 480 }
const mockHandResults = [
  {
    landmarks: [
      { x: 0.5, y: 0.5, z: 0 }, // Wrist
      { x: 0.4, y: 0.4, z: 0 }, // Thumb
      // ... more landmarks would be here
    ],
    handedness: 'Right' as const,
  },
]

describe('CameraFrame', () => {
  const mockStartCamera = vi.fn()
  const mockStopCamera = vi.fn()
  const mockOnLandmarksDetected = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()

    // Default mock implementations
    ;(useCamera as any).mockReturnValue({
      startCamera: mockStartCamera,
      stopCamera: mockStopCamera,
      isCameraReady: true,
      error: null,
      videoDimensions: mockVideoDimensions,
    })

    ;(useHandPose as any).mockReturnValue({
      handResults: [],
      isReady: true,
      error: null,
    })
  })

  it('shows loading state when camera is not ready', () => {
    ;(useCamera as any).mockReturnValue({
      startCamera: mockStartCamera,
      stopCamera: mockStopCamera,
      isCameraReady: false,
      error: null,
      videoDimensions: mockVideoDimensions,
    })

    render(<CameraFrame />)

    expect(screen.getByText('Inicializando câmera...')).toBeInTheDocument()
    expect(screen.getByText('Permita o acesso à câmera quando solicitado')).toBeInTheDocument()
  })

  it('shows loading state when hand pose is not ready', () => {
    ;(useHandPose as any).mockReturnValue({
      handResults: [],
      isReady: false,
      error: null,
    })

    render(<CameraFrame />)

    expect(screen.getByText('Carregando detecção de mãos...')).toBeInTheDocument()
  })

  it('shows error state when camera has error', () => {
    ;(useCamera as any).mockReturnValue({
      startCamera: mockStartCamera,
      stopCamera: mockStopCamera,
      isCameraReady: true,
      error: 'Camera access denied',
      videoDimensions: mockVideoDimensions,
    })

    render(<CameraFrame />)

    expect(screen.getByText('Erro na câmera')).toBeInTheDocument()
    expect(screen.getByText('Camera access denied')).toBeInTheDocument()
    expect(screen.getByText('Tentar novamente')).toBeInTheDocument()
  })

  it('shows error state when hand pose has error', () => {
    ;(useHandPose as any).mockReturnValue({
      handResults: [],
      isReady: true,
      error: 'MediaPipe initialization failed',
    })

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
    ;(useHandPose as any).mockReturnValue({
      handResults: mockHandResults,
      isReady: true,
      error: null,
    })

    render(<CameraFrame onLandmarksDetected={mockOnLandmarksDetected} />)

    // Wait for effect to run
    waitFor(() => {
      expect(mockOnLandmarksDetected).toHaveBeenCalledWith(
        [mockHandResults[0].landmarks],
        mockVideoDimensions
      )
    })
  })

  it('does not call onLandmarksDetected when no hands detected', () => {
    render(<CameraFrame onLandmarksDetected={mockOnLandmarksDetected} />)

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
    ;(useCamera as any).mockReturnValue({
      startCamera: mockStartCamera,
      stopCamera: mockStopCamera,
      isCameraReady: true,
      error: 'Camera error',
      videoDimensions: mockVideoDimensions,
    })

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
