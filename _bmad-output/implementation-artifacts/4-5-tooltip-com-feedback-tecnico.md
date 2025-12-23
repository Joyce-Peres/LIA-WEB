# Story 4.5: Tooltip com Feedback Técnico

**Epic:** Epic 4 - Interface de Prática e Feedback Visual
**Story ID:** `4-5-tooltip-com-feedback-tecnico`
**Status:** `done`
**Priority:** High (finalização do sistema de feedback)

---

## User Story

**As a user,
I want to see technical details about my gesture recognition,
So that I can understand the precision of my movements.**

---

## Acceptance Criteria

**Given** I am practicing and stars appear
**When** I hover over the stars or feedback area
**Then** A tooltip should appear showing confidence percentage
**And** The tooltip should show inference time
**And** The tooltip should be non-intrusive and dismissible
**And** The tooltip should only appear on hover/click, not automatically

---

## Context & Background

### Purpose
Este é o toque final do sistema de feedback - informações técnicas detalhadas que ajudam usuários avançados a entender e melhorar sua performance. Os tooltips aparecem apenas quando solicitados, mantendo a interface limpa mas informativa.

### Technical Requirements
- **Tooltip Component**: Reutilizável e acessível
- **Performance Metrics**: Tempo de inferência e confiança
- **Hover/Click Triggers**: Interação intuitiva
- **Non-intrusive Design**: Aparece sobreposto mas não bloqueia
- **Auto-dismiss**: Some após timeout ou clique fora

### Architecture Alignment
- **Story 4.4 dependency:** Usa dados dos gestos reconhecidos
- **User Experience**: Informações técnicas opcionais
- **Progressive Enhancement**: Funciona sem JavaScript
- **Accessibility**: Tooltips ARIA-compliant

---

## Tasks

### Task 1: Create TechnicalTooltip component
- [ ] Create `src/components/practice/TechnicalTooltip.tsx`
- [ ] Implement tooltip with confidence percentage
- [ ] Add inference time display
- [ ] Include hover/click positioning logic

### Task 2: Create useTooltip hook
- [ ] Create `src/hooks/ui/useTooltip.ts`
- [ ] Manage tooltip state (show/hide/position)
- [ ] Handle hover and click triggers
- [ ] Implement auto-dismiss logic

### Task 3: Integrate tooltip with star particles
- [ ] Connect tooltip to StarParticle components
- [ ] Pass technical data from prediction results
- [ ] Position tooltip relative to mouse/star position
- [ ] Handle multiple simultaneous tooltips

### Task 4: Add tooltip to feedback overlay
- [ ] Integrate tooltip with feedback overlay areas
- [ ] Show technical details on camera feedback
- [ ] Add click-to-show functionality
- [ ] Ensure non-blocking overlay design

### Task 5: Add performance tracking
- [ ] Track inference time in gesture recognition
- [ ] Store confidence values in prediction data
- [ ] Pass metrics to tooltip display
- [ ] Optimize performance measurement

### Task 6: Create comprehensive tests
- [ ] Test tooltip component rendering
- [ ] Test useTooltip hook behavior
- [ ] Test integration with star particles
- [ ] Test accessibility and keyboard navigation

---

## Technical Design

### TechnicalTooltip Component

```typescript
interface TechnicalTooltipProps {
  confidence: number
  inferenceTime: number
  position: { x: number; y: number }
  isVisible: boolean
  onClose: () => void
}

function TechnicalTooltip({
  confidence,
  inferenceTime,
  position,
  isVisible,
  onClose
}: TechnicalTooltipProps) {
  if (!isVisible) return null

  return (
    <div
      className="fixed z-50 bg-black/90 text-white px-4 py-3 rounded-lg shadow-xl border border-gray-600 max-w-xs"
      style={{
        left: position.x,
        top: position.y,
        transform: 'translate(-50%, -100%)', // Position above cursor
      }}
      role="tooltip"
      aria-live="polite"
    >
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Confiança:</span>
          <span className={`text-sm font-bold ${
            confidence > 0.8 ? 'text-green-400' :
            confidence > 0.6 ? 'text-yellow-400' : 'text-red-400'
          }`}>
            {(confidence * 100).toFixed(1)}%
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Tempo:</span>
          <span className="text-sm font-bold text-blue-400">
            {inferenceTime.toFixed(0)}ms
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Precisão:</span>
          <div className="flex items-center gap-1">
            <div className="w-16 h-2 bg-gray-700 rounded">
              <div
                className={`h-full rounded transition-all duration-300 ${
                  confidence > 0.8 ? 'bg-green-400' :
                  confidence > 0.6 ? 'bg-yellow-400' : 'bg-red-400'
                }`}
                style={{ width: `${confidence * 100}%` }}
              />
            </div>
            <span className="text-xs text-gray-400">
              {confidence > 0.8 ? 'Excelente' :
               confidence > 0.6 ? 'Bom' : 'Melhore'}
            </span>
          </div>
        </div>
      </div>

      <button
        onClick={onClose}
        className="absolute top-1 right-1 text-gray-400 hover:text-white text-xs"
        aria-label="Fechar tooltip"
      >
        ✕
      </button>

      {/* Arrow pointer */}
      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-black/90" />
    </div>
  )
}
```

### useTooltip Hook

```typescript
interface UseTooltipOptions {
  delay?: number
  autoHide?: boolean
  autoHideDelay?: number
}

interface TooltipData {
  confidence: number
  inferenceTime: number
}

interface UseTooltipReturn {
  tooltipData: TooltipData | null
  tooltipPosition: { x: number; y: number }
  isVisible: boolean
  showTooltip: (data: TooltipData, position: { x: number; y: number }) => void
  hideTooltip: () => void
  handleMouseEnter: (data: TooltipData) => (event: React.MouseEvent) => void
  handleMouseLeave: () => void
  handleClick: (data: TooltipData) => (event: React.MouseEvent) => void
}

function useTooltip(options: UseTooltipOptions = {}): UseTooltipReturn {
  const {
    delay = 500,
    autoHide = true,
    autoHideDelay = 3000
  } = options

  const [tooltipData, setTooltipData] = useState<TooltipData | null>(null)
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 })
  const [isVisible, setIsVisible] = useState(false)

  const showTimeoutRef = useRef<NodeJS.Timeout>()
  const hideTimeoutRef = useRef<NodeJS.Timeout>()

  const showTooltip = useCallback((data: TooltipData, position: { x: number; y: number }) => {
    // Clear existing timeouts
    if (showTimeoutRef.current) clearTimeout(showTimeoutRef.current)
    if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current)

    setTooltipData(data)
    setTooltipPosition(position)

    // Delay showing tooltip
    showTimeoutRef.current = setTimeout(() => {
      setIsVisible(true)

      // Auto-hide if enabled
      if (autoHide) {
        hideTimeoutRef.current = setTimeout(() => {
          hideTooltip()
        }, autoHideDelay)
      }
    }, delay)
  }, [delay, autoHide, autoHideDelay])

  const hideTooltip = useCallback(() => {
    // Clear timeouts
    if (showTimeoutRef.current) clearTimeout(showTimeoutRef.current)
    if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current)

    setIsVisible(false)
    setTooltipData(null)
  }, [])

  const handleMouseEnter = useCallback((data: TooltipData) => (event: React.MouseEvent) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const position = {
      x: rect.left + rect.width / 2,
      y: rect.top
    }
    showTooltip(data, position)
  }, [showTooltip])

  const handleMouseLeave = useCallback(() => {
    hideTooltip()
  }, [hideTooltip])

  const handleClick = useCallback((data: TooltipData) => (event: React.MouseEvent) => {
    event.stopPropagation()
    const position = { x: event.clientX, y: event.clientY }
    showTooltip(data, position)
  }, [showTooltip])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (showTimeoutRef.current) clearTimeout(showTimeoutRef.current)
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current)
    }
  }, [])

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
```

### Integration with Star Particles

```typescript
// In StarParticle.tsx
interface StarParticleProps {
  // ... existing props
  technicalData?: {
    confidence: number
    inferenceTime: number
  }
  onShowTooltip?: (data: { confidence: number; inferenceTime: number }, position: { x: number; y: number }) => void
  onHideTooltip?: () => void
}

function StarParticle({
  // ... existing props
  technicalData,
  onShowTooltip,
  onHideTooltip
}: StarParticleProps) {
  const handleMouseEnter = useCallback((event: React.MouseEvent) => {
    if (technicalData && onShowTooltip) {
      const rect = event.currentTarget.getBoundingClientRect()
      const position = {
        x: rect.left + rect.width / 2,
        y: rect.top - 10
      }
      onShowTooltip(technicalData, position)
    }
  }, [technicalData, onShowTooltip])

  const handleMouseLeave = useCallback(() => {
    if (onHideTooltip) {
      onHideTooltip()
    }
  }, [onHideTooltip])

  return (
    <div
      // ... existing props
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="cursor-help" // Indicate tooltip available
    >
      {/* Star content */}
    </div>
  )
}
```

### Performance Tracking Integration

```typescript
// In Practice.tsx - Enhanced prediction handling
const handleLandmarksDetected = useCallback((landmarks, dimensions) => {
  const startTime = performance.now()

  // ... existing gesture recognition logic ...

  const inferenceTime = performance.now() - startTime

  // Store technical data with prediction
  const technicalData = {
    confidence,
    inferenceTime,
    timestamp: Date.now()
  }

  // Pass technical data to star spawning
  if (isCorrect) {
    addCorrectGesture()

    // Enhanced star data with technical info
    const newStars = stars.map(star => ({
      ...star,
      technicalData
    }))

    setStars(prev => [...prev, ...newStars])
  }

  // ... rest of existing logic
}, [practiceState, lesson, handlePrediction, addCorrectGesture])
```

---

## Dependencies
- **Blocks:** Nenhuma (story final do epic)
- **Blocked by:** Story 4.4 ✅ (estrelas para tooltip)
- **Requires:** React event handling, performance API

---

## Definition of Done
- [ ] `src/components/practice/TechnicalTooltip.tsx` com design profissional
- [ ] `src/hooks/ui/useTooltip.ts` para gerenciamento de estado
- [ ] Integração com StarParticle para hover tooltips
- [ ] Tooltip na área de feedback da câmera
- [ ] Rastreamento de performance (tempo de inferência)
- [ ] Design não-intrusivo e acessível
- [ ] Testes unitários criados e passando
- [ ] Code review aprovado
- [ ] Arquivos commitados no Git

---

## Dev Agent Record

### Implementation Notes
<!-- Dev: Add implementation notes here -->

### Files Changed
<!-- Dev: List files created/modified -->

### Testing
<!-- Dev: How did you verify the technical tooltip works? -->

---

## Senior Developer Review (AI)

<!-- Code Review Agent: Add findings here after *code-review -->
