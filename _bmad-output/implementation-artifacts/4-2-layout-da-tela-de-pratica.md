# Story 4.2: Layout da Tela de Prática

**Epic:** Epic 4 - Interface de Prática e Feedback Visual
**Story ID:** `4-2-layout-da-tela-de-pratica`
**Status:** `done`
**Priority:** High (estrutura base da tela de prática)

---

## User Story

**As a** user,  
**I want** a well-organized practice screen with all necessary elements,  
**So that** I can practice effectively.

---

## Acceptance Criteria

**Given** I am on the practice page  
**When** The page loads  
**Then** I should see the camera feed section (left or top)  
**And** I should see the reference video/image section  
**And** I should see control buttons (start/stop camera, reset)  
**And** I should see feedback section showing current prediction  
**And** The layout should be responsive (desktop and mobile)  
**And** All sections should be clearly separated and labeled

---

## Context & Background

### Purpose
Esta é a tela principal de prática onde usuários executam os exercícios de Libras. Ela organiza todos os elementos necessários de forma clara e intuitiva, permitindo que o foco seja mantido na prática efetiva.

### Technical Requirements
- **React Page Component**: Página completa de prática
- **Responsive Layout**: Grid adaptável desktop/mobile
- **URL Routing**: Recebe lessonId via parâmetros
- **State Management**: Gerencia estado da prática
- **Component Integration**: Usa CameraFrame e outros componentes

### Architecture Alignment
- **Story 4.1 dependency:** Usa CameraFrame recém-criado
- **Future Stories:** Base para feedback visual e estrelas
- **Navigation:** Integrado com fluxo de navegação

---

## Tasks

### Task 1: Create Practice page component
- [ ] Create `src/pages/Practice.tsx`
- [ ] Implement URL parameter handling for lessonId
- [ ] Add responsive layout structure (desktop: 2-column, mobile: stacked)
- [ ] Create section containers with proper spacing

### Task 2: Integrate CameraFrame component
- [ ] Add CameraFrame to left/top section
- [ ] Handle landmark detection callbacks
- [ ] Implement proper sizing and aspect ratio

### Task 3: Create Reference Video section
- [ ] Add reference video player (similar to LessonDetail)
- [ ] Position on right/bottom section
- [ ] Handle video loading and error states
- [ ] Make responsive to layout changes

### Task 4: Implement Control Panel
- [ ] Create control buttons (start/stop/reset)
- [ ] Add button states (enabled/disabled based on practice state)
- [ ] Implement button actions and state management
- [ ] Style buttons consistently with design system

### Task 5: Add Feedback Display section
- [ ] Create feedback area for current prediction
- [ ] Show gesture recognition results
- [ ] Add confidence indicators
- [ ] Position appropriately in layout

### Task 6: Implement responsive behavior
- [ ] Desktop: 2-column layout (camera left, reference/controls right)
- [ ] Mobile: Stacked layout (camera top, reference middle, controls bottom)
- [ ] Tablet: Adaptive breakpoints
- [ ] Test on different screen sizes

### Task 7: Create comprehensive tests
- [ ] Unit tests for Practice page component
- [ ] Test responsive layout behavior
- [ ] Test component integration
- [ ] Test user interactions

---

## Technical Design

### Layout Structure

```
Practice Page
├── Header
│   ├── Breadcrumb Navigation
│   ├── Lesson Title & Progress
│   └── Back to Lesson Button
├── Main Content (Grid)
│   ├── Left/Top: Camera Section
│   │   ├── CameraFrame Component
│   │   ├── Practice Instructions Overlay
│   │   └── Real-time Feedback
│   └── Right/Bottom: Reference Section
│       ├── Reference Video Player
│       ├── Current Prediction Display
│       └── Control Panel
└── Footer (optional)
    └── Additional Actions
```

### Responsive Breakpoints

```typescript
// Tailwind responsive classes
const layoutClasses = {
  container: 'container mx-auto px-4 py-8 max-w-7xl',
  grid: 'grid grid-cols-1 lg:grid-cols-2 gap-8',
  cameraSection: 'order-1 lg:order-1',
  referenceSection: 'order-2 lg:order-2',
  controlsSection: 'order-3 lg:col-span-2 lg:order-3',
}
```

### Component Architecture

```typescript
function Practice() {
  const { lessonId } = useParams<{ lessonId: string }>()
  const navigate = useNavigate()

  // State management
  const [lesson, setLesson] = useState<LessonWithModule | null>(null)
  const [practiceState, setPracticeState] = useState<PracticeState>('ready')
  const [currentPrediction, setCurrentPrediction] = useState<PredictionResult | null>(null)

  // Load lesson data
  useEffect(() => {
    loadLesson()
  }, [lessonId])

  // Handle camera landmarks
  const handleLandmarksDetected = useCallback((landmarks: HandLandmark[][], dimensions: VideoDimensions) => {
    // Process landmarks for gesture recognition
    // Update current prediction
  }, [])

  // Handle practice controls
  const handleStartPractice = () => setPracticeState('active')
  const handleStopPractice = () => setPracticeState('paused')
  const handleResetPractice = () => {
    setPracticeState('ready')
    setCurrentPrediction(null)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PracticeHeader lesson={lesson} onBack={() => navigate(`/lessons/${lessonId}`)} />

      <div className={layoutClasses.container}>
        <div className={layoutClasses.grid}>
          {/* Camera Section */}
          <div className={layoutClasses.cameraSection}>
            <CameraSection
              lesson={lesson}
              practiceState={practiceState}
              onLandmarksDetected={handleLandmarksDetected}
            />
          </div>

          {/* Reference Section */}
          <div className={layoutClasses.referenceSection}>
            <ReferenceSection lesson={lesson} />
          </div>
        </div>

        {/* Controls Section */}
        <div className={layoutClasses.controlsSection}>
          <ControlsSection
            practiceState={practiceState}
            onStart={handleStartPractice}
            onStop={handleStopPractice}
            onReset={handleResetPractice}
          />
        </div>

        {/* Feedback Section */}
        <FeedbackSection
          currentPrediction={currentPrediction}
          practiceState={practiceState}
        />
      </div>
    </div>
  )
}
```

### Practice State Management

```typescript
type PracticeState = 'ready' | 'active' | 'paused' | 'completed'

interface PredictionResult {
  gesture: string
  confidence: number
  timestamp: number
  isCorrect: boolean
}

function usePracticeState(lesson: LessonWithModule | null) {
  const [state, setState] = useState<PracticeState>('ready')
  const [predictions, setPredictions] = useState<PredictionResult[]>([])
  const [startTime, setStartTime] = useState<number | null>(null)

  const startPractice = () => {
    setState('active')
    setStartTime(Date.now())
  }

  const pausePractice = () => setState('paused')

  const resetPractice = () => {
    setState('ready')
    setPredictions([])
    setStartTime(null)
  }

  const addPrediction = (prediction: Omit<PredictionResult, 'timestamp'>) => {
    const newPrediction = { ...prediction, timestamp: Date.now() }
    setPredictions(prev => [...prev, newPrediction])

    // Check if practice should complete
    if (newPrediction.isCorrect && predictions.filter(p => p.isCorrect).length >= 5) {
      setState('completed')
    }
  }

  return {
    state,
    predictions,
    startTime,
    startPractice,
    pausePractice,
    resetPractice,
    addPrediction,
  }
}
```

### Camera Section Component

```typescript
interface CameraSectionProps {
  lesson: LessonWithModule | null
  practiceState: PracticeState
  onLandmarksDetected: (landmarks: HandLandmark[][], dimensions: VideoDimensions) => void
}

function CameraSection({ lesson, practiceState, onLandmarksDetected }: CameraSectionProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Sua Prática
        </h2>
        <p className="text-gray-600">
          Posicione sua mão na câmera e pratique o sinal "{lesson?.gestureName}"
        </p>
      </div>

      <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
        <CameraFrame
          className="w-full h-full"
          onLandmarksDetected={onLandmarksDetected}
        />
      </div>

      {/* Practice instructions overlay */}
      {practiceState === 'ready' && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
          <div className="text-center text-white">
            <div className="text-4xl mb-4">👋</div>
            <p className="text-lg font-medium">Clique em "Começar" para iniciar</p>
          </div>
        </div>
      )}

      {/* Real-time feedback overlay */}
      {practiceState === 'active' && (
        <div className="absolute top-4 right-4 bg-blue-500 text-white px-3 py-2 rounded-lg text-sm font-medium">
          Praticando...
        </div>
      )}
    </div>
  )
}
```

### Reference Section Component

```typescript
interface ReferenceSectionProps {
  lesson: LessonWithModule | null
}

function ReferenceSection({ lesson }: ReferenceSectionProps) {
  return (
    <div className="space-y-6">
      {/* Reference Video */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Vídeo de Referência
        </h3>

        <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
          {lesson?.videoRefUrl ? (
            <video
              src={lesson.videoRefUrl}
              controls
              className="w-full h-full object-contain"
              poster="/images/video-poster.png"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-500">
              <div className="text-center">
                <div className="text-4xl mb-2">🎥</div>
                <p>Vídeo não disponível</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Current Prediction Display */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Reconhecimento Atual
        </h3>

        <div className="text-center py-8">
          <div className="text-4xl mb-4">🤔</div>
          <p className="text-gray-600">Aguardando detecção...</p>
        </div>
      </div>
    </div>
  )
}
```

### Controls Section Component

```typescript
interface ControlsSectionProps {
  practiceState: PracticeState
  onStart: () => void
  onStop: () => void
  onReset: () => void
}

function ControlsSection({ practiceState, onStart, onStop, onReset }: ControlsSectionProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Controles da Prática
      </h3>

      <div className="flex flex-wrap gap-3">
        {practiceState === 'ready' && (
          <button
            onClick={onStart}
            className="px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors"
          >
            ▶️ Começar Prática
          </button>
        )}

        {practiceState === 'active' && (
          <button
            onClick={onStop}
            className="px-6 py-3 bg-yellow-600 text-white font-semibold rounded-lg hover:bg-yellow-700 transition-colors"
          >
            ⏸️ Pausar
          </button>
        )}

        {practiceState === 'paused' && (
          <>
            <button
              onClick={onStart}
              className="px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors"
            >
              ▶️ Continuar
            </button>

            <button
              onClick={onReset}
              className="px-6 py-3 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700 transition-colors"
            >
              🔄 Reiniciar
            </button>
          </>
        )}

        {practiceState === 'completed' && (
          <div className="w-full text-center py-4">
            <div className="text-2xl mb-2">🎉</div>
            <p className="text-green-600 font-medium">Prática concluída!</p>
            <button
              onClick={onReset}
              className="mt-3 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              Praticar Novamente
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
```

---

## Dependencies
- **Blocks:** Story 4.3+ (layout base para feedback)
- **Blocked by:** Story 4.1 ✅ (CameraFrame necessário), Story 3.2 ✅ (contentRepository)
- **Requires:** React Router, CameraFrame component

---

## Definition of Done
- [ ] `src/pages/Practice.tsx` criado e funcional
- [ ] Layout responsivo implementado (desktop 2-colunas, mobile stacked)
- [ ] CameraFrame integrado na seção esquerda/superior
- [ ] Seção de vídeo de referência implementada
- [ ] Painel de controles com botões funcionais
- [ ] Seção de feedback para predições atual
- [ ] Navegação por URL com lessonId
- [ ] Design responsivo e acessível
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
<!-- Dev: How did you verify the practice screen layout works? -->

---

## Senior Developer Review (AI)

<!-- Code Review Agent: Add findings here after *code-review -->

