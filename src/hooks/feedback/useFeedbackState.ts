/**
 * useFeedbackState Hook
 *
 * Manages visual feedback states for gesture recognition in practice mode.
 * Provides smooth transitions between idle, processing, correct, and incorrect states.
 *
 * @module hooks/feedback/useFeedbackState
 * @category Custom Hooks
 *
 * @example
 * ```tsx
 * const { state, handlePrediction } = useFeedbackState({
 *   onStateChange: (state) => console.log('Feedback:', state)
 * })
 *
 * // Trigger feedback based on prediction
 * handlePrediction({ gesture: 'A', confidence: 0.85, isCorrect: true })
 * ```
 */

import { useState, useCallback, useRef, useEffect } from 'react'

/**
 * Feedback state types
 */
export type FeedbackState = 'idle' | 'processing' | 'correct' | 'incorrect'

/**
 * Prediction result from gesture recognition
 */
export interface PredictionResult {
  gesture: string
  confidence: number
  timestamp: number
  isCorrect: boolean
}

/**
 * Configuration options for feedback state management
 */
export interface UseFeedbackStateOptions {
  /** Callback when feedback state changes */
  onStateChange?: (state: FeedbackState, prediction?: PredictionResult) => void
  /** Timeout for processing state (ms) */
  processingTimeout?: number
  /** Duration to show feedback before returning to idle (ms) */
  feedbackDuration?: number
  /** Minimum confidence threshold for correct recognition */
  confidenceThreshold?: number
}

/**
 * Return type for useFeedbackState hook
 */
export interface UseFeedbackStateReturn {
  /** Current feedback state */
  state: FeedbackState
  /** Last prediction result */
  lastPrediction: PredictionResult | null
  /** Handle new prediction result */
  handlePrediction: (prediction: PredictionResult) => void
  /** Manually set feedback state */
  setFeedbackState: (state: FeedbackState) => void
  /** Force reset to idle state */
  reset: () => void
}

/**
 * Hook for managing visual feedback states during gesture practice
 */
export function useFeedbackState(options: UseFeedbackStateOptions = {}): UseFeedbackStateReturn {
  const {
    onStateChange,
    processingTimeout = 200,
    feedbackDuration = 1500,
    confidenceThreshold = 0.7,
  } = options

  // State management
  const [state, setState] = useState<FeedbackState>('idle')
  const [lastPrediction, setLastPrediction] = useState<PredictionResult | null>(null)

  // Refs for managing timeouts
  const processingTimeoutRef = useRef<NodeJS.Timeout>()
  const feedbackTimeoutRef = useRef<NodeJS.Timeout>()

  /**
   * Clear all active timeouts
   */
  const clearTimeouts = useCallback(() => {
    if (processingTimeoutRef.current) {
      clearTimeout(processingTimeoutRef.current)
      processingTimeoutRef.current = undefined
    }
    if (feedbackTimeoutRef.current) {
      clearTimeout(feedbackTimeoutRef.current)
      feedbackTimeoutRef.current = undefined
    }
  }, [])

  /**
   * Set feedback state with callback
   */
  const setFeedbackState = useCallback((newState: FeedbackState, prediction?: PredictionResult) => {
    setState(newState)
    setLastPrediction(prediction || null)
    onStateChange?.(newState, prediction)
  }, [onStateChange])

  /**
   * Handle prediction result and trigger appropriate feedback
   */
  const handlePrediction = useCallback((prediction: PredictionResult) => {
    // Clear any existing timeouts
    clearTimeouts()

    // Validate prediction
    if (!prediction || typeof prediction.isCorrect !== 'boolean') {
      console.warn('Invalid prediction result:', prediction)
      return
    }

    // Store prediction
    setLastPrediction(prediction)

    // Determine if prediction should be considered correct
    const isCorrect = prediction.isCorrect && prediction.confidence >= confidenceThreshold

    // Set processing state first
    setFeedbackState('processing', prediction)

    // Simulate processing delay (in real implementation, this would be from ML model)
    processingTimeoutRef.current = setTimeout(() => {
      if (isCorrect) {
        setFeedbackState('correct', prediction)
      } else {
        setFeedbackState('incorrect', prediction)
      }

      // Return to idle after feedback duration
      feedbackTimeoutRef.current = setTimeout(() => {
        setFeedbackState('idle')
      }, feedbackDuration)
    }, processingTimeout)
  }, [clearTimeouts, setFeedbackState, confidenceThreshold, feedbackDuration])

  /**
   * Force reset to idle state
   */
  const reset = useCallback(() => {
    clearTimeouts()
    setFeedbackState('idle')
  }, [clearTimeouts, setFeedbackState])

  // Cleanup timeouts on unmount
  useEffect(() => {
    return clearTimeouts
  }, [clearTimeouts])

  return {
    state,
    lastPrediction,
    handlePrediction,
    setFeedbackState,
    reset,
  }
}

export default useFeedbackState
