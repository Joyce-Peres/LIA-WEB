/**
 * useGesturePostProcessing Hook
 *
 * Custom React hook para pós-processamento de predições de gestos,
 * aplicando threshold de confiança e debounce para evitar oscilações.
 *
 * @module hooks/useGesturePostProcessing
 * @category AI Pipeline
 *
 * @example
 * ```tsx
 * function GestureRecognitionPipeline() {
 *   const { runInference } = useModelInference()
 *   const { processPrediction, currentPrediction, isDebouncing } = useGesturePostProcessing()
 *
 *   useEffect(() => {
 *     if (inferenceData) {
 *       const rawPrediction = runInference(inferenceData)
 *       const stablePrediction = processPrediction(rawPrediction)
 *
 *       if (stablePrediction) {
 *         console.log('Stable gesture:', stablePrediction.gestureClass)
 *       }
 *     }
 *   }, [inferenceData, runInference, processPrediction])
 * }
 * ```
 */

import { useState, useCallback, useRef } from 'react'
import type { InferenceResult } from './useModelInference'

/**
 * Predição estável após pós-processamento
 */
export interface StablePrediction {
  /** Classe do gesto reconhecido (0-60) */
  gestureClass: number
  /** Confiança da predição (0-1) */
  confidence: number
  /** Número de frames consecutivos com esta predição */
  stableFrames: number
  /** Timestamp da última atualização */
  lastUpdated: number
}

/**
 * Configuração do pós-processamento
 */
export interface PostProcessingConfig {
  /** Threshold mínimo de confiança (padrão: 0.85) */
  confidenceThreshold?: number
  /** Número de frames consecutivos necessários (padrão: 5) */
  debounceFrames?: number
}

/**
 * Estado do hook useGesturePostProcessing
 */
export interface UseGesturePostProcessingState {
  /** Predição estável atual (ou null) */
  currentPrediction: StablePrediction | null
  /** Indica se está em processo de debounce */
  isDebouncing: boolean
  /** Progresso do debounce (0 até debounceFrames) */
  debounceProgress: number
  /** Última predição raw recebida */
  lastRawPrediction: InferenceResult | null
}

/**
 * Controles do hook useGesturePostProcessing
 */
export interface UseGesturePostProcessingControls {
  /** Processa uma nova predição e retorna resultado estável se disponível */
  processPrediction: (prediction: InferenceResult | null) => StablePrediction | null
  /** Reseta o estado de pós-processamento */
  reset: () => void
  /** Retorna a predição estável atual */
  getStablePrediction: () => StablePrediction | null
}

export type UseGesturePostProcessingReturn = UseGesturePostProcessingState & UseGesturePostProcessingControls

const DEFAULT_CONFIG: Required<PostProcessingConfig> = {
  confidenceThreshold: 0.85,
  debounceFrames: 5,
}

/**
 * Hook customizado para pós-processamento de predições de gestos
 *
 * @param config - Configuração opcional do pós-processamento
 * @returns Estado e controles de pós-processamento
 */
export function useGesturePostProcessing(config?: PostProcessingConfig): UseGesturePostProcessingReturn {
  const finalConfig = { ...DEFAULT_CONFIG, ...config }

  const [currentPrediction, setCurrentPrediction] = useState<StablePrediction | null>(null)
  const [isDebouncing, setIsDebouncing] = useState(false)
  const [debounceProgress, setDebounceProgress] = useState(0)
  const [lastRawPrediction, setLastRawPrediction] = useState<InferenceResult | null>(null)

  // Estado interno para debounce
  const debounceStateRef = useRef<{
    currentDebouncingClass: number | null
    consecutiveFrames: number
  }>({
    currentDebouncingClass: null,
    consecutiveFrames: 0,
  })

  /**
   * Reseta o estado de debounce
   */
  const resetDebounce = useCallback(() => {
    debounceStateRef.current = {
      currentDebouncingClass: null,
      consecutiveFrames: 0,
    }
    setIsDebouncing(false)
    setDebounceProgress(0)
  }, [])

  /**
   * Processa uma nova predição aplicando threshold e debounce
   *
   * @param prediction - Predição raw do modelo ou null
   * @returns Predição estável se debounce completo, null caso contrário
   */
  const processPrediction = useCallback(
    (prediction: InferenceResult | null): StablePrediction | null => {
      setLastRawPrediction(prediction)

      // Verificar se a predição atende ao threshold de confiança
      if (!prediction || prediction.confidence < finalConfig.confidenceThreshold) {
        if (prediction && prediction.confidence < finalConfig.confidenceThreshold) {
          console.debug(
            `Predição rejeitada: confiança ${prediction.confidence.toFixed(3)} < threshold ${finalConfig.confidenceThreshold}`
          )
        }

        // Resetar debounce se não há predição válida
        resetDebounce()
        return null
      }

      const predictedClass = prediction.predictedClass
      const state = debounceStateRef.current

      // Lógica de debounce
      if (state.currentDebouncingClass === null) {
        // Iniciar novo processo de debounce
        state.currentDebouncingClass = predictedClass
        state.consecutiveFrames = 1
        setIsDebouncing(true)
        setDebounceProgress(1)
        console.debug(`Iniciando debounce para gesto ${predictedClass}`)

      } else if (state.currentDebouncingClass === predictedClass) {
        // Continuar debounce com a mesma predição
        state.consecutiveFrames++
        setDebounceProgress(state.consecutiveFrames)

        console.debug(
          `Debounce progresso: ${state.consecutiveFrames}/${finalConfig.debounceFrames} para gesto ${predictedClass}`
        )

      } else {
        // Predição mudou, reiniciar debounce
        console.debug(
          `Predição mudou de ${state.currentDebouncingClass} para ${predictedClass}, reiniciando debounce`
        )
        state.currentDebouncingClass = predictedClass
        state.consecutiveFrames = 1
        setIsDebouncing(true)
        setDebounceProgress(1)
      }

      // Verificar se debounce está completo
      if (state.consecutiveFrames >= finalConfig.debounceFrames) {
        // Criar predição estável
        const stablePrediction: StablePrediction = {
          gestureClass: predictedClass,
          confidence: prediction.confidence,
          stableFrames: state.consecutiveFrames,
          lastUpdated: Date.now(),
        }

        setCurrentPrediction(stablePrediction)
        setIsDebouncing(false)
        setDebounceProgress(0)

        console.log(`✅ Gesto estável reconhecido: classe ${predictedClass} com confiança ${prediction.confidence.toFixed(3)}`)

        return stablePrediction
      }

      // Ainda em debounce
      return null
    },
    [finalConfig.confidenceThreshold, finalConfig.debounceFrames, resetDebounce]
  )

  /**
   * Reseta completamente o estado de pós-processamento
   */
  const reset = useCallback(() => {
    resetDebounce()
    setCurrentPrediction(null)
    setLastRawPrediction(null)
  }, [resetDebounce])

  /**
   * Retorna a predição estável atual
   */
  const getStablePrediction = useCallback(() => currentPrediction, [currentPrediction])

  return {
    currentPrediction,
    isDebouncing,
    debounceProgress,
    lastRawPrediction,
    processPrediction,
    reset,
    getStablePrediction,
  }
}

