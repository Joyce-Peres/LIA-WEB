/**
 * StarParticle Component
 *
 * Animated star particle that appears when gestures are recognized correctly.
 * Features random trajectories, scaling, and fade-out effects.
 *
 * @module components/practice/StarParticle
 * @category UI Components
 *
 * @example
 * ```tsx
 * <StarParticle
 *   id="star-1"
 *   x={200}
 *   y={150}
 *   size={24}
 *   color="yellow"
 *   onComplete={(id) => removeStar(id)}
 * />
 * ```
 */

import React, { useState, useEffect } from 'react'
import { TooltipTechnicalData } from '../../hooks/ui/useTooltip'

/**
 * Props for the StarParticle component
 */
export interface StarParticleProps {
  /** Unique identifier for the particle */
  id: string
  /** Initial X position */
  x: number
  /** Initial Y position */
  y: number
  /** Size of the star in pixels */
  size: number
  /** Color theme */
  color: 'purple' | 'yellow'
  /** Callback when animation completes */
  onComplete: (id: string) => void
  /** Animation duration in ms */
  duration?: number
  /** Gravity strength (pixels per second squared) */
  gravity?: number
  /** Technical data for tooltip */
  technicalData?: TooltipTechnicalData
  /** Callback to show tooltip */
  onShowTooltip?: (data: TooltipTechnicalData, position: { x: number; y: number }) => void
  /** Callback to hide tooltip */
  onHideTooltip?: () => void
}

/**
 * StarParticle component with physics-based animation
 */
export function StarParticle({
  id,
  x,
  y,
  size,
  color,
  onComplete,
  duration = 1500,
  gravity = 150,
  technicalData,
  onShowTooltip,
  onHideTooltip
}: StarParticleProps) {
  const [position, setPosition] = useState({ x, y })
  const [opacity, setOpacity] = useState(0)
  const [scale, setScale] = useState(0)
  const [rotation, setRotation] = useState(0)

  // Random trajectory parameters
  const angle = Math.random() * Math.PI * 2 // Random direction
  const distance = 60 + Math.random() * 80 // Random distance
  const wobble = (Math.random() - 0.5) * 0.5 // Random wobble factor

  // Tooltip handlers
  const handleMouseEnter = () => {
    if (technicalData && onShowTooltip) {
      onShowTooltip(technicalData, {
        x: position.x + size / 2,
        y: position.y + size / 2
      })
    }
  }

  const handleMouseLeave = () => {
    onHideTooltip?.()
  }

  useEffect(() => {
    let startTime: number | null = null
    let animationId: number

    const animate = (currentTime: number) => {
      if (startTime === null) {
        startTime = currentTime
      }

      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)

      // Easing function for smooth animation
      const easeOutCubic = 1 - Math.pow(1 - progress, 3)

      // Calculate position with physics
      const currentDistance = distance * easeOutCubic
      const gravityOffset = (gravity * progress * progress) / 2

      // Add wobble for more natural movement
      const wobbleOffset = Math.sin(progress * Math.PI * 4) * wobble * currentDistance

      setPosition({
        x: x + Math.cos(angle) * currentDistance + wobbleOffset,
        y: y + Math.sin(angle) * currentDistance - gravityOffset,
      })

      // Scale animation: start small, grow, then fade
      if (progress < 0.2) {
        // Appear phase (0-20%)
        setScale(progress * 5) // 0 to 1
        setOpacity(progress * 5) // 0 to 1
      } else if (progress < 0.8) {
        // Main phase (20-80%)
        setScale(1 + (progress - 0.2) * 0.5) // 1 to 1.3
        setOpacity(1)
      } else {
        // Fade phase (80-100%)
        setScale(1.3 - (progress - 0.8) * 0.3) // 1.3 to 1.0
        setOpacity(1 - (progress - 0.8) / 0.2) // 1 to 0
      }

      // Rotation for sparkle effect
      setRotation(progress * 360 * 2) // 2 full rotations

      if (progress < 1) {
        animationId = requestAnimationFrame(animate)
      } else {
        // Animation complete
        onComplete(id)
      }
    }

    // Start animation after a small delay for staggered effect
    const startDelay = Math.random() * 200
    setTimeout(() => {
      requestAnimationFrame(animate)
    }, startDelay)

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId)
      }
    }
  }, [id, x, y, duration, gravity, angle, distance, wobble, onComplete])

  // Color classes
  const colorClasses = {
    purple: 'text-purple-400 drop-shadow-[0_0_4px_rgba(147,51,234,0.5)]',
    yellow: 'text-yellow-400 drop-shadow-[0_0_4px_rgba(251,191,36,0.5)]',
  }

  return (
    <div
      className={`absolute select-none ${colorClasses[color]} ${
        predictionData ? 'cursor-help pointer-events-auto' : 'pointer-events-none'
      }`}
      style={{
        left: position.x,
        top: position.y,
        transform: `scale(${scale}) rotate(${rotation}deg)`,
        opacity,
        fontSize: `${size}px`,
        zIndex: 40,
      }}
      onMouseEnter={technicalData ? handleMouseEnter : undefined}
      onMouseLeave={technicalData ? handleMouseLeave : undefined}
      aria-hidden="true"
    >
      <span
        role="img"
        aria-label={technicalData ? `Estrela de reconhecimento - ${technicalData.gestureName || 'gesto'}` : "estrela"}
      >
        ⭐
      </span>
    </div>
  )
}

export default StarParticle
