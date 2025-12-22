# Story 4.3: Feedback Visual com Cores (Overlay)

**Epic:** Epic 4 - Interface de Prática e Feedback Visual
**Story ID:** `4-3-feedback-visual-com-cores-overlay`
**Status:** `done`
**Priority:** High (feedback visual essencial para UX)

---

## User Story

**As a** user,  
**I want** immediate visual feedback when I perform gestures,  
**So that** I know if I'm doing it correctly.

---

## Acceptance Criteria

**Given** I am practicing a gesture  
**When** The system recognizes my gesture  
**Then** The camera overlay should turn green when gesture is correct  
**And** The overlay should turn red when gesture is incorrect  
**And** The overlay should turn yellow when processing/recognizing  
**And** The color change should be smooth and immediate  
**And** The feedback should be clearly visible without obstructing the camera view

---

## Context & Background

### Purpose
Este é o feedback visual principal que permite aos usuários entenderem instantaneamente se estão executando os gestos corretamente. O sistema de cores cria uma conexão imediata entre a ação do usuário e o feedback do sistema, tornando a experiência de aprendizado mais intuitiva e engajante.

### Technical Requirements
- **Color Transitions**: Transições suaves entre cores
- **Real-time Updates**: Mudanças imediatas baseadas em reconhecimento
- **Visual Hierarchy**: Cores não devem obstruir a visão da câmera
- **Performance**: Animações não devem impactar performance
- **Accessibility**: Cores devem ser distinguíveis e incluir feedback alternativo

### Architecture Alignment
- **Story 4.2 dependency:** Integra com Practice page
- **Real-time Feedback:** Conecta com gesture recognition
- **CSS Animations:** Transições suaves e performáticas
- **State Management:** Estados de feedback bem definidos

---

## Tasks

### Task 1: Create feedback state management
- [ ] Define feedback states (correct/incorrect/processing)
- [ ] Create useFeedbackState hook for state management
- [ ] Implement state transitions with timers

### Task 2: Implement color overlay system
- [ ] Add colored overlay div over camera feed
- [ ] Implement CSS classes for each color state
- [ ] Add opacity controls for visibility without obstruction

### Task 3: Integrate with gesture recognition
- [ ] Connect feedback to prediction results from Practice page
- [ ] Map prediction confidence to feedback states
- [ ] Handle edge cases (no hands, processing states)

### Task 4: Add smooth transitions
- [ ] Implement CSS transitions for color changes
- [ ] Add fade in/out effects for overlay visibility
- [ ] Ensure transitions are smooth and immediate

### Task 5: Add visual indicators and animations
- [ ] Add pulsing effects for processing state
- [ ] Implement success/failure animations
- [ ] Add subtle visual cues for state changes

### Task 6: Create comprehensive tests
- [ ] Test color state transitions
- [ ] Test integration with gesture recognition
- [ ] Test animation performance
- [ ] Accessibility testing for color feedback

---

## Technical Design

### Feedback State Types

```typescript
export type FeedbackState = 'idle' | 'processing' | 'correct' | 'incorrect'

export interface FeedbackConfig {
  state: FeedbackState
  confidence?: number
  gesture?: string
  timestamp: number
}
```

### Color System Design

```css
/* Color definitions with opacity for non-obstruction */
.feedback-overlay {
  position: absolute;
  inset: 0;
  pointer-events: none;
  border-radius: inherit;
  transition: all 0.3s ease-in-out;
}

.feedback-overlay.idle {
  background-color: transparent;
}

.feedback-overlay.processing {
  background-color: rgba(255, 193, 7, 0.15); /* Yellow with low opacity */
  animation: pulse 1.5s ease-in-out infinite;
}

.feedback-overlay.correct {
  background-color: rgba(34, 197, 94, 0.2); /* Green with medium opacity */
  animation: success-flash 0.6s ease-out;
}

.feedback-overlay.incorrect {
  background-color: rgba(239, 68, 68, 0.2); /* Red with medium opacity */
  animation: error-flash 0.6s ease-out;
}

/* Animation keyframes */
@keyframes pulse {
  0%, 100% { opacity: 0.1; }
  50% { opacity: 0.25; }
}

@keyframes success-flash {
  0% { opacity: 0; }
  50% { opacity: 0.3; }
  100% { opacity: 0.2; }
}

@keyframes error-flash {
  0% { opacity: 0; }
  50% { opacity: 0.3; }
  100% { opacity: 0.2; }
}
```

### Feedback Hook Implementation

```typescript
interface UseFeedbackStateOptions {
  onStateChange?: (state: FeedbackState) => void
  processingTimeout?: number // Default: 2000ms
  feedbackDuration?: number // Default: 1500ms
}

function useFeedbackState(options: UseFeedbackStateOptions = {}) {
  const [state, setState] = useState<FeedbackState>('idle')
  const [lastPrediction, setLastPrediction] = useState<PredictionResult | null>(null)

  const {
    onStateChange,
    processingTimeout = 2000,
    feedbackDuration = 1500,
  } = options

  // Handle prediction results
  const handlePrediction = useCallback((prediction: PredictionResult) => {
    // Set processing state initially
    setState('processing')
    setLastPrediction(prediction)

    // Simulate processing delay (in real implementation, this would be from ML model)
    setTimeout(() => {
      if (prediction.isCorrect) {
        setState('correct')
        onStateChange?.('correct')
      } else {
        setState('incorrect')
        onStateChange?.('incorrect')
      }

      // Return to idle after feedback duration
      setTimeout(() => {
        setState('idle')
        setLastPrediction(null)
        onStateChange?.('idle')
      }, feedbackDuration)
    }, 300) // Small delay for visual feedback
  }, [onStateChange, feedbackDuration])

  // Manual state control
  const setFeedbackState = useCallback((newState: FeedbackState) => {
    setState(newState)
    onStateChange?.(newState)
  }, [onStateChange])

  return {
    state,
    lastPrediction,
    handlePrediction,
    setFeedbackState,
  }
}
```

### Integration with Practice Page

```typescript
// In Practice.tsx
function Practice() {
  // ... existing state ...

  // Feedback state
  const { state: feedbackState, handlePrediction } = useFeedbackState({
    onStateChange: (state) => {
      console.log('Feedback state changed:', state)
    }
  })

  // Handle landmarks and trigger prediction
  const handleLandmarksDetected = useCallback((
    landmarks: HandLandmark[][],
    dimensions: VideoDimensions
  ) => {
    if (practiceState !== 'active') return

    // Simulate gesture recognition (replace with actual ML model)
    const hasHand = landmarks.length > 0 && landmarks[0].length > 0

    if (hasHand) {
      // Random prediction for demo (replace with actual model)
      const isCorrect = Math.random() > 0.6 // 40% success rate for demo
      const confidence = Math.random() * 0.4 + 0.6 // 60-100%

      const prediction: PredictionResult = {
        gesture: isCorrect ? lesson.gestureName : 'Outro sinal',
        confidence,
        timestamp: Date.now(),
        isCorrect,
      }

      // Update UI prediction display
      setCurrentPrediction(prediction)

      // Trigger feedback
      handlePrediction(prediction)
    }
  }, [practiceState, lesson, handlePrediction])

  return (
    <div className="practice-container">
      {/* Camera Section with Feedback Overlay */}
      <CameraSection
        lesson={lesson}
        practiceState={practiceState}
        feedbackState={feedbackState}
        onLandmarksDetected={handleLandmarksDetected}
      />

      {/* Other sections... */}
    </div>
  )
}
```

### Enhanced CameraSection with Feedback

```typescript
interface CameraSectionProps {
  lesson: LessonWithModule | null
  practiceState: PracticeState
  feedbackState: FeedbackState
  onLandmarksDetected: (landmarks: HandLandmark[][], dimensions: VideoDimensions) => void
}

function CameraSection({
  lesson,
  practiceState,
  feedbackState,
  onLandmarksDetected
}: CameraSectionProps) {
  return (
    <div className="relative bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Sua Prática
        </h2>
        <p className="text-gray-600 text-sm">
          Posicione sua mão na câmera e pratique o sinal "{lesson?.gestureName}"
        </p>
      </div>

      <div className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden">
        <CameraFrame
          className="w-full h-full"
          onLandmarksDetected={onLandmarksDetected}
        />

        {/* Feedback Color Overlay */}
        <div
          className={`feedback-overlay ${feedbackState}`}
          aria-label={`Feedback: ${feedbackState}`}
        />

        {/* Status indicators */}
        {feedbackState === 'processing' && (
          <div className="absolute top-4 left-4 bg-yellow-500 text-white px-3 py-1 rounded-full text-sm font-medium animate-pulse">
            🔄 Processando...
          </div>
        )}

        {feedbackState === 'correct' && (
          <div className="absolute top-4 left-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">
            ✅ Correto!
          </div>
        )}

        {feedbackState === 'incorrect' && (
          <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium">
            ❌ Tente novamente
          </div>
        )}

        {/* Practice state overlays... */}
      </div>

      {/* Feedback legend */}
      <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-yellow-400 rounded opacity-60"></div>
          <span>Processando</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded opacity-60"></div>
          <span>Correto</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-red-500 rounded opacity-60"></div>
          <span>Incorreto</span>
        </div>
      </div>
    </div>
  )
}
```

### Performance Optimizations

```typescript
// Debounce feedback to prevent rapid state changes
function useDebouncedFeedback(delay: number = 300) {
  const [debouncedState, setDebouncedState] = useState<FeedbackState>('idle')
  const timeoutRef = useRef<NodeJS.Timeout>()

  const setFeedback = useCallback((state: FeedbackState) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    timeoutRef.current = setTimeout(() => {
      setDebouncedState(state)
    }, delay)
  }, [delay])

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return [debouncedState, setFeedback] as const
}
```

### Accessibility Features

```typescript
// Screen reader announcements
function FeedbackAnnouncer({ state }: { state: FeedbackState }) {
  const [announcement, setAnnouncement] = useState('')

  useEffect(() => {
    switch (state) {
      case 'processing':
        setAnnouncement('Analisando gesto...')
        break
      case 'correct':
        setAnnouncement('Gesto reconhecido corretamente!')
        break
      case 'incorrect':
        setAnnouncement('Gesto não reconhecido. Tente novamente.')
        break
      default:
        setAnnouncement('')
    }
  }, [state])

  return (
    <div
      role="status"
      aria-live="polite"
      className="sr-only"
    >
      {announcement}
    </div>
  )
}
```

---

## Dependencies
- **Blocks:** Story 4.4 (estrelas usam feedback)
- **Blocked by:** Story 4.2 ✅ (página de prática necessária)
- **Requires:** CSS animations, React state management

---

## Definition of Done
- [ ] `useFeedbackState` hook criado com estados de feedback
- [ ] Sistema de cores overlay implementado (verde/vermelho/amarelo)
- [ ] Integração com reconhecimento de gestos na Practice page
- [ ] Transições suaves entre estados visuais
- [ ] Feedback visual sem obstruir visão da câmera
- [ ] Animações de sucesso/erro implementadas
- [ ] Indicadores de status visuais adicionados
- [ ] Suporte a acessibilidade (screen readers)
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
<!-- Dev: How did you verify the color feedback overlay works? -->

---

## Senior Developer Review (AI)

<!-- Code Review Agent: Add findings here after *code-review -->

