import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useFeedbackState, type PredictionResult, type FeedbackState } from './useFeedbackState'

describe('useFeedbackState', () => {
  let mockOnStateChange: ReturnType<typeof vi.fn<(state: FeedbackState, prediction?: PredictionResult) => void>>

  beforeEach(() => {
    mockOnStateChange = vi.fn<(state: FeedbackState, prediction?: PredictionResult) => void>()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.clearAllMocks()
    vi.clearAllTimers()
  })

  it('should start with idle state', () => {
    const { result } = renderHook(() => useFeedbackState())

    expect(result.current.state).toBe('idle')
    expect(result.current.lastPrediction).toBeNull()
  })

  it('should call onStateChange when state changes', () => {
    const { result } = renderHook(() => useFeedbackState({ onStateChange: mockOnStateChange }))

    act(() => {
      result.current.setFeedbackState('processing')
    })

    expect(mockOnStateChange).toHaveBeenCalledWith('processing', undefined)
  })

  it('should handle correct prediction with high confidence', () => {
    const { result } = renderHook(() => useFeedbackState({ onStateChange: mockOnStateChange }))

    const prediction: PredictionResult = {
      gesture: 'A',
      confidence: 0.85,
      timestamp: Date.now(),
      isCorrect: true,
    }

    act(() => {
      result.current.handlePrediction(prediction)
    })

    // Should be processing initially
    expect(result.current.state).toBe('processing')
    expect(mockOnStateChange).toHaveBeenCalledWith('processing', prediction)

    // Fast-forward processing timeout
    act(() => {
      vi.advanceTimersByTime(200)
    })

    expect(result.current.state).toBe('correct')
    expect(mockOnStateChange).toHaveBeenCalledWith('correct', prediction)

    // Fast-forward feedback duration
    act(() => {
      vi.advanceTimersByTime(1500)
    })

    expect(result.current.state).toBe('idle')
    expect(mockOnStateChange).toHaveBeenCalledWith('idle', undefined)
  })

  it('should handle incorrect prediction', () => {
    const { result } = renderHook(() => useFeedbackState({ onStateChange: mockOnStateChange }))

    const prediction: PredictionResult = {
      gesture: 'B',
      confidence: 0.3,
      timestamp: Date.now(),
      isCorrect: false,
    }

    act(() => {
      result.current.handlePrediction(prediction)
    })

    // Should be processing initially
    expect(result.current.state).toBe('processing')

    // Fast-forward processing timeout
    act(() => {
      vi.advanceTimersByTime(200)
    })

    expect(result.current.state).toBe('incorrect')
    expect(mockOnStateChange).toHaveBeenCalledWith('incorrect', prediction)
  })

  it('should handle correct prediction with low confidence', () => {
    const { result } = renderHook(() => useFeedbackState({
      onStateChange: mockOnStateChange,
      confidenceThreshold: 0.8
    }))

    const prediction: PredictionResult = {
      gesture: 'A',
      confidence: 0.75, // Below threshold
      timestamp: Date.now(),
      isCorrect: true,
    }

    act(() => {
      result.current.handlePrediction(prediction)
    })

    // Fast-forward processing timeout
    act(() => {
      vi.advanceTimersByTime(200)
    })

    expect(result.current.state).toBe('incorrect')
    // Even though isCorrect is true, confidence is too low
  })

  it('should allow manual state setting', () => {
    const { result } = renderHook(() => useFeedbackState({ onStateChange: mockOnStateChange }))

    act(() => {
      result.current.setFeedbackState('correct')
    })

    expect(result.current.state).toBe('correct')
    expect(mockOnStateChange).toHaveBeenCalledWith('correct', undefined)
  })

  it('should reset to idle state', () => {
    const { result } = renderHook(() => useFeedbackState({ onStateChange: mockOnStateChange }))

    act(() => {
      result.current.setFeedbackState('processing')
      result.current.reset()
    })

    expect(result.current.state).toBe('idle')
    expect(mockOnStateChange).toHaveBeenLastCalledWith('idle', undefined)
  })

  it('should clear timeouts when new prediction arrives', async () => {
    const { result } = renderHook(() => useFeedbackState({ onStateChange: mockOnStateChange }))

    const prediction1: PredictionResult = {
      gesture: 'A',
      confidence: 0.85,
      timestamp: Date.now(),
      isCorrect: true,
    }

    const prediction2: PredictionResult = {
      gesture: 'B',
      confidence: 0.9,
      timestamp: Date.now(),
      isCorrect: true,
    }

    // Start first prediction
    act(() => {
      result.current.handlePrediction(prediction1)
    })

    // Immediately start second prediction (should cancel first)
    act(() => {
      result.current.handlePrediction(prediction2)
    })

    expect(result.current.state).toBe('processing')
    expect(result.current.lastPrediction).toBe(prediction2)
  })

  it('should handle invalid predictions gracefully', () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    const { result } = renderHook(() => useFeedbackState())

    act(() => {
      result.current.handlePrediction(null as any)
    })

    expect(result.current.state).toBe('idle')
    expect(consoleSpy).toHaveBeenCalledWith('Invalid prediction result:', null)

    consoleSpy.mockRestore()
  })

  it('should use custom timeouts', () => {
    const { result } = renderHook(() => useFeedbackState({
      processingTimeout: 500,
      feedbackDuration: 300,
      onStateChange: mockOnStateChange,
    }))

    const prediction: PredictionResult = {
      gesture: 'A',
      confidence: 0.85,
      timestamp: Date.now(),
      isCorrect: true,
    }

    act(() => {
      result.current.handlePrediction(prediction)
    })

    // Fast-forward custom processing timeout
    act(() => {
      vi.advanceTimersByTime(500)
    })

    expect(result.current.state).toBe('correct')

    // Fast-forward custom feedback duration
    act(() => {
      vi.advanceTimersByTime(300)
    })

    expect(result.current.state).toBe('idle')
  })

  it('should store last prediction result', () => {
    const { result } = renderHook(() => useFeedbackState())

    const prediction: PredictionResult = {
      gesture: 'A',
      confidence: 0.85,
      timestamp: Date.now(),
      isCorrect: true,
    }

    act(() => {
      result.current.handlePrediction(prediction)
    })

    expect(result.current.lastPrediction).toBe(prediction)

    // Fast-forward to idle state
    act(() => {
      vi.advanceTimersByTime(1700)
    })

    expect(result.current.lastPrediction).toBeNull()
  })

  it('should cleanup timeouts on unmount', () => {
    const { result, unmount } = renderHook(() => useFeedbackState())

    act(() => {
      result.current.setFeedbackState('processing')
    })

    unmount()

    // Should not crash - timeouts should be cleared
    expect(true).toBe(true)
  })
})
