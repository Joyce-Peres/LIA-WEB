/**
 * Landmark Normalization Service
 *
 * Serviço para normalização de landmarks de mãos MediaPipe,
 * garantindo compatibilidade exata com o pré-processamento usado no treinamento Python.
 */
import { Injectable } from '@angular/core';

/**
 * Constantes dos landmarks MediaPipe Hands
 */
export const HAND_LANDMARKS = {
  COUNT: 21,
  /** Total de features por mão: 21 pontos × 3 coordenadas */
  FEATURES_PER_HAND: 21 * 3,
  /** Total de features para 2 mãos */
  TOTAL_FEATURES: 21 * 3 * 2, // 126
} as const;

/**
 * Resultado da normalização de uma frame
 */
export interface NormalizedFrame {
  /** Array plano de 126 features normalizadas */
  features: number[];
  /** Número original de mãos detectadas (0, 1, ou 2) */
  originalHandCount: number;
}

/**
 * Landmark individual do MediaPipe
 */
export interface Landmark {
  x: number;
  y: number;
  z: number;
}

@Injectable({ providedIn: 'root' })
export class LandmarkNormalizerService {
  /**
   * Normaliza landmarks de mãos para formato compatível com modelo treinado
   *
   * Esta função replica exatamente o pré-processamento usado no treinamento Python:
   * - X: dividido pela largura do vídeo (0-1)
   * - Y: dividido pela altura do vídeo (0-1)
   * - Z: mantido relativo (não normalizado)
   *
   * @param multiHandLandmarks - Resultados do MediaPipe Hands (0, 1, ou 2 mãos)
   * @param videoWidth - Largura do vídeo
   * @param videoHeight - Altura do vídeo
   * @returns Frame normalizada com 126 features
   */
  normalize(
    multiHandLandmarks: Landmark[][] | null | undefined,
    videoWidth: number,
    videoHeight: number
  ): NormalizedFrame {
    const features: number[] = [];
    const originalHandCount = multiHandLandmarks?.length || 0;

    // Validar dimensões do vídeo
    if (videoWidth <= 0 || videoHeight <= 0) {
      throw new Error('Video dimensions must be positive numbers');
    }

    // Processar mão 1 (primeira mão ou null)
    const hand1Features = this.normalizeHand(multiHandLandmarks?.[0] || null, videoWidth, videoHeight);
    features.push(...hand1Features);

    // Processar mão 2 (segunda mão ou null)
    const hand2Features = this.normalizeHand(multiHandLandmarks?.[1] || null, videoWidth, videoHeight);
    features.push(...hand2Features);

    // Validação final
    if (features.length !== HAND_LANDMARKS.TOTAL_FEATURES) {
      throw new Error(
        `Normalization failed: expected ${HAND_LANDMARKS.TOTAL_FEATURES} features, got ${features.length}`
      );
    }

    return { features, originalHandCount };
  }

  /**
   * Normaliza uma mão individual
   */
  private normalizeHand(landmarks: Landmark[] | null, videoWidth: number, videoHeight: number): number[] {
    const handFeatures: number[] = [];

    if (landmarks && landmarks.length === HAND_LANDMARKS.COUNT) {
      // Verificar se coordenadas já estão normalizadas (0-1)
      const coordsAlreadyNormalized = landmarks.every(p => p.x <= 1.01 && p.y <= 1.01);

      // Mão detectada: normalizar coordenadas
      for (const point of landmarks) {
        // X: normalizar pela largura do vídeo (0-1)
        const normalizedX = coordsAlreadyNormalized ? point.x : point.x / videoWidth;
        // Y: normalizar pela altura do vídeo (0-1)
        const normalizedY = coordsAlreadyNormalized ? point.y : point.y / videoHeight;
        // Z: manter relativo (não normalizar)
        const relativeZ = point.z;

        handFeatures.push(normalizedX, normalizedY, relativeZ);
      }
    } else {
      // Mão não detectada ou landmarks incompletos: preencher com zeros
      for (let i = 0; i < HAND_LANDMARKS.FEATURES_PER_HAND; i++) {
        handFeatures.push(0);
      }
    }

    return handFeatures;
  }

  /**
   * Extrai coordenadas de um landmark específico
   */
  getLandmark(features: number[], handIndex: 0 | 1, landmarkIndex: number): { x: number; y: number; z: number } {
    const offset = handIndex * HAND_LANDMARKS.FEATURES_PER_HAND + landmarkIndex * 3;
    return {
      x: features[offset] || 0,
      y: features[offset + 1] || 0,
      z: features[offset + 2] || 0,
    };
  }

  /**
   * Verifica se os features representam mãos válidas
   */
  hasValidHand(features: number[], handIndex: 0 | 1): boolean {
    const offset = handIndex * HAND_LANDMARKS.FEATURES_PER_HAND;
    // Uma mão é válida se não for tudo zeros
    for (let i = 0; i < HAND_LANDMARKS.FEATURES_PER_HAND; i++) {
      if (features[offset + i] !== 0) return true;
    }
    return false;
  }
}
