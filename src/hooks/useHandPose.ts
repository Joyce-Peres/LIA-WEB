/**
 * useHandPose Hook
 * 
 * Custom React hook para integração com MediaPipe Hands, extraindo landmarks
 * de mãos em tempo real a partir de frames de vídeo.
 * 
 * @module hooks/useHandPose
 * @category AI Pipeline
 * 
 * @example
 * ```tsx
 * function GestureComponent() {
 *   const { videoRef, isActive } = useCamera()
 *   const { results, startProcessing, stopProcessing, fps } = useHandPose()
 * 
 *   useEffect(() => {
 *     if (isActive && videoRef.current) {
 *       startProcessing(videoRef.current)
 *       return () => stopProcessing()
 *     }
 *   }, [isActive, videoRef])
 * 
 *   return (
 *     <div>
 *       <video ref={videoRef} />
 *       <p>Mãos detectadas: {results?.length || 0}</p>
 *       <p>FPS: {fps.toFixed(1)}</p>
 *     </div>
 *   )
 * }
 * ```
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { Hands, Results } from '@mediapipe/hands'

/**
 * Landmark individual da mão (x, y, z normalizados)
 */
export interface HandLandmark {
  /** Coordenada X normalizada (0-1) */
  x: number
  /** Coordenada Y normalizada (0-1) */
  y: number
  /** Profundidade relativa Z */
  z: number
}

/**
 * Resultado de detecção de uma única mão
 */
export interface HandResult {
  /** Array de 21 landmarks da mão */
  landmarks: HandLandmark[]
  /** Lateralidade da mão detectada */
  handedness: 'Left' | 'Right'
  /** Score de confiança (0-1) */
  score: number
}

/**
 * Configuração do MediaPipe Hands
 */
export interface HandPoseConfig {
  /** Número máximo de mãos a detectar (padrão: 2) */
  maxHands?: number
  /** Complexidade do modelo: 0 (lite) ou 1 (full). Padrão: 1 */
  modelComplexity?: 0 | 1
  /** Confiança mínima para detecção (padrão: 0.7) */
  minDetectionConfidence?: number
  /** Confiança mínima para rastreamento (padrão: 0.5) */
  minTrackingConfidence?: number
}

/**
 * Estado do hook useHandPose
 */
export interface UseHandPoseState {
  /** Resultados da detecção (null se nenhuma mão detectada) */
  results: HandResult[] | null
  /** Indica se está processando frames */
  isProcessing: boolean
  /** Indica se o MediaPipe foi inicializado */
  isReady: boolean
  /** Mensagem de erro (ou null) */
  error: string | null
  /** FPS atual de processamento */
  fps: number
}

/**
 * Controles do hook useHandPose
 */
export interface UseHandPoseControls {
  /** Processa um único frame do vídeo */
  processFrame: (video: HTMLVideoElement) => Promise<void>
  /** Inicia processamento contínuo (loop) */
  startProcessing: (video: HTMLVideoElement) => void
  /** Para processamento contínuo */
  stopProcessing: () => void
}

export type UseHandPoseReturn = UseHandPoseState & UseHandPoseControls

const DEFAULT_CONFIG: Required<HandPoseConfig> = {
  maxHands: 2,
  modelComplexity: 1,
  minDetectionConfidence: 0.7,
  minTrackingConfidence: 0.5,
}

/**
 * Hook customizado para detecção de landmarks de mãos usando MediaPipe
 * 
 * @param config - Configuração opcional do MediaPipe Hands
 * @returns Estado da detecção e controles de processamento
 */
export function useHandPose(config?: HandPoseConfig): UseHandPoseReturn {
  const finalConfig = { ...DEFAULT_CONFIG, ...config }

  const [results, setResults] = useState<HandResult[] | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isReady, setIsReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fps, setFps] = useState(0)

  const handsRef = useRef<Hands | null>(null)
  const processingLoopRef = useRef<number | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const fpsCounterRef = useRef<{ frames: number; lastTime: number }>({
    frames: 0,
    lastTime: Date.now(),
  })

  /**
   * Inicializa o MediaPipe Hands
   */
  useEffect(() => {
    let isMounted = true

    const initMediaPipe = async () => {
      console.log('[useHandPose] Starting MediaPipe initialization...')
      
      try {
        const hands = new Hands({
          locateFile: (file) => {
            const url = `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
            console.log('[useHandPose] Loading file:', file)
            return url
          },
        })

        console.log('[useHandPose] Setting options...')
        hands.setOptions({
          maxNumHands: finalConfig.maxHands,
          modelComplexity: finalConfig.modelComplexity,
          minDetectionConfidence: finalConfig.minDetectionConfidence,
          minTrackingConfidence: finalConfig.minTrackingConfidence,
        })

        hands.onResults((mpResults: Results) => {
          // Converte resultados do MediaPipe para nosso formato
          if (!mpResults.multiHandLandmarks || mpResults.multiHandLandmarks.length === 0) {
            setResults(null)
          } else {
            const handResults: HandResult[] = mpResults.multiHandLandmarks.map((landmarks, index) => ({
              landmarks: landmarks.map((lm) => ({
                x: lm.x,
                y: lm.y,
                z: lm.z,
              })),
              handedness: mpResults.multiHandedness?.[index]?.label as 'Left' | 'Right' || 'Right',
              score: mpResults.multiHandedness?.[index]?.score || 0,
            }))
            setResults(handResults)
          }

          // Atualiza FPS
          fpsCounterRef.current.frames++
          const now = Date.now()
          const elapsed = now - fpsCounterRef.current.lastTime
          if (elapsed >= 1000) {
            setFps((fpsCounterRef.current.frames * 1000) / elapsed)
            fpsCounterRef.current.frames = 0
            fpsCounterRef.current.lastTime = now
          }
        })

        console.log('[useHandPose] Initializing hands model...')
        await hands.initialize()
        
        if (!isMounted) {
          console.log('[useHandPose] Component unmounted during init, cleaning up...')
          hands.close()
          return
        }
        
        console.log('[useHandPose] MediaPipe Hands initialized successfully!')
        handsRef.current = hands
        setIsReady(true)
        setError(null)
      } catch (err) {
        console.error('[useHandPose] Error initializing MediaPipe Hands:', err)
        if (isMounted) {
          setError(
            'Falha ao carregar MediaPipe Hands. Verifique sua conexão com a internet.'
          )
          setIsReady(false)
        }
      }
    }

    initMediaPipe()

    return () => {
      isMounted = false
      // Cleanup: fecha MediaPipe ao desmontar
      if (handsRef.current) {
        console.log('[useHandPose] Closing MediaPipe...')
        handsRef.current.close()
        handsRef.current = null
      }
    }
  }, [finalConfig.maxHands, finalConfig.modelComplexity, finalConfig.minDetectionConfidence, finalConfig.minTrackingConfidence])

  /**
   * Processa um único frame do vídeo
   */
  const processFrame = useCallback(
    async (video: HTMLVideoElement) => {
      if (!handsRef.current || !isReady) {
        return
      }

      if (!video || video.readyState < 2) {
        // Video não pronto
        return
      }

      try {
        await handsRef.current.send({ image: video })
      } catch (err) {
        console.error('Erro ao processar frame:', err)
        // Não seta error para não interromper o loop
      }
    },
    [isReady]
  )

  /**
   * Inicia loop de processamento contínuo
   */
  const startProcessing = useCallback(
    (video: HTMLVideoElement) => {
      if (!isReady || isProcessing) {
        return
      }

      videoRef.current = video
      setIsProcessing(true)

      const processLoop = async () => {
        if (videoRef.current && isProcessing) {
          await processFrame(videoRef.current)
          processingLoopRef.current = requestAnimationFrame(processLoop)
        }
      }

      processLoop()
    },
    [isReady, isProcessing, processFrame]
  )

  /**
   * Para o loop de processamento
   */
  const stopProcessing = useCallback(() => {
    if (processingLoopRef.current) {
      cancelAnimationFrame(processingLoopRef.current)
      processingLoopRef.current = null
    }
    setIsProcessing(false)
    videoRef.current = null
    setResults(null)
    setFps(0)
  }, [])

  /**
   * Cleanup: para processamento ao desmontar
   */
  useEffect(() => {
    return () => {
      stopProcessing()
    }
  }, [stopProcessing])

  return {
    results,
    isProcessing,
    isReady,
    error,
    fps,
    processFrame,
    startProcessing,
    stopProcessing,
  }
}

