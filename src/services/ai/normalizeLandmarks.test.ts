import { describe, it, expect } from 'vitest'
import { normalizeLandmarks, LandmarkUtils, HAND_LANDMARKS } from './normalizeLandmarks'
import type { HandResult } from '../../hooks/useHandPose'

// Mock de HandResult para testes
const createMockHandResult = (
  handedness: 'Left' | 'Right',
  landmarks?: Array<{ x: number; y: number; z: number }>
): HandResult => ({
  landmarks: landmarks || Array.from({ length: 21 }, (_, i) => ({
    x: 100 + i * 5,  // Valores variados para X
    y: 200 + i * 3,  // Valores variados para Y
    z: i * 0.01,     // Valores variados para Z
  })),
  handedness,
  score: 0.95,
})

describe('normalizeLandmarks', () => {
  const videoOptions = { videoWidth: 640, videoHeight: 480 }

  it('deve normalizar uma mão corretamente', () => {
    const mockHand = createMockHandResult('Right')
    const result = normalizeLandmarks([mockHand], videoOptions)

    expect(result.features).toHaveLength(HAND_LANDMARKS.TOTAL_FEATURES)
    expect(result.originalHandCount).toBe(1)

    // Verificar primeira mão (índices 0-62)
    for (let i = 0; i < HAND_LANDMARKS.COUNT; i++) {
      const baseIndex = i * 3
      const expectedX = (100 + i * 5) / 640
      const expectedY = (200 + i * 3) / 480
      const expectedZ = i * 0.01

      expect(result.features[baseIndex]).toBeCloseTo(expectedX, 6)     // X normalizado
      expect(result.features[baseIndex + 1]).toBeCloseTo(expectedY, 6) // Y normalizado
      expect(result.features[baseIndex + 2]).toBe(expectedZ)           // Z inalterado
    }

    // Verificar segunda mão é zeros (índices 63-125)
    for (let i = 63; i < HAND_LANDMARKS.TOTAL_FEATURES; i++) {
      expect(result.features[i]).toBe(0)
    }
  })

  it('deve normalizar duas mãos corretamente', () => {
    const hand1 = createMockHandResult('Right')
    const hand2 = createMockHandResult('Left')
    const result = normalizeLandmarks([hand1, hand2], videoOptions)

    expect(result.features).toHaveLength(HAND_LANDMARKS.TOTAL_FEATURES)
    expect(result.originalHandCount).toBe(2)

    // Verificar ambas as mãos têm valores não-zeros
    expect(result.features[0]).toBeGreaterThan(0)  // Primeira mão X
    expect(result.features[63]).toBeGreaterThan(0) // Segunda mão X
  })

  it('deve lidar com nenhuma mão detectada', () => {
    const result = normalizeLandmarks(null, videoOptions)

    expect(result.features).toHaveLength(HAND_LANDMARKS.TOTAL_FEATURES)
    expect(result.originalHandCount).toBe(0)

    // Tudo deve ser zeros
    result.features.forEach(feature => {
      expect(feature).toBe(0)
    })
  })

  it('deve lidar com array vazio de mãos', () => {
    const result = normalizeLandmarks([], videoOptions)

    expect(result.features).toHaveLength(HAND_LANDMARKS.TOTAL_FEATURES)
    expect(result.originalHandCount).toBe(0)

    // Tudo deve ser zeros
    result.features.forEach(feature => {
      expect(feature).toBe(0)
    })
  })

  it('deve validar dimensões do vídeo', () => {
    const mockHand = createMockHandResult('Right')

    expect(() => normalizeLandmarks([mockHand], { videoWidth: 0, videoHeight: 480 }))
      .toThrow('Video dimensions must be positive numbers')

    expect(() => normalizeLandmarks([mockHand], { videoWidth: 640, videoHeight: -1 }))
      .toThrow('Video dimensions must be positive numbers')
  })

  it('deve lidar com landmarks incompletos', () => {
    const incompleteHand: HandResult = {
      landmarks: [{ x: 100, y: 200, z: 0.1 }], // Apenas 1 landmark ao invés de 21
      handedness: 'Right',
      score: 0.95,
    }

    const result = normalizeLandmarks([incompleteHand], videoOptions)

    expect(result.features).toHaveLength(HAND_LANDMARKS.TOTAL_FEATURES)
    expect(result.originalHandCount).toBe(1)

    // Primeira mão deve ser zeros (landmarks incompletos)
    for (let i = 0; i < HAND_LANDMARKS.FEATURES_PER_HAND; i++) {
      expect(result.features[i]).toBe(0)
    }

    // Segunda mão deve ser zeros
    for (let i = HAND_LANDMARKS.FEATURES_PER_HAND; i < HAND_LANDMARKS.TOTAL_FEATURES; i++) {
      expect(result.features[i]).toBe(0)
    }
  })

  it('deve manter ranges válidos para coordenadas normalizadas', () => {
    // Criar landmarks com valores extremos
    const extremeHand: HandResult = {
      landmarks: [
        { x: 0, y: 0, z: -1 },           // Mínimos
        { x: 640, y: 480, z: 1 },        // Máximos
        ...Array.from({ length: 19 }, () => ({ x: 320, y: 240, z: 0 })), // Centro
      ],
      handedness: 'Right',
      score: 0.95,
    }

    const result = normalizeLandmarks([extremeHand], videoOptions)

    // X deve estar em [0, 1]
    expect(result.features[0]).toBe(0)    // x = 0/640 = 0
    expect(result.features[3]).toBe(1)    // x = 640/640 = 1

    // Y deve estar em [0, 1]
    expect(result.features[1]).toBe(0)    // y = 0/480 = 0
    expect(result.features[4]).toBe(1)    // y = 480/480 = 1

    // Z deve permanecer inalterado
    expect(result.features[2]).toBe(-1)   // z = -1 (inalterado)
    expect(result.features[5]).toBe(1)    // z = 1 (inalterado)
  })
})

describe('LandmarkUtils', () => {
  const videoOptions = { videoWidth: 640, videoHeight: 480 }

  it('deve extrair coordenadas de um landmark específico', () => {
    const mockHand = createMockHandResult('Right')
    const normalized = normalizeLandmarks([mockHand], videoOptions)

    // Extrair primeiro landmark da primeira mão
    const landmark = LandmarkUtils.getLandmark(normalized.features, 0, 0)

    expect(landmark.x).toBeCloseTo(100 / 640, 6)
    expect(landmark.y).toBeCloseTo(200 / 480, 6)
    expect(landmark.z).toBe(0)
  })

  it('deve verificar se uma mão é válida', () => {
    const mockHand = createMockHandResult('Right')

    // Uma mão válida
    const oneHand = normalizeLandmarks([mockHand], videoOptions)
    expect(LandmarkUtils.isHandValid(oneHand.features, 0)).toBe(true)
    expect(LandmarkUtils.isHandValid(oneHand.features, 1)).toBe(false)

    // Nenhuma mão
    const noHands = normalizeLandmarks(null, videoOptions)
    expect(LandmarkUtils.isHandValid(noHands.features, 0)).toBe(false)
    expect(LandmarkUtils.isHandValid(noHands.features, 1)).toBe(false)
  })

  it('deve contar mãos válidas', () => {
    const hand1 = createMockHandResult('Right')
    const hand2 = createMockHandResult('Left')

    // Nenhuma mão
    const noHands = normalizeLandmarks(null, videoOptions)
    expect(LandmarkUtils.countValidHands(noHands.features)).toBe(0)

    // Uma mão
    const oneHand = normalizeLandmarks([hand1], videoOptions)
    expect(LandmarkUtils.countValidHands(oneHand.features)).toBe(1)

    // Duas mãos
    const twoHands = normalizeLandmarks([hand1, hand2], videoOptions)
    expect(LandmarkUtils.countValidHands(twoHands.features)).toBe(2)
  })
})

describe('HAND_LANDMARKS constants', () => {
  it('deve ter constantes corretas', () => {
    expect(HAND_LANDMARKS.COUNT).toBe(21)
    expect(HAND_LANDMARKS.FEATURES_PER_HAND).toBe(63) // 21 * 3
    expect(HAND_LANDMARKS.TOTAL_FEATURES).toBe(126)  // 63 * 2
  })
})

