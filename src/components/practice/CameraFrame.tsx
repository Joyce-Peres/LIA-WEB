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
  landmarks: HandLandmark[]
) {
  if (!landmarks || landmarks.length === 0) return

  const offsetX = (ctx.canvas as any).__liaOffsetX || 0
  const offsetY = (ctx.canvas as any).__liaOffsetY || 0
  const drawWidth = (ctx.canvas as any).__liaDrawWidth || ctx.canvas.width
  const drawHeight = (ctx.canvas as any).__liaDrawHeight || ctx.canvas.height

  // Draw connections first (behind keypoints)
  ctx.strokeStyle = '#00ff00'
  ctx.lineWidth = 2
  ctx.globalAlpha = 0.7

  HAND_CONNECTIONS.forEach(([startIdx, endIdx]) => {
    if (startIdx >= landmarks.length || endIdx >= landmarks.length) return

    const start = landmarks[startIdx]
    const end = landmarks[endIdx]

    ctx.beginPath()
    ctx.moveTo(offsetX + start.x * drawWidth, offsetY + start.y * drawHeight)
    ctx.lineTo(offsetX + end.x * drawWidth, offsetY + end.y * drawHeight)
    ctx.stroke()
  })

  // Draw keypoints
  ctx.globalAlpha = 1.0
  landmarks.forEach((landmark, index) => {
    const x = offsetX + landmark.x * drawWidth
    const y = offsetY + landmark.y * drawHeight

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
    isProcessing: handPoseProcessing,
    error: handPoseError,
    fps: handPoseFps,
    startProcessing,
    stopProcessing,
  } = useHandPose()

  const [videoDimensions, setVideoDimensions] = useState({ width: 640, height: 480 })
  const isCameraReady = isActive && !isLoading
  
  // Consider hand pose ready if: it's actually ready, we're skipping it, timeout occurred, OR there was an error
  const isHandPoseEffectivelyReady = skipHandPose || handPoseReady || handPoseTimeout || !!handPoseError

  /**
   * Set timeout for hand pose loading (30 seconds)
   */
  useEffect(() => {
    if (skipHandPose || handPoseReady) return

    const timeoutId = setTimeout(() => {
      if (!handPoseReady) {
        console.warn('[CameraFrame] MediaPipe Hands loading timeout (30s) - continuing without hand detection')
        setHandPoseTimeout(true)
      }
    }, 30000)

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

    // Match canvas to the rendered container size so overlay aligns with object-contain video
    const containerRect = container.getBoundingClientRect()
    const containerWidth = containerRect.width || videoDimensions.width
    const containerHeight = containerRect.height || (containerWidth * (videoDimensions.height / videoDimensions.width))
    const containerAspect = containerWidth / containerHeight
    const videoAspect = videoDimensions.width / videoDimensions.height

    // Match the drawn area to the letterboxed video area so normalized coords align
    let drawWidth = containerWidth
    let drawHeight = containerHeight
    let offsetX = 0
    let offsetY = 0

    if (containerAspect > videoAspect) {
      // Bars on left/right
      drawHeight = containerHeight
      drawWidth = containerHeight * videoAspect
      offsetX = (containerWidth - drawWidth) / 2
    } else {
      // Bars on top/bottom
      drawWidth = containerWidth
      drawHeight = containerWidth / videoAspect
      offsetY = (containerHeight - drawHeight) / 2
    }

    canvas.width = containerWidth
    canvas.height = containerHeight
    canvas.style.width = `${containerWidth}px`
    canvas.style.height = `${containerHeight}px`

    // Store offsets for drawing
    ;(canvas as any).__liaOffsetX = offsetX
    ;(canvas as any).__liaOffsetY = offsetY
    ;(canvas as any).__liaDrawWidth = drawWidth
    ;(canvas as any).__liaDrawHeight = drawHeight
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
            drawLandmarks(ctx, hand.landmarks)
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Executa apenas uma vez na montagem

  /**
   * Start MediaPipe processing when camera and model are ready
   */
  useEffect(() => {
    // Don't start processing if skipping hand pose or if timeout occurred without ready
    if (skipHandPose || handPoseTimeout) {
      console.log('[CameraFrame] Skipping hand pose:', { skipHandPose, handPoseTimeout })
      return
    }
    
    if (!isCameraReady) {
      console.log('[CameraFrame] Camera not ready yet')
      return
    }
    
    if (!handPoseReady) {
      console.log('[CameraFrame] HandPose not ready yet')
      return
    }

    const video = videoRef.current
    if (!video) {
      console.log('[CameraFrame] No video ref')
      return
    }

    console.log('[CameraFrame] ✅ All ready! Starting hand pose processing...', {
      isCameraReady,
      handPoseReady,
      videoWidth: video.videoWidth,
      videoHeight: video.videoHeight,
      readyState: video.readyState
    })
    
    startProcessing(video)

    return () => {
      console.log('[CameraFrame] Cleanup: stopping hand pose processing')
      stopProcessing()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handPoseReady, isCameraReady, skipHandPose, handPoseTimeout])

  // Determine what overlay to show
  const showLoading = !isCameraReady || (!isHandPoseEffectivelyReady && !cameraError && !handPoseError)
  
  // Only camera error is fatal - handPose error just disables hand detection
  const fatalError = cameraError

  return (
    <div ref={containerRef} className={`relative overflow-hidden rounded-lg bg-gray-900 ${className}`}>
      {/* Video element - always rendered but may be hidden */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={`w-full h-full object-contain ${showLoading || fatalError ? 'opacity-0' : 'opacity-100'}`}
        style={{
          transform: 'scaleX(-1)', // Mirror effect for natural hand movement
          minHeight: '300px',
          backgroundColor: 'black', // Avoid visual mismatch when letterboxing
        }}
      />

      {/* Canvas for landmarks overlay */}
      <canvas
        ref={canvasRef}
        className={`absolute inset-0 pointer-events-none ${showLoading || fatalError ? 'hidden' : ''}`}
        style={{
          mixBlendMode: 'screen',
          transform: 'scaleX(-1)',
        }}
      />

      {/* Loading overlay */}
      {showLoading && !fatalError && (
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

      {/* Error overlay - only for camera errors */}
      {fatalError && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-white">
            <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">⚠️</span>
            </div>
            <p className="text-lg font-medium mb-2">Erro na câmera</p>
            <p className="text-sm text-gray-300 mb-4">{fatalError}</p>
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

      {/* Warning overlay for hand pose error (non-fatal) */}
      {!showLoading && !fatalError && handPoseError && (
        <div className="absolute top-2 right-2 bg-yellow-500/90 text-white text-xs p-2 rounded max-w-xs">
          ⚠️ Detecção de mãos indisponível
        </div>
      )}

      {/* Status overlay when camera is working but timeout occurred */}
      {!showLoading && !fatalError && !handPoseError && (handPoseTimeout && !handPoseReady) && (
        <div className="absolute top-2 right-2 bg-yellow-500/90 text-white text-xs p-2 rounded">
          ⚠️ Detecção de mãos indisponível
        </div>
      )}

      {/* Debug info overlay (development only) */}
      {import.meta.env.DEV && !showLoading && !fatalError && (
        <div className="absolute top-2 left-2 bg-black/70 text-white text-xs p-2 rounded space-y-1">
          <div>Mãos: {handResults?.length || 0}</div>
          <div>Video: {videoDimensions.width}x{videoDimensions.height}</div>
          <div>Camera: {isActive ? '✅' : '❌'} | Ready: {isCameraReady ? '✅' : '❌'}</div>
          <div>HandPose: {handPoseReady ? '✅' : handPoseError ? '❌' : handPoseTimeout ? '⏱️' : '⏳'}</div>
          <div>Processing: {handPoseProcessing ? '✅' : '❌'}</div>
          <div>FPS: {handPoseFps.toFixed(1)}</div>
        </div>
      )}
    </div>
  )
}

export default CameraFrame
