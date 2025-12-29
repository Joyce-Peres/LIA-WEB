/**
 * Landmark Normalization Service
 *
 * Serviço para normalização de landmarks de mãos MediaPipe,
 * garantindo compatibilidade exata com o pré-processamento usado no treinamento Python.
 *
 * @module services/ai/normalizeLandmarks
 * @category AI Pipeline
 *
 * @example
 * ```typescript
 * import { normalizeLandmarks } from './services/ai/normalizeLandmarks'
 *
 * const normalized = normalizeLandmarks(handResults, {
 *   videoWidth: 640,
 *   videoHeight: 480
 * })
 *
 * console.log(normalized.features) // [x0,y0,z0, x1,y1,z1, ..., x62,y62,z62] (126 features)
 * console.log(normalized.originalHandCount) // 0, 1, or 2
 * ```
 */

import type { HandResult } from '../../hooks/useHandPose'

/**
 * Opções para normalização de landmarks
 */
export interface NormalizationOptions {
  /** Largura do vídeo para normalização X */
  videoWidth: number
  /** Altura do vídeo para normalização Y */
  videoHeight: number
}

/**
 * Resultado da normalização de uma frame
 */
export interface NormalizedFrame {
  /** Array plano de 126 features normalizadas */
  features: number[]
  /** Número original de mãos detectadas (0, 1, ou 2) */
  originalHandCount: number
}

/**
 * Constantes dos landmarks MediaPipe Hands
 */
export const HAND_LANDMARKS = {
  COUNT: 21,
  /** Total de features por mão: 21 pontos × 3 coordenadas */
  FEATURES_PER_HAND: 21 * 3,
  /** Total de features para 2 mãos */
  TOTAL_FEATURES: 21 * 3 * 2,
} as const

/**
 * Normaliza landmarks de mãos para formato compatível com modelo treinado
 *
 * Esta função replica exatamente o pré-processamento usado no treinamento Python:
 * - X: dividido pela largura do vídeo (0-1)
 * - Y: dividido pela altura do vídeo (0-1)
 * - Z: mantido relativo (não normalizado)
 *
 * @param handResults - Resultados do MediaPipe Hands (0, 1, ou 2 mãos)
 * @param options - Dimensões do vídeo para normalização
 * @returns Frame normalizada com 126 features
 */
export function normalizeLandmarks(
  handResults: HandResult[] | null,
  options: NormalizationOptions
): NormalizedFrame {
  const { videoWidth, videoHeight } = options
  const features: number[] = []
  const originalHandCount = handResults?.length || 0

  // Validar dimensões do vídeo
  if (videoWidth <= 0 || videoHeight <= 0) {
    throw new Error('Video dimensions must be positive numbers')
  }

  /**
   * Normaliza uma mão individual
   */
  const normalizeHand = (handResult: HandResult | null): number[] => {
    const handFeatures: number[] = []

    if (handResult && handResult.landmarks.length === HAND_LANDMARKS.COUNT) {
      const coordsAlreadyNormalized = handResult.landmarks.every(p => p.x <= 1.01 && p.y <= 1.01)

      // Mão detectada: normalizar coordenadas
      handResult.landmarks.forEach((point, index) => {
        // X: normalizar pela largura do vídeo (0-1)
        const normalizedX = coordsAlreadyNormalized ? point.x : point.x / videoWidth
        // Y: normalizar pela altura do vídeo (0-1)
        const normalizedY = coordsAlreadyNormalized ? point.y : point.y / videoHeight
        // Z: manter relativo (não normalizar)
        const relativeZ = point.z

        // Validar ranges (debugging)
        if (process.env.NODE_ENV === 'development') {
          if (normalizedX < 0 || normalizedX > 1) {
            console.warn(`Landmark ${index} X out of range: ${normalizedX}`)
          }
          if (normalizedY < 0 || normalizedY > 1) {
            console.warn(`Landmark ${index} Y out of range: ${normalizedY}`)
          }
        }

        handFeatures.push(normalizedX, normalizedY, relativeZ)
      })
    } else {
      // Mão não detectada ou landmarks incompletos: preencher com zeros
      for (let i = 0; i < HAND_LANDMARKS.FEATURES_PER_HAND; i++) {
        handFeatures.push(0)
      }
    }

    return handFeatures
  }

  // Processar mão 1 (primeira mão ou null)
  const hand1Features = normalizeHand(handResults?.[0] || null)
  features.push(...hand1Features)

  // Processar mão 2 (segunda mão ou null)
  const hand2Features = normalizeHand(handResults?.[1] || null)
  features.push(...hand2Features)

  // Validação final
  if (features.length !== HAND_LANDMARKS.TOTAL_FEATURES) {
    throw new Error(
      `Normalization failed: expected ${HAND_LANDMARKS.TOTAL_FEATURES} features, got ${features.length}`
    )
  }

  return {
    features,
    originalHandCount,
  }
}

/**
 * Utilitários para trabalhar com features normalizadas
 */
export const LandmarkUtils = {
  /**
   * Extrai coordenadas de um landmark específico
   */
  getLandmark: (features: number[], handIndex: 0 | 1, landmarkIndex: number): { x: number; y: number; z: number } => {
    const handOffset = handIndex * HAND_LANDMARKS.FEATURES_PER_HAND
    const landmarkOffset = landmarkIndex * 3
    const index = handOffset + landmarkOffset

    return {
      x: features[index],
      y: features[index + 1],
      z: features[index + 2],
    }
  },

  /**
   * Verifica se uma mão tem dados válidos (não é toda zeros)
   */
  isHandValid: (features: number[], handIndex: 0 | 1): boolean => {
    const handOffset = handIndex * HAND_LANDMARKS.FEATURES_PER_HAND
    const handFeatures = features.slice(handOffset, handOffset + HAND_LANDMARKS.FEATURES_PER_HAND)

    // Verifica se pelo menos uma coordenada não é zero
    return handFeatures.some(value => value !== 0)
  },

  /**
   * Conta quantas mãos têm dados válidos
   */
  countValidHands: (features: number[]): number => {
    let count = 0
    if (LandmarkUtils.isHandValid(features, 0)) count++
    if (LandmarkUtils.isHandValid(features, 1)) count++
    return count
  },
} as const

