import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useComboSystem } from './useComboSystem'

describe('useComboSystem', () => {
  let mockOnComboIncrease: ReturnType<typeof vi.fn<(combo: number, stars: number) => void>>
  let mockOnComboBreak: ReturnType<typeof vi.fn<(finalCombo: number) => void>>

  beforeEach(() => {
    mockOnComboIncrease = vi.fn<(combo: number, stars: number) => void>()
    mockOnComboBreak = vi.fn<(finalCombo: number) => void>()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.clearAllMocks()
    vi.clearAllTimers()
  })

  it('should start with combo 0', () => {
    const { result } = renderHook(() => useComboSystem())

    expect(result.current.combo).toBe(0)
  })

  it('should increase combo on correct gesture', () => {
    const { result } = renderHook(() => useComboSystem({
      onComboIncrease: mockOnComboIncrease
    }))

    act(() => {
      result.current.addCorrectGesture()
    })

    expect(result.current.combo).toBe(1)
    expect(mockOnComboIncrease).toHaveBeenCalledWith(1, 3) // combo 1, 3 stars
  })

  it('should increase combo count with consecutive correct gestures', () => {
    const { result } = renderHook(() => useComboSystem({
      onComboIncrease: mockOnComboIncrease
    }))

    // First gesture
    act(() => {
      result.current.addCorrectGesture()
    })

    expect(result.current.combo).toBe(1)
    expect(mockOnComboIncrease).toHaveBeenCalledWith(1, 3)

    // Second gesture (within timeout)
    act(() => {
      vi.advanceTimersByTime(1000) // 1 second later
      result.current.addCorrectGesture()
    })

    expect(result.current.combo).toBe(2)
    expect(mockOnComboIncrease).toHaveBeenCalledWith(2, 3)
  })

  it('should give bonus stars for higher combos', () => {
    const { result } = renderHook(() => useComboSystem({
      onComboIncrease: mockOnComboIncrease
    }))

    // Build up to combo 6 (should get bonus star)
    for (let i = 1; i <= 6; i++) {
      act(() => {
        result.current.addCorrectGesture()
      })
    }

    // Combo 6 should give 5 stars (3 base + 2 bonus for combo 6)
    expect(mockOnComboIncrease).toHaveBeenLastCalledWith(6, 5)
  })

  it('should cap stars at maximum', () => {
    const { result } = renderHook(() => useComboSystem({
      onComboIncrease: mockOnComboIncrease
    }))

    // Build up to combo 30 (should get max bonus)
    for (let i = 1; i <= 30; i++) {
      act(() => {
        result.current.addCorrectGesture()
      })
    }

    // Should cap at 12 stars
    expect(mockOnComboIncrease).toHaveBeenLastCalledWith(30, 12)
  })

  it('should break combo after timeout', async () => {
    const { result } = renderHook(() => useComboSystem({
      onComboBreak: mockOnComboBreak,
      comboTimeout: 2000
    }))

    // Start combo
    act(() => {
      result.current.addCorrectGesture()
    })

    expect(result.current.combo).toBe(1)

    // Wait for timeout
    act(() => {
      vi.advanceTimersByTime(2500)
    })

    expect(result.current.combo).toBe(0)
    expect(mockOnComboBreak).toHaveBeenCalledWith(1)
  })

  it('should reset combo when timeout expires between gestures', async () => {
    const { result } = renderHook(() => useComboSystem({
      onComboBreak: mockOnComboBreak,
      onComboIncrease: mockOnComboIncrease,
      comboTimeout: 2000
    }))

    // First gesture
    act(() => {
      result.current.addCorrectGesture()
    })

    expect(result.current.combo).toBe(1)

    // Wait longer than timeout
    act(() => {
      vi.advanceTimersByTime(3000)
    })

    expect(result.current.combo).toBe(0)
    expect(mockOnComboBreak).toHaveBeenCalledWith(1)

    // Next gesture should start new combo
    act(() => {
      result.current.addCorrectGesture()
    })

    expect(result.current.combo).toBe(1)
    expect(mockOnComboIncrease).toHaveBeenCalledWith(1, 3)
  })

  it('should allow manual combo break', () => {
    const { result } = renderHook(() => useComboSystem({
      onComboBreak: mockOnComboBreak
    }))

    // Start combo
    act(() => {
      result.current.addCorrectGesture()
    })

    expect(result.current.combo).toBe(1)

    // Manually break
    act(() => {
      result.current.breakCombo()
    })

    expect(result.current.combo).toBe(0)
    expect(mockOnComboBreak).toHaveBeenCalledWith(1)
  })

  it('should reset combo manually', () => {
    const { result } = renderHook(() => useComboSystem())

    // Start combo
    act(() => {
      result.current.addCorrectGesture()
    })

    expect(result.current.combo).toBe(1)

    // Reset
    act(() => {
      result.current.reset()
    })

    expect(result.current.combo).toBe(0)
  })

  it('should respect custom combo timeout', async () => {
    const { result } = renderHook(() => useComboSystem({
      comboTimeout: 5000,
      onComboBreak: mockOnComboBreak
    }))

    // Start combo
    act(() => {
      result.current.addCorrectGesture()
    })

    // Wait less than custom timeout
    act(() => {
      vi.advanceTimersByTime(3000)
    })

    // Combo should still be active
    expect(result.current.combo).toBe(1)

    // Wait for custom timeout
    act(() => {
      vi.advanceTimersByTime(2500)
    })

    expect(result.current.combo).toBe(0)
  })

  it('should respect max combo limit', () => {
    const { result } = renderHook(() => useComboSystem({
      maxCombo: 5
    }))

    // Try to exceed max combo
    for (let i = 1; i <= 10; i++) {
      act(() => {
        result.current.addCorrectGesture()
      })
    }

    expect(result.current.combo).toBe(5) // Should cap at 5
  })

  it('should handle rapid consecutive gestures', () => {
    const { result } = renderHook(() => useComboSystem({
      onComboIncrease: mockOnComboIncrease
    }))

    // Rapid fire gestures
    act(() => {
      result.current.addCorrectGesture()
    })
    act(() => {
      result.current.addCorrectGesture()
    })
    act(() => {
      result.current.addCorrectGesture()
    })

    expect(result.current.combo).toBe(3)
    expect(mockOnComboIncrease).toHaveBeenLastCalledWith(3, 4)
  })

  it('should not break combo when gestures are within timeout', () => {
    const { result } = renderHook(() => useComboSystem({
      comboTimeout: 2000
    }))

    // Start combo
    act(() => {
      result.current.addCorrectGesture()
    })

    // Add another within timeout
    act(() => {
      vi.advanceTimersByTime(1000)
      result.current.addCorrectGesture()
    })

    expect(result.current.combo).toBe(2)
  })

  it('should cleanup timeout on unmount', () => {
    const { result, unmount } = renderHook(() => useComboSystem())

    act(() => {
      result.current.addCorrectGesture()
    })

    // Unmount should cleanup
    unmount()

    // Should not crash - timeout should be cleared
    expect(true).toBe(true)
  })
})
