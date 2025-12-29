/**
 * useHandPose Hook
 * 
 * Custom React hook para integração com MediaPipe Hand Landmarker,
 * extraindo landmarks de mãos em tempo real a partir de frames de vídeo.
 * 
 * Usa a API MediaPipe Tasks Vision para melhor compatibilidade e performance.
 * Baseado na configuração do projeto libras_alfabeto_projeto:
 * - max_num_hands: 2
 * - min_detection_confidence: 0.7
 * - min_tracking_confidence: 0.5
 * 
 * @module hooks/useHandPose
 * @category AI Pipeline
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision'

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
  processFrame: (video: HTMLVideoElement) => void
  /** Inicia processamento contínuo (loop) */
  startProcessing: (video: HTMLVideoElement) => void
  /** Para processamento contínuo */
  stopProcessing: () => void
}

export type UseHandPoseReturn = UseHandPoseState & UseHandPoseControls

const DEFAULT_CONFIG: Required<HandPoseConfig> = {
  maxHands: 2,
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
  const configRef = useRef(finalConfig)

  const [results, setResults] = useState<HandResult[] | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isReady, setIsReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fps, setFps] = useState(0)

  // Refs para evitar problemas de closure
  const handLandmarkerRef = useRef<HandLandmarker | null>(null)
  const processingLoopRef = useRef<number | null>(null)
  const isProcessingRef = useRef(false)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const lastFrameTimeRef = useRef(0)
  const frameCountRef = useRef(0)
  const lastVideoTimeRef = useRef(-1)

  /**
   * Inicializa o MediaPipe Hand Landmarker
   */
  useEffect(() => {
    let mounted = true

    const initHandLandmarker = async () => {
      console.log('[useHandPose] Starting MediaPipe Hand Landmarker initialization...')
      
      try {
        // Carrega o WASM e modelo
        console.log('[useHandPose] Loading vision WASM...')
        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
        )
        
        if (!mounted) return
        
        const cfg = configRef.current
        console.log('[useHandPose] Creating HandLandmarker with config:', cfg)
        
        const handLandmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
            delegate: 'GPU'
          },
          runningMode: 'VIDEO',
          numHands: cfg.maxHands,
          minHandDetectionConfidence: cfg.minDetectionConfidence,
          minHandPresenceConfidence: cfg.minDetectionConfidence,
          minTrackingConfidence: cfg.minTrackingConfidence,
        })
        
        if (!mounted) {
          handLandmarker.close()
          return
        }
        
        console.log('[useHandPose] ✅ MediaPipe Hand Landmarker initialized successfully!')
        handLandmarkerRef.current = handLandmarker
        setIsReady(true)
        setError(null)
      } catch (err) {
        console.error('[useHandPose] ❌ Error initializing Hand Landmarker:', err)
        if (mounted) {
          setError(`Falha ao carregar MediaPipe: ${err instanceof Error ? err.message : 'Erro desconhecido'}`)
          setIsReady(false)
        }
      }
    }

    initHandLandmarker()

    return () => {
      mounted = false
      if (handLandmarkerRef.current) {
        console.log('[useHandPose] Cleaning up Hand Landmarker...')
        handLandmarkerRef.current.close()
        handLandmarkerRef.current = null
      }
    }
  }, [])

  /**
   * Processa um único frame do vídeo
   */
  const processFrame = useCallback((video: HTMLVideoElement) => {
    if (!handLandmarkerRef.current || !isReady) return
    if (video.readyState < 2 || video.videoWidth === 0) return
    
    // Evita processar o mesmo frame duas vezes
    if (video.currentTime === lastVideoTimeRef.current) return
    lastVideoTimeRef.current = video.currentTime

    try {
      const startTime = performance.now()
      const result = handLandmarkerRef.current.detectForVideo(video, startTime)
      
      // Converte resultados para nosso formato
      if (!result.landmarks || result.landmarks.length === 0) {
        setResults(null)
      } else {
        const handResults: HandResult[] = result.landmarks.map((landmarks, index) => ({
          landmarks: landmarks.map((lm) => ({
            x: lm.x,
            y: lm.y,
            z: lm.z,
          })),
          handedness: (result.handedness?.[index]?.[0]?.categoryName as 'Left' | 'Right') || 'Right',
          score: result.handedness?.[index]?.[0]?.score || 0,
        }))
        setResults(handResults)
      }

      // Calcula FPS
      frameCountRef.current++
      const now = performance.now()
      if (now - lastFrameTimeRef.current >= 1000) {
        setFps(frameCountRef.current)
        frameCountRef.current = 0
        lastFrameTimeRef.current = now
      }
    } catch (err) {
      console.warn('[useHandPose] Frame processing error:', err)
    }
  }, [isReady])

  /**
   * Inicia loop de processamento contínuo
   */
  const startProcessing = useCallback((video: HTMLVideoElement) => {
    if (!isReady) {
      console.warn('[useHandPose] Not ready, cannot start processing')
      return
    }

    if (isProcessingRef.current) {
      console.log('[useHandPose] Already processing')
      return
    }

    console.log('[useHandPose] Starting processing loop...')
    videoRef.current = video
    isProcessingRef.current = true
    setIsProcessing(true)
    lastFrameTimeRef.current = performance.now()
    frameCountRef.current = 0
    lastVideoTimeRef.current = -1

    const loop = () => {
      if (!isProcessingRef.current || !videoRef.current || !handLandmarkerRef.current) {
        return
      }

      const video = videoRef.current
      
      // Processa frame se o vídeo estiver pronto
      if (video.readyState >= 2 && video.videoWidth > 0 && video.currentTime !== lastVideoTimeRef.current) {
        lastVideoTimeRef.current = video.currentTime
        
        try {
          const timestamp = performance.now()
          const result = handLandmarkerRef.current.detectForVideo(video, timestamp)
          
          if (!result.landmarks || result.landmarks.length === 0) {
            setResults(null)
          } else {
            const handResults: HandResult[] = result.landmarks.map((landmarks, index) => ({
              landmarks: landmarks.map((lm) => ({
                x: lm.x,
                y: lm.y,
                z: lm.z,
              })),
              handedness: (result.handedness?.[index]?.[0]?.categoryName as 'Left' | 'Right') || 'Right',
              score: result.handedness?.[index]?.[0]?.score || 0,
            }))
            setResults(handResults)
          }

          // Calcula FPS
          frameCountRef.current++
          const now = performance.now()
          if (now - lastFrameTimeRef.current >= 1000) {
            setFps(frameCountRef.current)
            frameCountRef.current = 0
            lastFrameTimeRef.current = now
          }
        } catch (err) {
          // Ignora erros individuais
        }
      }

      // Agenda próximo frame
      if (isProcessingRef.current) {
        processingLoopRef.current = requestAnimationFrame(loop)
      }
    }

    processingLoopRef.current = requestAnimationFrame(loop)
  }, [isReady])

  /**
   * Para o loop de processamento
   */
  const stopProcessing = useCallback(() => {
    console.log('[useHandPose] Stopping processing...')
    isProcessingRef.current = false
    
    if (processingLoopRef.current) {
      cancelAnimationFrame(processingLoopRef.current)
      processingLoopRef.current = null
    }
    
    videoRef.current = null
    setIsProcessing(false)
    setResults(null)
    setFps(0)
    lastVideoTimeRef.current = -1
  }, [])

  // Cleanup ao desmontar
  useEffect(() => {
    return () => {
      if (processingLoopRef.current) {
        cancelAnimationFrame(processingLoopRef.current)
      }
    }
  }, [])

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

