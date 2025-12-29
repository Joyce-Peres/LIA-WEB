/**
 * useComboSystem Hook
 *
 * Manages combo system for consecutive correct gestures in practice mode.
 * Tracks combo count, calculates star rewards, and handles combo timeouts.
 *
 * @module hooks/feedback/useComboSystem
 * @category Custom Hooks
 *
 * @example
 * ```tsx
 * const { combo, addCorrectGesture, breakCombo } = useComboSystem({
 *   onComboIncrease: (combo, stars) => spawnStars(stars),
 *   onComboBreak: (finalCombo) => showBreakEffect(finalCombo),
 * })
 *
 * // Call when gesture is correct
 * addCorrectGesture()
 * ```
 */

import { useState, useCallback, useRef, useEffect } from 'react'

/**
 * Configuration options for combo system
 */
export interface UseComboSystemOptions {
  /** Callback when combo increases */
  onComboIncrease?: (combo: number, stars: number) => void
  /** Callback when combo breaks */
  onComboBreak?: (finalCombo: number) => void
  /** Timeout in ms before combo resets */
  comboTimeout?: number
  /** Base number of stars for combo 1 */
  baseStars?: number
  /** Maximum combo level */
  maxCombo?: number
}

/**
 * Return type for useComboSystem hook
 */
export interface UseComboSystemReturn {
  /** Current combo count */
  combo: number
  /** Add a correct gesture to increase combo */
  addCorrectGesture: () => void
  /** Manually break the current combo */
  breakCombo: () => void
  /** Reset combo to zero */
  reset: () => void
}

/**
 * Hook for managing gesture combo system
 */
export function useComboSystem(options: UseComboSystemOptions = {}): UseComboSystemReturn {
  const {
    onComboIncrease,
    onComboBreak,
    comboTimeout = 3000, // 3 seconds
    baseStars = 3,
    maxCombo = 50,
  } = options

  // State
  const [combo, setCombo] = useState(0)
  const comboRef = useRef(0)
  const lastCorrectTimeRef = useRef<number | null>(null)

  // Refs for timeout management
  const timeoutRef = useRef<NodeJS.Timeout>()

  /**
   * Clear any active combo timeout
   */
  const clearTimeoutRef = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = undefined
    }
  }, [])

  const updateCombo = useCallback((value: number) => {
    comboRef.current = value
    setCombo(value)
  }, [])

  /**
   * Calculate number of stars for current combo
   */
  const calculateStars = useCallback((currentCombo: number): number => {
    // Base stars + bonus for higher combos
    const bonus = Math.floor(currentCombo / 3) // Bonus every 3 combos
    const totalStars = Math.min(baseStars + bonus, 12) // Cap at 12 stars

    return totalStars
  }, [baseStars])

  /**
   * Handle correct gesture - increase combo
   */
  const addCorrectGesture = useCallback(() => {
    const now = Date.now()

    // Clear existing timeout
    clearTimeoutRef()

    const canContinueCombo =
      lastCorrectTimeRef.current !== null &&
      (now - lastCorrectTimeRef.current) < comboTimeout &&
      comboRef.current > 0

    let newCombo = 1

    if (canContinueCombo) {
      newCombo = Math.min(comboRef.current + 1, maxCombo)
    }

    updateCombo(newCombo)

    const stars = calculateStars(newCombo)
    onComboIncrease?.(newCombo, stars)

    // Update last correct time
    lastCorrectTimeRef.current = now

    // Set timeout to break combo if no more correct gestures
    timeoutRef.current = setTimeout(() => {
      if (comboRef.current > 0) {
        const finalCombo = comboRef.current
        updateCombo(0)
        lastCorrectTimeRef.current = null
        onComboBreak?.(finalCombo)
      }
    }, comboTimeout)
  }, [comboTimeout, maxCombo, calculateStars, onComboIncrease, onComboBreak, clearTimeoutRef, updateCombo])

  /**
   * Manually break current combo
   */
  const breakCombo = useCallback(() => {
    if (comboRef.current > 0) {
      const finalCombo = comboRef.current
      updateCombo(0)
      lastCorrectTimeRef.current = null
      clearTimeoutRef()
      onComboBreak?.(finalCombo)
    }
  }, [onComboBreak, clearTimeoutRef, updateCombo])

  /**
   * Reset combo to zero
   */
  const reset = useCallback(() => {
    updateCombo(0)
    lastCorrectTimeRef.current = null
    clearTimeoutRef()
  }, [clearTimeoutRef, updateCombo])

  // Cleanup on unmount
  useEffect(() => {
    return clearTimeoutRef
  }, [clearTimeoutRef])

  return {
    combo,
    addCorrectGesture,
    breakCombo,
    reset,
  }
}

export default useComboSystem
