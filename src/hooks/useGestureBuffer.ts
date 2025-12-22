/**
 * useGestureBuffer Hook
 *
 * Custom React hook para gerenciamento de buffer circular de landmarks,
 * mantendo exatamente os últimos 30 frames para alimentação do modelo LSTM.
 *
 * @module hooks/useGestureBuffer
 * @category AI Pipeline
 *
 * @example
 * ```tsx
 * function GestureRecognitionPipeline() {
 *   const { results: handResults } = useHandPose()
 *   const { videoRef } = useCamera()
 *   const { isReady, getInferenceData, addFrame } = useGestureBuffer()
 *
 *   useEffect(() => {
 *     if (handResults !== undefined) {
 *       const video = videoRef.current
 *       if (video) {
 *         addFrame(handResults, video.videoWidth, video.videoHeight)
 *       }
 *     }
 *   }, [handResults, videoRef, addFrame])
 *
 *   useEffect(() => {
 *     if (isReady) {
 *       const data = getInferenceData() // [1, 30, 126]
 *       if (data) runInference(data)
 *     }
 *   }, [isReady, getInferenceData])
 * }
 * ```
 */

import { useState, useCallback, useRef } from 'react'
import type { HandResult } from './useHandPose'
import { normalizeLandmarks } from '../services/ai/normalizeLandmarks'

/**
 * Configuração do buffer de gestos
 */
export interface GestureBufferConfig {
  /** Tamanho do buffer (padrão: 30 frames) */
  bufferSize?: number
  /** Máximo de frames consecutivos sem mãos antes de limpar buffer (padrão: 10) */
  maxConsecutiveNulls?: number
}

/**
 * Estado do hook useGestureBuffer
 */
export interface GestureBufferState {
  /** Buffer está pronto para inferência (tem bufferSize frames) */
  isReady: boolean
  /** Número atual de frames no buffer */
  frameCount: number
  /** Número de frames consecutivos sem mãos detectadas */
  consecutiveNulls: number
}

/**
 * Controles do hook useGestureBuffer
 */
export interface GestureBufferControls {
  /** Adiciona um novo frame ao buffer */
  addFrame: (handResults: HandResult[] | null, videoWidth?: number, videoHeight?: number) => void
  /** Limpa o buffer completamente */
  clear: () => void
  /** Retorna dados formatados para inferência [1, 30, 126] ou null */
  getInferenceData: () => number[][][] | null
  /** Atualiza dimensões do vídeo para normalização */
  updateVideoDimensions: (width: number, height: number) => void
}

export type UseGestureBufferReturn = GestureBufferState & GestureBufferControls

const DEFAULT_CONFIG: Required<GestureBufferConfig> = {
  bufferSize: 30,
  maxConsecutiveNulls: 10,
}

/**
 * Hook customizado para gerenciamento de buffer circular de landmarks
 *
 * @param config - Configuração opcional do buffer
 * @returns Estado e controles do buffer
 */
export function useGestureBuffer(config?: GestureBufferConfig): UseGestureBufferReturn {
  const finalConfig = { ...DEFAULT_CONFIG, ...config }

  const [frameCount, setFrameCount] = useState(0)
  const [consecutiveNulls, setConsecutiveNulls] = useState(0)
  const [isReady, setIsReady] = useState(false)

  // Buffer circular como array de arrays (mais eficiente que array.shift())
  const bufferRef = useRef<number[][]>([])
  const videoDimensionsRef = useRef<{ width: number; height: number }>({
    width: 640, // defaults
    height: 480,
  })

  /**
   * Converte resultados das mãos para array de 126 features normalizadas
   * Formato: [hand1_x0, hand1_y0, hand1_z0, ..., hand1_x20, hand1_y20, hand1_z20,
   *          hand2_x0, hand2_y0, hand2_z0, ..., hand2_x20, hand2_y20, hand2_z20]
   */
  const convertToFeatures = useCallback(
    (handResults: HandResult[] | null): number[] => {
      const { width: videoWidth, height: videoHeight } = videoDimensionsRef.current

      const normalized = normalizeLandmarks(handResults, {
        videoWidth,
        videoHeight,
      })

      return normalized.features
    },
    []
  )

  /**
   * Adiciona um novo frame ao buffer (FIFO circular)
   */
  const addFrame = useCallback(
    (handResults: HandResult[] | null, videoWidth?: number, videoHeight?: number) => {
      // Atualizar dimensões se fornecidas
      if (videoWidth && videoHeight) {
        videoDimensionsRef.current = { width: videoWidth, height: videoHeight }
      }

      // Converter frame para features
      const features = convertToFeatures(handResults)

      // Lógica de buffer circular
      const buffer = bufferRef.current

      if (handResults === null || handResults.length === 0) {
        // Nenhuma mão detectada
        const newConsecutiveNulls = consecutiveNulls + 1

        if (newConsecutiveNulls >= finalConfig.maxConsecutiveNulls) {
          // Limpar buffer após muitos frames consecutivos sem mãos
          buffer.length = 0
          setFrameCount(0)
          setConsecutiveNulls(0)
          setIsReady(false)
          return
        }

        setConsecutiveNulls(newConsecutiveNulls)
      } else {
        // Mão(s) detectada(s): resetar contador de nulls
        setConsecutiveNulls(0)
      }

      // Adicionar frame ao buffer (FIFO circular)
      if (buffer.length >= finalConfig.bufferSize) {
        // Buffer cheio: remover primeiro elemento (mais antigo)
        buffer.shift()
      }

      buffer.push(features)

      const newFrameCount = buffer.length
      setFrameCount(newFrameCount)
      setIsReady(newFrameCount === finalConfig.bufferSize)
    },
    [convertToFeatures, consecutiveNulls, finalConfig.bufferSize, finalConfig.maxConsecutiveNulls]
  )

  /**
   * Limpa o buffer completamente
   */
  const clear = useCallback(() => {
    bufferRef.current.length = 0
    setFrameCount(0)
    setConsecutiveNulls(0)
    setIsReady(false)
  }, [])

  /**
   * Retorna dados formatados para inferência no formato [1, 30, 126]
   * Retorna null se buffer não estiver pronto
   */
  const getInferenceData = useCallback((): number[][][] | null => {
    if (!isReady || bufferRef.current.length !== finalConfig.bufferSize) {
      return null
    }

    // Retornar como batch de 1: [1, 30, 126]
    return [bufferRef.current.slice()] // slice() para copiar o array
  }, [isReady, finalConfig.bufferSize])

  /**
   * Atualiza dimensões do vídeo para normalização
   */
  const updateVideoDimensions = useCallback((width: number, height: number) => {
    videoDimensionsRef.current = { width, height }
  }, [])

  return {
    isReady,
    frameCount,
    consecutiveNulls,
    addFrame,
    clear,
    getInferenceData,
    updateVideoDimensions,
  }
}

