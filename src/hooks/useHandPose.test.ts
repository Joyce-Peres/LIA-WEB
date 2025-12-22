import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import type { Results } from '@mediapipe/hands'

// Mock completo do MediaPipe Hands - deve ser uma classe/função proper
vi.mock('@mediapipe/hands', () => {
  const mockInstance = {
    setOptions: vi.fn(),
    onResults: vi.fn(),
    initialize: vi.fn().mockResolvedValue(undefined),
    send: vi.fn().mockResolvedValue(undefined),
    close: vi.fn(),
  }

  // Usa function declaration para ser um construtor válido
  function MockHands() {
    return mockInstance
  }

  return {
    Hands: MockHands,
    __mockInstance: mockInstance,
  }
})

import { useHandPose } from './useHandPose'

// Acessa mock instance
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const { __mockInstance } = (await import('@mediapipe/hands')) as any

describe('useHandPose', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    __mockInstance.initialize.mockResolvedValue(undefined)
  })

  it('deve inicializar com estado padrão', () => {
    const { result } = renderHook(() => useHandPose())

    expect(result.current.results).toBeNull()
    expect(result.current.isProcessing).toBe(false)
    expect(result.current.error).toBeNull()
    expect(result.current.fps).toBe(0)
  })

  it('deve marcar isReady após inicialização', async () => {
    const { result } = renderHook(() => useHandPose())

    await waitFor(() => {
      expect(result.current.isReady).toBe(true)
    })
  })

  it('deve aplicar configurações customizadas', async () => {
    renderHook(() =>
      useHandPose({
        maxHands: 1,
        minDetectionConfidence: 0.8,
      })
    )

    await waitFor(() => {
      expect(__mockInstance.setOptions).toHaveBeenCalledWith(
        expect.objectContaining({
          maxNumHands: 1,
          minDetectionConfidence: 0.8,
        })
      )
    })
  })

  it('deve processar frame após inicialização', async () => {
    const { result } = renderHook(() => useHandPose())

    await waitFor(() => expect(result.current.isReady).toBe(true))

    const mockVideo = { readyState: 4 } as HTMLVideoElement

    await act(async () => {
      await result.current.processFrame(mockVideo)
    })

    expect(__mockInstance.send).toHaveBeenCalledWith({ image: mockVideo })
  })

  it('deve retornar null quando nenhuma mão detectada', async () => {
    const { result } = renderHook(() => useHandPose())

    await waitFor(() => expect(result.current.isReady).toBe(true))

    const onResultsCallback = __mockInstance.onResults.mock.calls[0][0]
    act(() => {
      onResultsCallback({
        multiHandLandmarks: [],
        multiHandedness: [],
        image: null,
        multiHandWorldLandmarks: [],
      } as unknown as Results)
    })

    expect(result.current.results).toBeNull()
  })

  it('deve retornar landmarks quando mão detectada', async () => {
    const { result } = renderHook(() => useHandPose())

    await waitFor(() => expect(result.current.isReady).toBe(true))

    const mockLandmarks = Array.from({ length: 21 }, (_, i) => ({
      x: i * 0.05,
      y: i * 0.05,
      z: i * 0.01,
    }))

    const onResultsCallback = __mockInstance.onResults.mock.calls[0][0]
    act(() => {
      onResultsCallback({
        multiHandLandmarks: [mockLandmarks],
        multiHandedness: [{ label: 'Right', score: 0.95 }],
      } as unknown as Results)
    })

    expect(result.current.results).toHaveLength(1)
    expect(result.current.results![0].landmarks).toHaveLength(21)
    expect(result.current.results![0].handedness).toBe('Right')
  })

  it('deve detectar duas mãos', async () => {
    const { result } = renderHook(() => useHandPose())

    await waitFor(() => expect(result.current.isReady).toBe(true))

    const mockLandmarks1 = Array.from({ length: 21 }, () => ({
      x: 0.5,
      y: 0.5,
      z: 0,
    }))

    const mockLandmarks2 = Array.from({ length: 21 }, () => ({
      x: 0.7,
      y: 0.5,
      z: 0,
    }))

    const onResultsCallback = __mockInstance.onResults.mock.calls[0][0]
    act(() => {
      onResultsCallback({
        multiHandLandmarks: [mockLandmarks1, mockLandmarks2],
        multiHandedness: [
          { label: 'Right', score: 0.95 },
          { label: 'Left', score: 0.92 },
        ],
      } as unknown as Results)
    })

    expect(result.current.results).toHaveLength(2)
    expect(result.current.results![0].handedness).toBe('Right')
    expect(result.current.results![1].handedness).toBe('Left')
  })

  it('deve tratar erro de inicialização', async () => {
    __mockInstance.initialize.mockRejectedValueOnce(new Error('Network error'))

    const { result } = renderHook(() => useHandPose())

    await waitFor(() => {
      expect(result.current.isReady).toBe(false)
      expect(result.current.error).toContain('Falha ao carregar MediaPipe Hands')
    })
  })

  it('deve fazer cleanup ao desmontar', async () => {
    const { unmount } = renderHook(() => useHandPose())

    await waitFor(() => expect(__mockInstance.initialize).toHaveBeenCalled())

    unmount()

    expect(__mockInstance.close).toHaveBeenCalled()
  })
})
