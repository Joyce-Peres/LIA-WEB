import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useGesturePostProcessing } from './useGesturePostProcessing'
import type { InferenceResult } from './useModelInference'

// Mock de InferenceResult
const createMockInferenceResult = (
  predictedClass: number,
  confidence: number,
  predictions?: number[]
): InferenceResult => ({
  predictions: predictions || Array.from({ length: 61 }, (_, i) => i === predictedClass ? confidence : 0.01),
  predictedClass,
  confidence,
  inferenceTime: 15,
})

describe('useGesturePostProcessing', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('deve inicializar com estado padrão', () => {
    const { result } = renderHook(() => useGesturePostProcessing())

    expect(result.current.currentPrediction).toBeNull()
    expect(result.current.isDebouncing).toBe(false)
    expect(result.current.debounceProgress).toBe(0)
    expect(result.current.lastRawPrediction).toBeNull()
    expect(typeof result.current.processPrediction).toBe('function')
    expect(typeof result.current.reset).toBe('function')
    expect(typeof result.current.getStablePrediction).toBe('function')
  })

  it('deve aceitar configuração customizada', () => {
    const { result } = renderHook(() =>
      useGesturePostProcessing({
        confidenceThreshold: 0.9,
        debounceFrames: 3,
      })
    )

    expect(result.current.currentPrediction).toBeNull()
    // Configuração testada indiretamente nos testes abaixo
  })

  it('deve rejeitar predições com confiança abaixo do threshold', () => {
    const { result } = renderHook(() => useGesturePostProcessing())

    const lowConfidencePrediction = createMockInferenceResult(10, 0.7) // Below 0.85 default

    act(() => {
      const stableResult = result.current.processPrediction(lowConfidencePrediction)
      expect(stableResult).toBeNull()
    })

    expect(result.current.currentPrediction).toBeNull()
    expect(result.current.isDebouncing).toBe(false)
    expect(result.current.debounceProgress).toBe(0)
  })

  it('deve aceitar predições com confiança acima do threshold', () => {
    const { result } = renderHook(() => useGesturePostProcessing())

    const highConfidencePrediction = createMockInferenceResult(10, 0.9) // Above 0.85

    // Primeiro frame - inicia debounce
    act(() => {
      const stableResult = result.current.processPrediction(highConfidencePrediction)
      expect(stableResult).toBeNull()
    })

    expect(result.current.isDebouncing).toBe(true)
    expect(result.current.debounceProgress).toBe(1)
    expect(result.current.currentPrediction).toBeNull()
  })

  it('deve requerer 5 frames consecutivos para aceitar predição (debounce)', () => {
    const { result } = renderHook(() => useGesturePostProcessing())

    const prediction = createMockInferenceResult(10, 0.9)

    // Frames 1-4: deve retornar null
    for (let i = 1; i <= 4; i++) {
      act(() => {
        const stableResult = result.current.processPrediction(prediction)
        expect(stableResult).toBeNull()
      })
      expect(result.current.isDebouncing).toBe(true)
      expect(result.current.debounceProgress).toBe(i)
    }

    // Frame 5: deve aceitar a predição
    act(() => {
      const stableResult = result.current.processPrediction(prediction)
      expect(stableResult).not.toBeNull()
      expect(stableResult!.gestureClass).toBe(10)
      expect(stableResult!.confidence).toBe(0.9)
      expect(stableResult!.stableFrames).toBe(5)
    })

    expect(result.current.isDebouncing).toBe(false)
    expect(result.current.debounceProgress).toBe(0)
    expect(result.current.currentPrediction).not.toBeNull()
    expect(result.current.currentPrediction!.gestureClass).toBe(10)
  })

  it('deve resetar debounce quando predição muda', () => {
    const { result } = renderHook(() => useGesturePostProcessing())

    const prediction1 = createMockInferenceResult(10, 0.9)
    const prediction2 = createMockInferenceResult(20, 0.9)

    // 3 frames com gesto 10
    for (let i = 0; i < 3; i++) {
      act(() => {
        result.current.processPrediction(prediction1)
      })
    }
    expect(result.current.debounceProgress).toBe(3)

    // 1 frame com gesto 20 - deve resetar
    act(() => {
      result.current.processPrediction(prediction2)
    })
    expect(result.current.debounceProgress).toBe(1) // Resetado para 1
    expect(result.current.isDebouncing).toBe(true)
  })

  it('deve resetar debounce quando confiança cai abaixo do threshold', () => {
    const { result } = renderHook(() => useGesturePostProcessing())

    const highConfidence = createMockInferenceResult(10, 0.9)
    const lowConfidence = createMockInferenceResult(10, 0.7)

    // 3 frames com alta confiança
    for (let i = 0; i < 3; i++) {
      act(() => {
        result.current.processPrediction(highConfidence)
      })
    }
    expect(result.current.debounceProgress).toBe(3)

    // 1 frame com baixa confiança - deve resetar
    act(() => {
      result.current.processPrediction(lowConfidence)
    })
    expect(result.current.debounceProgress).toBe(0) // Resetado
    expect(result.current.isDebouncing).toBe(false)
  })

  it('deve lidar com predições null', () => {
    const { result } = renderHook(() => useGesturePostProcessing())

    const prediction = createMockInferenceResult(10, 0.9)

    // 2 frames válidas
    for (let i = 0; i < 2; i++) {
      act(() => {
        result.current.processPrediction(prediction)
      })
    }
    expect(result.current.debounceProgress).toBe(2)

    // Predição null - deve resetar
    act(() => {
      result.current.processPrediction(null)
    })
    expect(result.current.debounceProgress).toBe(0)
    expect(result.current.isDebouncing).toBe(false)
  })

  it('deve manter predição estável até ser substituída', () => {
    const { result } = renderHook(() => useGesturePostProcessing())

    const prediction1 = createMockInferenceResult(10, 0.9)
    const prediction2 = createMockInferenceResult(20, 0.9)

    // Completar debounce para gesto 10
    for (let i = 0; i < 5; i++) {
      act(() => {
        result.current.processPrediction(prediction1)
      })
    }

    expect(result.current.currentPrediction!.gestureClass).toBe(10)

    // Mesmo após frames adicionais com o mesmo gesto, mantém a predição
    act(() => {
      result.current.processPrediction(prediction1)
    })
    expect(result.current.currentPrediction!.gestureClass).toBe(10)

    // Quando muda para gesto diferente, deve iniciar novo debounce
    act(() => {
      result.current.processPrediction(prediction2)
    })
    expect(result.current.isDebouncing).toBe(true)
    expect(result.current.debounceProgress).toBe(1)
    // Mas ainda mantém a predição anterior estável
    expect(result.current.currentPrediction!.gestureClass).toBe(10)
  })

  it('deve permitir configuração customizada de threshold', () => {
    const { result } = renderHook(() =>
      useGesturePostProcessing({ confidenceThreshold: 0.7 })
    )

    const mediumConfidence = createMockInferenceResult(10, 0.75) // Above 0.7

    act(() => {
      const stableResult = result.current.processPrediction(mediumConfidence)
      expect(stableResult).toBeNull() // Ainda null pois precisa de 5 frames
    })

    expect(result.current.isDebouncing).toBe(true)
    expect(result.current.debounceProgress).toBe(1)
  })

  it('deve permitir configuração customizada de debounce frames', () => {
    const { result } = renderHook(() =>
      useGesturePostProcessing({ debounceFrames: 3 })
    )

    const prediction = createMockInferenceResult(10, 0.9)

    // Frames 1-2: deve retornar null
    for (let i = 1; i <= 2; i++) {
      act(() => {
        result.current.processPrediction(prediction)
      })
      expect(result.current.debounceProgress).toBe(i)
    }

    // Frame 3: deve aceitar a predição
    act(() => {
      const stableResult = result.current.processPrediction(prediction)
      expect(stableResult).not.toBeNull()
      expect(stableResult!.gestureClass).toBe(10)
    })

    expect(result.current.isDebouncing).toBe(false)
    expect(result.current.debounceProgress).toBe(0)
  })

  it('deve resetar completamente o estado', () => {
    const { result } = renderHook(() => useGesturePostProcessing())

    const prediction = createMockInferenceResult(10, 0.9)

    // Construir algum estado
    for (let i = 0; i < 3; i++) {
      act(() => {
        result.current.processPrediction(prediction)
      })
    }

    expect(result.current.isDebouncing).toBe(true)
    expect(result.current.debounceProgress).toBe(3)
    expect(result.current.lastRawPrediction).not.toBeNull()

    // Reset
    act(() => {
      result.current.reset()
    })

    expect(result.current.isDebouncing).toBe(false)
    expect(result.current.debounceProgress).toBe(0)
    expect(result.current.currentPrediction).toBeNull()
    expect(result.current.lastRawPrediction).toBeNull()
  })

  it('deve retornar predição estável atual via getter', () => {
    const { result } = renderHook(() => useGesturePostProcessing())

    expect(result.current.getStablePrediction()).toBeNull()

    const prediction = createMockInferenceResult(10, 0.9)

    // Completar debounce
    for (let i = 0; i < 5; i++) {
      act(() => {
        result.current.processPrediction(prediction)
      })
    }

    const stablePrediction = result.current.getStablePrediction()
    expect(stablePrediction).not.toBeNull()
    expect(stablePrediction!.gestureClass).toBe(10)
    expect(stablePrediction!.confidence).toBe(0.9)
  })

  it('deve incluir timestamp na predição estável', () => {
    const { result } = renderHook(() => useGesturePostProcessing())

    const prediction = createMockInferenceResult(10, 0.9)
    const beforeTime = Date.now()

    // Completar debounce
    for (let i = 0; i < 5; i++) {
      act(() => {
        result.current.processPrediction(prediction)
      })
    }

    const afterTime = Date.now()
    const stablePrediction = result.current.currentPrediction!

    expect(stablePrediction.lastUpdated).toBeGreaterThanOrEqual(beforeTime)
    expect(stablePrediction.lastUpdated).toBeLessThanOrEqual(afterTime)
  })
})

