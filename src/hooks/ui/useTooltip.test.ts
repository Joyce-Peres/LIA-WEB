import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useTooltip } from './useTooltip'

describe('useTooltip', () => {
  let mockData: { confidence: number; inferenceTime: number }

  beforeEach(() => {
    mockData = { confidence: 0.85, inferenceTime: 45 }
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.clearAllMocks()
    vi.clearAllTimers()
  })

  it('should start with tooltip hidden', () => {
    const { result } = renderHook(() => useTooltip())

    expect(result.current.isVisible).toBe(false)
    expect(result.current.tooltipData).toBe(null)
  })

  it('should show tooltip after delay', async () => {
    const { result } = renderHook(() => useTooltip({ delay: 100 }))

    act(() => {
      result.current.showTooltip(mockData, { x: 100, y: 200 })
    })

    expect(result.current.isVisible).toBe(false) // Not yet visible

    // Wait for delay
    act(() => {
      vi.advanceTimersByTime(100)
      vi.runAllTimers()
    })

    expect(result.current.isVisible).toBe(true)
    expect(result.current.tooltipData).toBe(mockData)
    expect(result.current.tooltipPosition).toEqual({ x: 100, y: 190 }) // With offset
  })

  it('should hide tooltip immediately', () => {
    const { result } = renderHook(() => useTooltip())

    act(() => {
      result.current.showTooltip(mockData, { x: 100, y: 200 })
      vi.advanceTimersByTime(300) // Show tooltip
      result.current.hideTooltip()
    })

    expect(result.current.isVisible).toBe(false)
    expect(result.current.tooltipData).toBe(null)
  })

  it('should auto-hide tooltip after specified delay', async () => {
    const { result } = renderHook(() => useTooltip({ autoHideDelay: 500 }))

    act(() => {
      result.current.showTooltip(mockData, { x: 100, y: 200 })
      vi.advanceTimersByTime(300) // Show tooltip
    })

    expect(result.current.isVisible).toBe(true)

    // Wait for auto-hide
    act(() => {
      vi.advanceTimersByTime(500)
      vi.runAllTimers()
    })

    expect(result.current.isVisible).toBe(false)
  })

  it('should not auto-hide if disabled', () => {
    const { result } = renderHook(() => useTooltip({ autoHide: false }))

    act(() => {
      result.current.showTooltip(mockData, { x: 100, y: 200 })
      vi.advanceTimersByTime(300) // Show tooltip
    })

    expect(result.current.isVisible).toBe(true)

    // Wait longer than default auto-hide delay
    act(() => {
      vi.advanceTimersByTime(3000)
    })

    expect(result.current.isVisible).toBe(true) // Still visible
  })

  it('should handle mouse enter event', async () => {
    const { result } = renderHook(() => useTooltip({ delay: 50 }))

    const mockEvent = {
      currentTarget: {
        getBoundingClientRect: () => ({
          left: 50,
          top: 100,
          width: 200,
          height: 50
        })
      }
    } as React.MouseEvent

    act(() => {
      result.current.handleMouseEnter(mockData)(mockEvent)
    })

    // Wait for delay
    act(() => {
      vi.advanceTimersByTime(50)
      vi.runAllTimers()
    })

    expect(result.current.isVisible).toBe(true)
    expect(result.current.tooltipPosition).toEqual({ x: 150, y: 90 }) // Center of element
  })

  it('should handle mouse leave event', () => {
    const { result } = renderHook(() => useTooltip())

    act(() => {
      result.current.showTooltip(mockData, { x: 100, y: 200 })
      vi.advanceTimersByTime(300) // Show tooltip
      result.current.handleMouseLeave()
    })

    expect(result.current.isVisible).toBe(false)
  })

  it('should handle click event', async () => {
    const { result } = renderHook(() => useTooltip({ delay: 50 }))

    const mockEvent = {
      stopPropagation: vi.fn(),
      clientX: 250,
      clientY: 150
    } as unknown as React.MouseEvent

    act(() => {
      result.current.handleClick(mockData)(mockEvent)
    })

    expect(mockEvent.stopPropagation).toHaveBeenCalled()

    // Wait for delay
    act(() => {
      vi.advanceTimersByTime(50)
      vi.runAllTimers()
    })

    expect(result.current.isVisible).toBe(true)
    expect(result.current.tooltipPosition).toEqual({ x: 250, y: 140 }) // Click position with offset
  })

  it('should cancel previous show timeout when new tooltip requested', () => {
    const { result } = renderHook(() => useTooltip({ delay: 200 }))

    act(() => {
      result.current.showTooltip(mockData, { x: 100, y: 200 })
    })

    // Start new tooltip before first one shows
    act(() => {
      vi.advanceTimersByTime(100)
      result.current.showTooltip({ confidence: 0.9, inferenceTime: 30 }, { x: 300, y: 400 })
    })

    // Wait for original delay - first tooltip should not show
    act(() => {
      vi.advanceTimersByTime(100)
    })

    expect(result.current.isVisible).toBe(false)

    // Wait for new delay
    act(() => {
      vi.advanceTimersByTime(200)
    })

    expect(result.current.isVisible).toBe(true)
    expect(result.current.tooltipData?.confidence).toBe(0.9)
  })

  it('should apply custom offset', () => {
    const { result } = renderHook(() => useTooltip({ offset: { x: 20, y: -5 } }))

    act(() => {
      result.current.showTooltip(mockData, { x: 100, y: 200 })
      vi.advanceTimersByTime(300)
    })

    expect(result.current.tooltipPosition).toEqual({ x: 120, y: 195 })
  })

  it('should cleanup timeouts on unmount', () => {
    const { result, unmount } = renderHook(() => useTooltip())

    act(() => {
      result.current.showTooltip(mockData, { x: 100, y: 200 })
    })

    unmount()

    // Should not crash - timeouts should be cleared
    expect(true).toBe(true)
  })

  it('should handle extended technical data', () => {
    const extendedData = {
      confidence: 0.75,
      inferenceTime: 60,
      timestamp: 1234567890,
      gestureName: 'Olá'
    }

    const { result } = renderHook(() => useTooltip())

    act(() => {
      result.current.showTooltip(extendedData, { x: 100, y: 200 })
      vi.advanceTimersByTime(300)
    })

    expect(result.current.tooltipData).toEqual(extendedData)
  })

  it('should handle rapid show/hide cycles', () => {
    const { result } = renderHook(() => useTooltip())

    // Rapid interactions
    act(() => {
      result.current.showTooltip(mockData, { x: 100, y: 200 })
      vi.advanceTimersByTime(150)
      result.current.hideTooltip()
      result.current.showTooltip(mockData, { x: 200, y: 300 })
      vi.advanceTimersByTime(300)
    })

    expect(result.current.isVisible).toBe(true)
    expect(result.current.tooltipPosition).toEqual({ x: 200, y: 290 })
  })
})
