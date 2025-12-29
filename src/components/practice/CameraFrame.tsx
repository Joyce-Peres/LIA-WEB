/**
 * CameraFrame Component
 *
 * Displays camera feed with real-time hand landmark overlay.
 * Core component for practice interface showing MediaPipe hand detection.
 *
 * @module components/practice/CameraFrame
 * @category UI Components
 *
 * @example
 * ```tsx
 * <CameraFrame
 *   className="w-full h-96"
 *   onLandmarksDetected={(landmarks) => console.log(landmarks)}
 * />
 * ```
 */

import { useRef, useEffect, useCallback, useState } from 'react'
import { useCamera } from '../../hooks/useCamera'
import { useHandPose } from '../../hooks/useHandPose'

/**
 * Props for the CameraFrame component
 */
export interface CameraFrameProps {
  /** Additional CSS classes */
  className?: string
  /** Callback when landmarks are detected */
  onLandmarksDetected?: (landmarks: HandLandmark[][], videoDimensions: { width: number; height: number }) => void
  /** Skip hand pose detection (camera only mode) */
  skipHandPose?: boolean
}

/**
 * Hand landmark data structure
 */
export interface HandLandmark {
  x: number
  y: number
  z: number
}

/**
 * Hand connections for drawing (MediaPipe Hands format)
 */
const HAND_CONNECTIONS = [
  // Thumb
  [0, 1], [1, 2], [2, 3], [3, 4],
  // Index finger
  [0, 5], [5, 6], [6, 7], [7, 8],
  // Middle finger
  [0, 9], [9, 10], [10, 11], [11, 12],
  // Ring finger
  [0, 13], [13, 14], [14, 15], [15, 16],
  // Pinky
  [0, 17], [17, 18], [18, 19], [19, 20],
  // Palm connections
  [5, 9], [9, 13], [13, 17],
]

/**
 * Get color for landmark based on finger
 */
function getLandmarkColor(index: number): string {
  // Wrist
  if (index === 0) return '#ff0000'

  // Thumb (1-4)
  if (index >= 1 && index <= 4) return '#00ff00'

  // Index finger (5-8)
  if (index >= 5 && index <= 8) return '#0000ff'

  // Middle finger (9-12)
  if (index >= 9 && index <= 12) return '#ffff00'

  // Ring finger (13-16)
  if (index >= 13 && index <= 16) return '#ff00ff'

  // Pinky (17-20)
  if (index >= 17 && index <= 20) return '#00ffff'

  return '#ffffff'
}

/**
 * Draw hand landmarks on canvas
 */
function drawLandmarks(
  ctx: CanvasRenderingContext2D,
  landmarks: HandLandmark[],
  videoWidth: number,
  videoHeight: number
) {
  if (!landmarks || landmarks.length === 0) return

  // Scale factors for canvas
  const scaleX = ctx.canvas.width / videoWidth
  const scaleY = ctx.canvas.height / videoHeight

  // Draw connections first (behind keypoints)
  ctx.strokeStyle = '#00ff00'
  ctx.lineWidth = 2
  ctx.globalAlpha = 0.7

  HAND_CONNECTIONS.forEach(([startIdx, endIdx]) => {
    if (startIdx >= landmarks.length || endIdx >= landmarks.length) return

    const start = landmarks[startIdx]
    const end = landmarks[endIdx]

    ctx.beginPath()
    ctx.moveTo(start.x * videoWidth * scaleX, start.y * videoHeight * scaleY)
    ctx.lineTo(end.x * videoWidth * scaleX, end.y * videoHeight * scaleY)
    ctx.stroke()
  })

  // Draw keypoints
  ctx.globalAlpha = 1.0
  landmarks.forEach((landmark, index) => {
    const x = landmark.x * videoWidth * scaleX
    const y = landmark.y * videoHeight * scaleY

    // Outer circle
    ctx.beginPath()
    ctx.arc(x, y, 4, 0, 2 * Math.PI)
    ctx.fillStyle = getLandmarkColor(index)
    ctx.fill()

    // Inner circle
    ctx.beginPath()
    ctx.arc(x, y, 2, 0, 2 * Math.PI)
    ctx.fillStyle = '#ffffff'
    ctx.fill()
  })
}

/**
 * CameraFrame component with landmark overlay
 */
export function CameraFrame({ className = '', onLandmarksDetected, skipHandPose = false }: CameraFrameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [handPoseTimeout, setHandPoseTimeout] = useState(false)

  // Camera hook
  const {
    videoRef,
    startCamera,
    stopCamera,
    isActive,
    isLoading,
    error: cameraError,
  } = useCamera()

  // Hand pose detection (only if not skipped)
  const {
    results: handResults,
    isReady: handPoseReady,
    error: handPoseError,
    startProcessing,
    stopProcessing,
  } = useHandPose()

  const [videoDimensions, setVideoDimensions] = useState({ width: 640, height: 480 })
  const isCameraReady = isActive && !isLoading
  
  // Consider hand pose ready if: it's actually ready, or we're skipping it, or timeout occurred
  const isHandPoseEffectivelyReady = skipHandPose || handPoseReady || handPoseTimeout

  /**
   * Set timeout for hand pose loading (15 seconds)
   */
  useEffect(() => {
    if (skipHandPose || handPoseReady) return

    const timeoutId = setTimeout(() => {
      if (!handPoseReady) {
        console.warn('MediaPipe Hands loading timeout - continuing without hand detection')
        setHandPoseTimeout(true)
      }
    }, 15000)

    return () => clearTimeout(timeoutId)
  }, [skipHandPose, handPoseReady])

  /**
   * Set up canvas size to match video
   */
  const setupCanvasSize = useCallback(() => {
    const canvas = canvasRef.current
    const container = containerRef.current

    if (!canvas || !container) return
    if (!videoDimensions.width || !videoDimensions.height) return

    // Get container dimensions
    const containerRect = container.getBoundingClientRect()
    const containerWidth = containerRect.width
    const containerHeight = containerRect.height

    // Calculate size maintaining aspect ratio
    const videoAspectRatio = videoDimensions.width / videoDimensions.height
    let canvasWidth = containerWidth
    let canvasHeight = containerWidth / videoAspectRatio

    if (canvasHeight > containerHeight) {
      canvasHeight = containerHeight
      canvasWidth = containerHeight * videoAspectRatio
    }

    // Set canvas size
    canvas.width = videoDimensions.width
    canvas.height = videoDimensions.height
    canvas.style.width = `${canvasWidth}px`
    canvas.style.height = `${canvasHeight}px`
  }, [videoDimensions])

  /**
   * Sync internal video dimensions with actual video element metadata
   */
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const updateDimensions = () => {
      const width = video.videoWidth || 640
      const height = video.videoHeight || 480
      setVideoDimensions({ width, height })
    }

    if (video.readyState >= 1) {
      updateDimensions()
    }

    video.addEventListener('loadedmetadata', updateDimensions)
    return () => {
      video.removeEventListener('loadedmetadata', updateDimensions)
    }
  }, [videoRef])

  /**
   * Rendering loop for landmarks
   */
  useEffect(() => {
    let animationId: number

    const render = () => {
      const canvas = canvasRef.current
      const video = videoRef.current

      if (!canvas || !video) {
        animationId = requestAnimationFrame(render)
        return
      }

      const ctx = canvas.getContext('2d')
      if (!ctx) {
        animationId = requestAnimationFrame(render)
        return
      }

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Draw landmarks for each detected hand
      if (handResults?.length) {
        handResults.forEach((hand) => {
          if (hand.landmarks?.length) {
            drawLandmarks(ctx, hand.landmarks, videoDimensions.width, videoDimensions.height)
          }
        })

        // Notify parent component of detected landmarks
        if (onLandmarksDetected) {
          const allLandmarks = handResults
            .filter(hand => hand.landmarks && hand.landmarks.length > 0)
            .map(hand => hand.landmarks)

          onLandmarksDetected(allLandmarks, videoDimensions)
        }
      }

      animationId = requestAnimationFrame(render)
    }

    render()

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId)
      }
    }
  }, [handResults, videoDimensions, onLandmarksDetected, videoRef])

  /**
   * Handle window resize
   */
  useEffect(() => {
    const handleResize = () => setupCanvasSize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [setupCanvasSize])

  /**
   * Update canvas size when video dimensions change
   */
  useEffect(() => {
    setupCanvasSize()
  }, [setupCanvasSize])

  /**
   * Start camera when component mounts
   */
  useEffect(() => {
    startCamera()

    return () => {
      stopCamera()
    }
  }, [startCamera, stopCamera])

  /**
   * Start MediaPipe processing when camera and model are ready
   */
  useEffect(() => {
    // Don't start processing if skipping hand pose or if timeout occurred without ready
    if (skipHandPose || handPoseTimeout) return
    if (!isCameraReady || !handPoseReady) return

    const video = videoRef.current
    if (!video) return

    startProcessing(video)

    return () => {
      stopProcessing()
    }
  }, [handPoseReady, isCameraReady, startProcessing, stopProcessing, videoRef, skipHandPose, handPoseTimeout])

  // Determine what overlay to show
  const showLoading = !isCameraReady || (!isHandPoseEffectivelyReady && !cameraError)
  const error = cameraError || handPoseError

  return (
    <div ref={containerRef} className={`relative overflow-hidden rounded-lg bg-gray-900 ${className}`}>
      {/* Video element - always rendered but may be hidden */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={`w-full h-full object-cover ${showLoading || error ? 'opacity-0' : 'opacity-100'}`}
        style={{
          transform: 'scaleX(-1)', // Mirror effect for natural hand movement
          minHeight: '300px',
        }}
      />

      {/* Canvas for landmarks overlay */}
      <canvas
        ref={canvasRef}
        className={`absolute inset-0 pointer-events-none ${showLoading || error ? 'hidden' : ''}`}
        style={{
          mixBlendMode: 'screen',
          transform: 'scaleX(-1)',
        }}
      />

      {/* Loading overlay */}
      {showLoading && !error && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-white">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-lg font-medium mb-2">
              {!isCameraReady ? 'Inicializando câmera...' : 'Carregando detecção de mãos...'}
            </p>
            <p className="text-sm text-gray-300">
              {!isCameraReady 
                ? 'Permita o acesso à câmera quando solicitado'
                : 'Aguarde enquanto carregamos o modelo de IA...'
              }
            </p>
            {!isCameraReady && (
              <button
                onClick={() => startCamera()}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Solicitar acesso à câmera
              </button>
            )}
          </div>
        </div>
      )}

      {/* Error overlay */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-white">
            <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">⚠️</span>
            </div>
            <p className="text-lg font-medium mb-2">Erro na câmera</p>
            <p className="text-sm text-gray-300 mb-4">{error}</p>
            <button
              onClick={() => {
                stopCamera()
                setTimeout(() => startCamera(), 100)
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      )}

      {/* Status overlay when camera is working */}
      {!showLoading && !error && (handPoseTimeout && !handPoseReady) && (
        <div className="absolute top-2 right-2 bg-yellow-500/90 text-white text-xs p-2 rounded">
          ⚠️ Detecção de mãos indisponível
        </div>
      )}

      {/* Debug info overlay (development only) */}
      {import.meta.env.DEV && !showLoading && !error && (
        <div className="absolute top-2 left-2 bg-black/70 text-white text-xs p-2 rounded">
          <div>Mãos detectadas: {handResults?.length || 0}</div>
          <div>Dimensões: {videoDimensions.width}x{videoDimensions.height}</div>
          <div>HandPose: {handPoseReady ? '✅' : handPoseTimeout ? '⏱️' : '⏳'}</div>
        </div>
      )}
    </div>
  )
}

export default CameraFrame
