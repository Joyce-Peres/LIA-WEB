 
/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useModelInference } from './useModelInference'
import * as tf from '@tensorflow/tfjs'

// Mock do TensorFlow.js
vi.mock('@tensorflow/tfjs', () => ({
  loadLayersModel: vi.fn(),
  tensor: vi.fn(),
  zeros: vi.fn(),
}))

// Mock do modelo TensorFlow
 
const mockModel = {
  inputs: [{ shape: [1, 30, 126] }],
  outputs: [{ shape: [1, 61] }],
  predict: vi.fn(),
} as any

 
const mockTensor = {
  data: vi.fn(),
  dispose: vi.fn(),
} as any

const mockPredictions = new Float32Array(61)
// Simular predições onde classe 10 tem maior probabilidade
mockPredictions.fill(0.01)
mockPredictions[10] = 0.95

describe('useModelInference', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Setup default mocks
    vi.mocked(tf.loadLayersModel).mockResolvedValue(mockModel)
    vi.mocked(tf.tensor).mockReturnValue(mockTensor)
    vi.mocked(tf.zeros).mockReturnValue(mockTensor)
    mockTensor.data.mockResolvedValue(mockPredictions)
    mockModel.predict.mockReturnValue(mockTensor)
  })

  afterEach(() => {
    vi.clearAllTimers()
  })

  it('deve inicializar com estado padrão', () => {
    const { result } = renderHook(() => useModelInference())

    expect(result.current.isLoading).toBe(false)
    expect(result.current.isReady).toBe(false)
    expect(result.current.error).toBeNull()
    expect(result.current.lastInferenceTime).toBe(0)
    expect(result.current.modelLoaded).toBe(false)
    expect(typeof result.current.loadModel).toBe('function')
    expect(typeof result.current.runInference).toBe('function')
  })

  it('deve carregar modelo com sucesso', async () => {
    const { result } = renderHook(() => useModelInference())

    await act(async () => {
      await result.current.loadModel()
    })

    expect(tf.loadLayersModel).toHaveBeenCalledWith('/models/model.json')
    expect(result.current.isLoading).toBe(false)
    expect(result.current.isReady).toBe(true)
    expect(result.current.modelLoaded).toBe(true)
    expect(result.current.error).toBeNull()
  })


  it('deve executar inferência com dados válidos', async () => {
    const { result } = renderHook(() => useModelInference())

    // Carregar modelo primeiro
    await act(async () => {
      await result.current.loadModel()
    })

    // Criar buffer mock [1, 30, 126]
    const mockBuffer = Array.from({ length: 1 }, () =>
      Array.from({ length: 30 }, () =>
        Array.from({ length: 126 }, () => Math.random())
      )
    )

    let inferenceResult: Awaited<ReturnType<typeof result.current.runInference>> = null
    await act(async () => {
      inferenceResult = await result.current.runInference(mockBuffer)
    })

    expect(tf.tensor).toHaveBeenCalledWith(mockBuffer, [1, 30, 126], 'float32')
    expect(mockModel.predict).toHaveBeenCalled()
    expect(mockTensor.dispose).toHaveBeenCalled() // pelo menos uma vez

    expect(inferenceResult).not.toBeNull()
    expect(inferenceResult!.predictions).toHaveLength(61)
    expect(inferenceResult!.predictedClass).toBe(10) // classe com maior probabilidade
    expect(inferenceResult!.confidence).toBeCloseTo(0.95, 2)
    expect(inferenceResult!.inferenceTime).toBeGreaterThan(0)
    expect(result.current.lastInferenceTime).toBe(inferenceResult!.inferenceTime)
  })

  it('deve carregar modelo automaticamente na primeira inferência', async () => {
    const { result } = renderHook(() => useModelInference())

    const mockBuffer = Array.from({ length: 1 }, () =>
      Array.from({ length: 30 }, () =>
        Array.from({ length: 126 }, () => 0.1)
      )
    )

    await act(async () => {
      await result.current.runInference(mockBuffer)
    })

    expect(tf.loadLayersModel).toHaveBeenCalledWith('/models/model.json')
    expect(result.current.modelLoaded).toBe(true)
  })

  it('deve validar shape do buffer', async () => {
    const { result } = renderHook(() => useModelInference())

    // Carregar modelo
    await act(async () => {
      await result.current.loadModel()
    })

    // Buffer com shape errado
    const invalidBuffer = Array.from({ length: 2 }, () => // batch size errado
      Array.from({ length: 30 }, () =>
        Array.from({ length: 126 }, () => 0.1)
      )
    )

    await act(async () => {
      await result.current.runInference(invalidBuffer)
    })

    expect(result.current.error).toContain('Formato de dados inválido')
  })

  it('deve tratar erro de carregamento de modelo', async () => {
    const loadError = new Error('Network error')
    vi.mocked(tf.loadLayersModel).mockRejectedValue(loadError)

    const { result } = renderHook(() => useModelInference())

    await act(async () => {
      await result.current.loadModel()
    })

    expect(result.current.isLoading).toBe(false)
    expect(result.current.isReady).toBe(false)
    expect(result.current.error).toContain('Erro no modelo')
  })

  it('deve tratar erro de inferência', async () => {
    const inferenceError = new Error('Memory exhausted')
    mockModel.predict.mockImplementation(() => {
      throw inferenceError
    })

    const { result } = renderHook(() => useModelInference())

    // Carregar modelo
    await act(async () => {
      await result.current.loadModel()
    })

    const mockBuffer = Array.from({ length: 1 }, () =>
      Array.from({ length: 30 }, () =>
        Array.from({ length: 126 }, () => 0.1)
      )
    )

    await act(async () => {
      await result.current.runInference(mockBuffer)
    })

    expect(result.current.error).toContain('Erro de inferência')
  })

  it('deve retornar null se modelo não estiver pronto', async () => {
    const { result } = renderHook(() => useModelInference())

    // Não carregar modelo
    const mockBuffer = Array.from({ length: 1 }, () =>
      Array.from({ length: 30 }, () =>
        Array.from({ length: 126 }, () => 0.1)
      )
    )

    let inferenceResult: Awaited<ReturnType<typeof result.current.runInference>> = null
    await act(async () => {
      inferenceResult = await result.current.runInference(mockBuffer)
    })

    expect(inferenceResult).toBeNull()
  })

  it('deve usar caminho customizado para o modelo', async () => {
    const { result } = renderHook(() =>
      useModelInference({ modelPath: '/custom/model.json' })
    )

    await act(async () => {
      await result.current.loadModel()
    })

    expect(tf.loadLayersModel).toHaveBeenCalledWith('/custom/model.json')
  })


  it('deve validar modelo carregado', async () => {
    // Modelo sem inputs
     
    const invalidModel = { outputs: [{ shape: [1, 61] }] } as any
    vi.mocked(tf.loadLayersModel).mockResolvedValue(invalidModel)

    const { result } = renderHook(() => useModelInference())

    await act(async () => {
      await result.current.loadModel()
    })

    expect(result.current.error).toContain('não tem entradas definidas')
    expect(result.current.isReady).toBe(false)
  })
})

