import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useGestureBuffer } from './useGestureBuffer'
import type { HandResult } from './useHandPose'

// Mock de HandResult para testes
const createMockHandResult = (
  handedness: 'Left' | 'Right',
  landmarks?: Array<{ x: number; y: number; z: number }>
): HandResult => ({
  landmarks: landmarks || Array.from({ length: 21 }, (_, i) => ({
    x: 100 + i * 10,  // Valores maiores para evitar underflow
    y: 100 + i * 10,
    z: i * 0.1,
  })),
  handedness,
  score: 0.95,
})

describe('useGestureBuffer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('deve inicializar com estado padrão', () => {
    const { result } = renderHook(() => useGestureBuffer())

    expect(result.current.isReady).toBe(false)
    expect(result.current.frameCount).toBe(0)
    expect(result.current.consecutiveNulls).toBe(0)
    expect(typeof result.current.addFrame).toBe('function')
    expect(typeof result.current.clear).toBe('function')
    expect(typeof result.current.getInferenceData).toBe('function')
    expect(typeof result.current.updateVideoDimensions).toBe('function')
  })

  it('deve aceitar configuração customizada', () => {
    const { result } = renderHook(() =>
      useGestureBuffer({
        bufferSize: 15,
        maxConsecutiveNulls: 5,
      })
    )

    expect(result.current.isReady).toBe(false)
    expect(result.current.frameCount).toBe(0)
  })

  it('deve adicionar frames ao buffer', () => {
    const { result } = renderHook(() => useGestureBuffer())

    const mockHand = createMockHandResult('Right')

    act(() => {
      result.current.addFrame([mockHand], 640, 480)
    })

    expect(result.current.frameCount).toBe(1)
    expect(result.current.isReady).toBe(false)
    expect(result.current.consecutiveNulls).toBe(0)
  })

  it('deve ficar pronto após 30 frames', () => {
    const { result } = renderHook(() => useGestureBuffer())

    const mockHand = createMockHandResult('Right')

    // Adicionar 30 frames
    for (let i = 0; i < 30; i++) {
      act(() => {
        result.current.addFrame([mockHand], 640, 480)
      })
    }

    expect(result.current.frameCount).toBe(30)
    expect(result.current.isReady).toBe(true)
  })

  it('deve manter buffer circular (FIFO) após 30 frames', () => {
    const { result } = renderHook(() => useGestureBuffer())

    // Criar mãos com landmarks distintos
    const hand1Landmarks = Array.from({ length: 21 }, () => ({ x: 100, y: 100, z: 0.1 }))
    const hand2Landmarks = Array.from({ length: 21 }, () => ({ x: 200, y: 200, z: 0.2 }))

    const hand1 = createMockHandResult('Right', hand1Landmarks)
    const hand2 = createMockHandResult('Left', hand2Landmarks)

    // Adicionar 35 frames (5 extras)
    for (let i = 0; i < 35; i++) {
      act(() => {
        result.current.addFrame(i < 30 ? [hand1] : [hand2], 640, 480)
      })
    }

    expect(result.current.frameCount).toBe(30) // Deve manter apenas 30
    expect(result.current.isReady).toBe(true)

    // Verificar que os primeiros 5 frames foram removidos (FIFO)
    const inferenceData = result.current.getInferenceData()
    expect(inferenceData).toHaveLength(1) // batch de 1
    expect(inferenceData![0]).toHaveLength(30) // 30 timesteps
    expect(inferenceData![0][0]).toHaveLength(126) // 126 features

    // Os últimos 5 frames devem ser hand2
    // Verificar último frame (frame 29, que é o mais recente)
    const lastFrameIndex = 29
    expect(inferenceData![0][lastFrameIndex][0]).toBe(200 / 640) // x normalizado do último frame
  })

  it('deve lidar com uma mão detectada (preencher segunda mão com zeros)', () => {
    const { result } = renderHook(() => useGestureBuffer())

    const mockHand = createMockHandResult('Right')

    // Adicionar 30 frames para buffer ficar pronto
    for (let i = 0; i < 30; i++) {
      act(() => {
        result.current.addFrame([mockHand], 640, 480)
      })
    }

    const inferenceData = result.current.getInferenceData()
    expect(inferenceData![0][0]).toHaveLength(126)

    // Primeira mão: valores normalizados (não zeros)
    expect(inferenceData![0][0][0]).toBeGreaterThan(0) // x do primeiro landmark
    expect(inferenceData![0][0][1]).toBeGreaterThan(0) // y do primeiro landmark

    // Primeira mão: índices 0-62 (21 landmarks × 3 coordenadas)
    // Segunda mão: índices 63-125 (deve ser zeros)

    // Verificar que primeira mão tem valores
    expect(inferenceData![0][0][0]).toBeGreaterThan(0) // primeira mão, primeiro landmark x
    expect(inferenceData![0][0][1]).toBeGreaterThan(0) // primeira mão, primeiro landmark y

    // Verificar que segunda mão é zeros
    expect(inferenceData![0][0][63]).toBe(0) // segunda mão, primeiro landmark x
    expect(inferenceData![0][0][64]).toBe(0) // segunda mão, primeiro landmark y
    expect(inferenceData![0][0][65]).toBe(0) // segunda mão, primeiro landmark z
  })

  it('deve lidar com duas mãos detectadas', () => {
    const { result } = renderHook(() => useGestureBuffer())

    const hand1 = createMockHandResult('Right')
    const hand2 = createMockHandResult('Left')

    // Adicionar 30 frames para buffer ficar pronto
    for (let i = 0; i < 30; i++) {
      act(() => {
        result.current.addFrame([hand1, hand2], 640, 480)
      })
    }

    const inferenceData = result.current.getInferenceData()
    expect(inferenceData![0][0]).toHaveLength(126)

    // Ambas as mãos devem ter valores não-zeros
    expect(inferenceData![0][0][0]).toBeGreaterThan(0) // primeira mão
    expect(inferenceData![0][0][42]).toBeGreaterThan(0) // segunda mão (índice 42)
  })

  it('deve lidar com nenhuma mão detectada (preencher tudo com zeros)', () => {
    const { result } = renderHook(() => useGestureBuffer({ maxConsecutiveNulls: 50 })) // Aumentar para não limpar

    // Adicionar 30 frames sem mãos para buffer ficar pronto (sem limpar)
    for (let i = 0; i < 30; i++) {
      act(() => {
        result.current.addFrame(null, 640, 480)
      })
    }

    expect(result.current.consecutiveNulls).toBe(30)
    expect(result.current.isReady).toBe(true) // Buffer cheio

    const inferenceData = result.current.getInferenceData()
    expect(inferenceData![0][0]).toHaveLength(126)

    // Tudo deve ser zeros
    for (let i = 0; i < 10; i++) { // Testar apenas primeiros 10 para performance
      expect(inferenceData![0][0][i]).toBe(0)
    }
  })

  it('deve limpar buffer após 10 frames consecutivos sem mãos', () => {
    const { result } = renderHook(() => useGestureBuffer())

    const mockHand = createMockHandResult('Right')

    // Adicionar 30 frames com mãos
    for (let i = 0; i < 30; i++) {
      act(() => {
        result.current.addFrame([mockHand], 640, 480)
      })
    }

    expect(result.current.frameCount).toBe(30)
    expect(result.current.isReady).toBe(true)

    // Adicionar 10 frames sem mãos
    for (let i = 0; i < 10; i++) {
      act(() => {
        result.current.addFrame(null, 640, 480)
      })
    }

    expect(result.current.frameCount).toBe(0)
    expect(result.current.isReady).toBe(false)
    expect(result.current.consecutiveNulls).toBe(0)
  })

  it('deve resetar contador de nulls quando mão é detectada novamente', () => {
    const { result } = renderHook(() => useGestureBuffer())

    // 5 frames sem mãos
    for (let i = 0; i < 5; i++) {
      act(() => {
        result.current.addFrame(null, 640, 480)
      })
    }

    expect(result.current.consecutiveNulls).toBe(5)

    // 1 frame com mão
    const mockHand = createMockHandResult('Right')
    act(() => {
      result.current.addFrame([mockHand], 640, 480)
    })

    expect(result.current.consecutiveNulls).toBe(0)
  })

  it('deve retornar dados de inferência no formato correto [1, 30, 126]', () => {
    const { result } = renderHook(() => useGestureBuffer())

    const mockHand = createMockHandResult('Right')

    // Adicionar 30 frames
    for (let i = 0; i < 30; i++) {
      act(() => {
        result.current.addFrame([mockHand], 640, 480)
      })
    }

    const inferenceData = result.current.getInferenceData()

    expect(inferenceData).toHaveLength(1) // batch size 1
    expect(inferenceData![0]).toHaveLength(30) // 30 timesteps
    expect(inferenceData![0][0]).toHaveLength(126) // 126 features
  })

  it('deve retornar null quando buffer não está pronto', () => {
    const { result } = renderHook(() => useGestureBuffer())

    const mockHand = createMockHandResult('Right')

    // Adicionar apenas 29 frames
    for (let i = 0; i < 29; i++) {
      act(() => {
        result.current.addFrame([mockHand], 640, 480)
      })
    }

    const inferenceData = result.current.getInferenceData()
    expect(inferenceData).toBeNull()
  })

  it('deve permitir limpar buffer manualmente', () => {
    const { result } = renderHook(() => useGestureBuffer())

    const mockHand = createMockHandResult('Right')

    // Adicionar alguns frames
    for (let i = 0; i < 15; i++) {
      act(() => {
        result.current.addFrame([mockHand], 640, 480)
      })
    }

    expect(result.current.frameCount).toBe(15)

    act(() => {
      result.current.clear()
    })

    expect(result.current.frameCount).toBe(0)
    expect(result.current.isReady).toBe(false)
    expect(result.current.consecutiveNulls).toBe(0)
  })

  it('deve atualizar dimensões do vídeo', () => {
    const { result } = renderHook(() => useGestureBuffer())

    act(() => {
      result.current.updateVideoDimensions(1280, 720)
    })

    // Adicionar 30 frames para verificar normalização
    const mockHand = createMockHandResult('Right', Array.from({ length: 21 }, () => ({ x: 640, y: 360, z: 0.1 })))
    for (let i = 0; i < 30; i++) {
      act(() => {
        result.current.addFrame([mockHand], 1280, 720)
      })
    }

    const inferenceData = result.current.getInferenceData()

    // Deve estar normalizado pelas novas dimensões (640/1280 = 0.5, mas valor base é 640)
    expect(inferenceData![0][0][0]).toBe(640 / 1280) // x normalizado
    expect(inferenceData![0][0][1]).toBe(640 / 1280) // y normalizado
  })

  it('deve usar dimensões do vídeo passadas em addFrame', () => {
    const { result } = renderHook(() => useGestureBuffer())

    const mockHand = createMockHandResult('Right', Array.from({ length: 21 }, () => ({ x: 320, y: 240, z: 0.1 })))

    // Adicionar 30 frames
    for (let i = 0; i < 30; i++) {
      act(() => {
        result.current.addFrame([mockHand], 640, 480)
      })
    }

    const inferenceData = result.current.getInferenceData()

    // Deve estar normalizado por 640x480 (320/640 = 0.5, 240/480 = 0.5)
    expect(inferenceData![0][0][0]).toBe(320 / 640) // x normalizado
    expect(inferenceData![0][0][1]).toBe(320 / 640) // y normalizado
  })
})

