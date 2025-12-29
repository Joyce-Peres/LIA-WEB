/**
 * TechnicalTooltip Component
 *
 * Displays detailed technical information about gesture recognition performance.
 * Shows confidence percentage, inference time, and performance metrics.
 *
 * @module components/practice/TechnicalTooltip
 * @category UI Components
 *
 * @example
 * ```tsx
 * <TechnicalTooltip
 *   confidence={0.85}
 *   inferenceTime={45}
 *   position={{ x: 200, y: 150 }}
 *   isVisible={true}
 *   onClose={() => hideTooltip()}
 * />
 * ```
 */

import { TooltipTechnicalData } from '../../hooks/ui/useTooltip'

/**
 * Props for the TechnicalTooltip component
 */
export interface TechnicalTooltipProps {
  /** Technical data to display */
  technicalData: TooltipTechnicalData
  /** Position for the tooltip */
  position: { x: number; y: number }
  /** Whether tooltip is visible */
  isVisible: boolean
  /** Callback when tooltip should be closed */
  onClose: () => void
}

/**
 * TechnicalTooltip component with performance metrics
 */
export function TechnicalTooltip({
  technicalData,
  position,
  isVisible,
  onClose
}: TechnicalTooltipProps) {
  const { confidence, inferenceTime, gesture, isCorrect } = technicalData
  const safeInference = inferenceTime ?? 0

  if (!isVisible) return null

  /**
   * Get confidence color based on value
   */
  const getConfidenceColor = (conf: number) => {
    if (conf > 0.8) return 'text-green-400'
    if (conf > 0.6) return 'text-yellow-400'
    return 'text-red-400'
  }

  /**
   * Get confidence bar color
   */
  const getConfidenceBarColor = (conf: number) => {
    if (conf > 0.8) return 'bg-green-400'
    if (conf > 0.6) return 'bg-yellow-400'
    return 'bg-red-400'
  }

  /**
   * Get performance rating
   */
  const getPerformanceRating = (conf: number) => {
    if (conf > 0.8) return 'Excelente'
    if (conf > 0.6) return 'Bom'
    return 'Melhore'
  }

  /**
   * Get inference time color
   */
  const getInferenceTimeColor = (time: number) => {
    if (time < 50) return 'text-green-400'
    if (time < 100) return 'text-yellow-400'
    return 'text-orange-400'
  }

  return (
    <>
      {/* Backdrop for click-outside to close */}
      <div
        className="fixed inset-0 z-40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Tooltip */}
      <div
        className="fixed z-50 bg-black/95 text-white px-4 py-3 rounded-lg shadow-2xl border border-gray-600 max-w-xs backdrop-blur-sm"
        style={{
          left: position.x,
          top: position.y,
          transform: 'translate(-50%, -100%)', // Position above cursor
        }}
        role="tooltip"
        aria-live="polite"
        aria-label={`Detalhes técnicos do reconhecimento: ${gesture || 'gesto'}`}
      >
        {/* Header with gesture name if available */}
        {gesture && (
          <div className="text-sm font-medium text-gray-300 mb-3 pb-2 border-b border-gray-600">
            {gesture} {isCorrect ? '✓' : '✗'}
          </div>
        )}

        <div className="space-y-3">
          {/* Confidence */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-300">Confiança:</span>
            <span className={`text-sm font-bold ${getConfidenceColor(confidence)}`}>
              {(confidence * 100).toFixed(1)}%
            </span>
          </div>

          {/* Confidence bar */}
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${getConfidenceBarColor(confidence)}`}
                  style={{ width: `${confidence * 100}%` }}
                  aria-label={`Barra de confiança: ${(confidence * 100).toFixed(0)}%`}
                />
              </div>
            </div>
            <span className="text-xs text-gray-400 min-w-0">
              {getPerformanceRating(confidence)}
            </span>
          </div>

          {/* Inference time */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-300">Tempo:</span>
            <span className={`text-sm font-bold ${getInferenceTimeColor(safeInference)}`}>
              {safeInference.toFixed(0)}ms
            </span>
          </div>

          {/* Performance indicator */}
          <div className="text-xs text-gray-400 text-center pt-1 border-t border-gray-600">
            {safeInference < 50 ? '⚡ Rápido' :
             safeInference < 100 ? '✓ Adequado' :
             '🐌 Lento'}
          </div>
        </div>

        {/* Close button */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            onClose()
          }}
          className="absolute top-2 right-2 text-gray-400 hover:text-white text-sm leading-none w-5 h-5 flex items-center justify-center rounded hover:bg-gray-700 transition-colors"
          aria-label="Fechar tooltip"
        >
          ✕
        </button>

        {/* Arrow pointer */}
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-black/95" />
      </div>
    </>
  )
}

export default TechnicalTooltip