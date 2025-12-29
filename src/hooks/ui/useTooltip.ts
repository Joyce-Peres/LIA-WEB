/**
 * useTooltip Hook
 *
 * Manages tooltip state and positioning for technical feedback display.
 * Handles show/hide logic with delays and auto-dismiss functionality.
 *
 * @module hooks/ui/useTooltip
 * @category Custom Hooks
 *
 * @example
 * ```tsx
 * const {
 *   isVisible,
 *   tooltipData,
 *   tooltipPosition,
 *   handleMouseEnter,
 *   handleMouseLeave
 * } = useTooltip({ delay: 300, autoHideDelay: 2500 })
 *
 * <div
 *   onMouseEnter={handleMouseEnter({ confidence: 0.85, inferenceTime: 45 })}
 *   onMouseLeave={handleMouseLeave}
 * >
 *   Hover me for tooltip
 * </div>
 * ```
 */

import { useState, useCallback, useRef, useEffect } from 'react'

/**
 * Technical data displayed in tooltip
 */
export interface TooltipTechnicalData {
  /** Gesture name */
  gesture?: string
  /** Confidence percentage (0.0 to 1.0) */
  confidence: number
  /** Inference time in milliseconds */
  inferenceTime?: number
  /** Optional additional metrics */
  timestamp?: number
  /** Optional model version */
  modelVersion?: string
  /** Optional landmarks count */
  landmarksCount?: number
  /** Whether the prediction is correct */
  isCorrect?: boolean
}

/**
 * Configuration options for tooltip behavior
 */
export interface UseTooltipOptions {
  /** Delay before showing tooltip on hover (ms) */
  delay?: number
  /** Whether to auto-hide tooltip */
  autoHide?: boolean
  /** Delay before auto-hiding tooltip (ms) */
  autoHideDelay?: number
  /** Offset from cursor/pointer position */
  offset?: { x: number; y: number }
}

/**
 * Return type for useTooltip hook
 */
export interface UseTooltipReturn {
  /** Current tooltip data */
  tooltipData: TooltipTechnicalData | null
  /** Current tooltip position */
  tooltipPosition: { x: number; y: number }
  /** Whether tooltip is currently visible */
  isVisible: boolean
  /** Show tooltip manually */
  showTooltip: (data: TooltipTechnicalData, position: { x: number; y: number }) => void
  /** Hide tooltip manually */
  hideTooltip: () => void
  /** Mouse enter handler factory */
  handleMouseEnter: (data: TooltipTechnicalData) => (event: React.MouseEvent) => void
  /** Mouse leave handler */
  handleMouseLeave: () => void
  /** Click handler factory */
  handleClick: (data: TooltipTechnicalData) => (event: React.MouseEvent) => void
}

/**
 * Hook for managing technical tooltip state and interactions
 */
export function useTooltip(options: UseTooltipOptions = {}): UseTooltipReturn {
  const {
    delay = 300,
    autoHide = true,
    autoHideDelay = 2500,
    offset = { x: 0, y: -10 }
  } = options

  // State
  const [tooltipData, setTooltipData] = useState<TooltipTechnicalData | null>(null)
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 })
  const [isVisible, setIsVisible] = useState(false)

  // Refs for timeout management
  const showTimeoutRef = useRef<NodeJS.Timeout>()
  const hideTimeoutRef = useRef<NodeJS.Timeout>()

  /**
   * Clear all active timeouts
   */
  const clearTimeouts = useCallback(() => {
    if (showTimeoutRef.current) {
      clearTimeout(showTimeoutRef.current)
      showTimeoutRef.current = undefined
    }
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current)
      hideTimeoutRef.current = undefined
    }
  }, [])

  /**
   * Show tooltip with data and position
   */
  const showTooltip = useCallback((data: TooltipTechnicalData, position: { x: number; y: number }) => {
    // Clear existing timeouts
    clearTimeouts()

    // Update state immediately
    setTooltipData(data)
    setTooltipPosition({
      x: position.x + offset.x,
      y: position.y + offset.y
    })

    // Show tooltip after delay
    showTimeoutRef.current = setTimeout(() => {
      setIsVisible(true)

      // Auto-hide if enabled
      if (autoHide) {
        hideTimeoutRef.current = setTimeout(() => {
          hideTooltip()
        }, autoHideDelay)
      }
    }, delay)
  }, [delay, autoHide, autoHideDelay, offset, clearTimeouts])

  /**
   * Hide tooltip immediately
   */
  const hideTooltip = useCallback(() => {
    clearTimeouts()
    setIsVisible(false)
    setTooltipData(null)
  }, [clearTimeouts])

  /**
   * Create mouse enter handler for specific technical data
   */
  const handleMouseEnter = useCallback((data: TooltipTechnicalData) => (event: React.MouseEvent) => {
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
    const position = {
      x: rect.left + rect.width / 2,
      y: rect.top
    }
    showTooltip(data, position)
  }, [showTooltip])

  /**
   * Mouse leave handler
   */
  const handleMouseLeave = useCallback(() => {
    hideTooltip()
  }, [hideTooltip])

  /**
   * Create click handler for specific technical data
   */
  const handleClick = useCallback((data: TooltipTechnicalData) => (event: React.MouseEvent) => {
    event.stopPropagation()
    const position = {
      x: event.clientX,
      y: event.clientY
    }
    showTooltip(data, position)
  }, [showTooltip])

  // Cleanup on unmount
  useEffect(() => {
    return clearTimeouts
  }, [clearTimeouts])

  return {
    tooltipData,
    tooltipPosition,
    isVisible,
    showTooltip,
    hideTooltip,
    handleMouseEnter,
    handleMouseLeave,
    handleClick,
  }
}

export default useTooltip
