# Story 3.5: Página de Detalhes da Lição

**Epic:** Epic 3 - Catálogo e Navegação de Conteúdo
**Story ID:** `3-5-pagina-de-detalhes-da-licao`
**Status:** `done`
**Priority:** High (última story do Epic 3 - fecha o catálogo)

---

## User Story

**As a** user,  
**I want to** view lesson details before practicing,  
**So that** I know what I'm about to learn.

---

## Acceptance Criteria

**Given** I am viewing a lesson detail page  
**When** The page loads  
**Then** I should see the lesson's video/image reference  
**And** I should see a textual description of the gesture  
**And** I should see the practice objective  
**And** I should see the XP reward for completing the lesson  
**And** I should see a "Start Practice" button if the lesson is unlocked  
**And** If the lesson is locked, I should see why (previous lesson not completed)

---

## Context & Background

### Purpose
Esta é a página final do fluxo de navegação do catálogo. Ela serve como ponte entre a descoberta de conteúdo (catálogo/dashboard) e a prática efetiva (prática com câmera). Aqui o usuário toma a decisão final de começar a praticar uma lição específica.

### Technical Requirements
- **React Component**: Página funcional com URL params
- **Data Fetching**: Carregar lição específica + dados do módulo
- **Video Player**: Suporte básico a vídeos de referência
- **Conditional Rendering**: Estados locked/unlocked
- **Navigation**: Integração com React Router
- **Responsive**: Funciona em desktop e mobile

### Architecture Alignment
- **PRD:** Página de detalhes antes da prática
- **Story 3.2 dependency:** Usa contentRepository.getLessonById()
- **Epic 4 bridge:** Prepara para interface de prática
- **Navigation Flow:** Dashboard → Catálogo → Detalhes → Prática

---

## Tasks

### Task 1: Create LessonDetail page component
- [ ] Create `src/pages/LessonDetail.tsx`
- [ ] Implement URL parameter handling for lessonId
- [ ] Add loading and error states
- [ ] Create responsive layout structure

### Task 2: Implement video reference display
- [ ] Add video player component for reference videos
- [ ] Handle different video formats and fallbacks
- [ ] Add video controls (play/pause, fullscreen)
- [ ] Implement loading states for video

### Task 3: Add lesson description and objectives
- [ ] Display lesson title and gesture name
- [ ] Show detailed description of the gesture
- [ ] Add practice objectives and tips
- [ ] Include module context information

### Task 4: Implement XP reward display
- [ ] Show XP reward prominently
- [ ] Add visual indicators for reward value
- [ ] Connect to user progress system (future)

### Task 5: Create Start Practice button
- [ ] Add prominent CTA button for unlocked lessons
- [ ] Implement navigation to practice page (placeholder)
- [ ] Add loading state during navigation
- [ ] Style button with clear visual hierarchy

### Task 6: Implement locked/unlocked states
- [ ] Add logic to determine lesson availability
- [ ] Show locked state with explanation
- [ ] Display requirements for unlocking
- [ ] Visual distinction between states

### Task 7: Create comprehensive tests
- [ ] Unit tests for LessonDetail page
- [ ] Test different lesson states (locked/unlocked)
- [ ] Test video loading and error states
- [ ] Test navigation functionality

---

## Technical Design

### Page Structure

```
LessonDetail Page
├── Loading State (Skeleton)
├── Error State (Not found / Network error)
├── Lesson Header
│   ├── Breadcrumb Navigation
│   ├── Lesson Title & Gesture
│   └── Module Context
├── Main Content
│   ├── Video Reference Section
│   │   ├── Video Player
│   │   └── Fallback Image/Text
│   └── Lesson Details
│       ├── Description
│       ├── Practice Objectives
│       └── XP Reward
├── Action Section
│   ├── Start Practice Button (unlocked)
│   ├── Locked Message (locked)
│   └── Progress Requirements
└── Related Lessons (future)
```

### LessonDetail Page Component

```typescript
function LessonDetail() {
  const { lessonId } = useParams<{ lessonId: string }>()
  const navigate = useNavigate()
  const [lesson, setLesson] = useState<LessonWithModule | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadLesson()
  }, [lessonId])

  const loadLesson = async () => {
    if (!lessonId) {
      setError('ID da lição não fornecido')
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const lessonData = await contentRepository.getLessonById(lessonId)

      if (!lessonData) {
        setError('Lição não encontrada')
        return
      }

      setLesson(lessonData)
    } catch (err) {
      console.error('Failed to load lesson:', err)
      setError('Erro ao carregar lição')
    } finally {
      setLoading(false)
    }
  }

  const handleStartPractice = () => {
    // Future: Navigate to practice page
    alert(`Funcionalidade em desenvolvimento!\n\nIniciando prática da lição: ${lesson?.displayName}`)
    // navigate(`/practice/${lessonId}`)
  }

  const isLessonLocked = () => {
    // Placeholder: Simple logic based on lesson order
    // Future: Check actual user progress
    return lesson ? lesson.orderIndex > 3 : false
  }

  if (loading) {
    return <LessonDetailSkeleton />
  }

  if (error || !lesson) {
    return <LessonDetailError error={error || 'Lição não encontrada'} onRetry={loadLesson} />
  }

  const locked = isLessonLocked()

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <LessonDetailHeader lesson={lesson} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
          {/* Video Section */}
          <LessonVideoSection lesson={lesson} />

          {/* Details Section */}
          <LessonDetailsSection lesson={lesson} />
        </div>

        {/* Action Section */}
        <LessonActionSection
          lesson={lesson}
          locked={locked}
          onStartPractice={handleStartPractice}
        />
      </div>
    </div>
  )
}
```

### Video Reference Component

```typescript
interface VideoPlayerProps {
  videoUrl: string | null
  title: string
}

function VideoPlayer({ videoUrl, title }: VideoPlayerProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  if (!videoUrl) {
    return (
      <div className="aspect-video bg-gray-200 rounded-lg flex items-center justify-center">
        <div className="text-center text-gray-500">
          <div className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🎥</span>
          </div>
          <p>Vídeo de referência não disponível</p>
        </div>
      </div>
    )
  }

  return (
    <div className="aspect-video bg-black rounded-lg overflow-hidden">
      {loading && (
        <div className="w-full h-full flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      )}

      {error ? (
        <div className="w-full h-full flex items-center justify-center bg-gray-800 text-white">
          <div className="text-center">
            <span className="text-4xl mb-4 block">⚠️</span>
            <p>Erro ao carregar vídeo</p>
          </div>
        </div>
      ) : (
        <video
          className="w-full h-full object-contain"
          controls
          preload="metadata"
          onLoadStart={() => setLoading(true)}
          onLoadedData={() => setLoading(false)}
          onError={() => {
            setLoading(false)
            setError(true)
          }}
        >
          <source src={videoUrl} type="video/mp4" />
          Seu navegador não suporta o elemento de vídeo.
        </video>
      )}
    </div>
  )
}
```

### Locked State Component

```typescript
interface LockedStateProps {
  lesson: LessonWithModule
  requirements: string[]
}

function LockedState({ lesson, requirements }: LockedStateProps) {
  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
      <div className="flex items-start">
        <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mr-4">
          <span className="text-2xl">🔒</span>
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">
            Esta lição está bloqueada
          </h3>
          <p className="text-yellow-700 mb-4">
            Você precisa completar os seguintes requisitos para desbloquear esta lição:
          </p>
          <ul className="space-y-2">
            {requirements.map((req, index) => (
              <li key={index} className="flex items-center text-yellow-700">
                <span className="w-2 h-2 bg-yellow-500 rounded-full mr-3"></span>
                {req}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
```

### Practice Button Component

```typescript
interface StartPracticeButtonProps {
  lesson: LessonWithModule
  onClick: () => void
  disabled?: boolean
}

function StartPracticeButton({ lesson, onClick, disabled = false }: StartPracticeButtonProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            Pronto para praticar?
          </h3>
          <p className="text-gray-600 text-sm">
            Ganhe {lesson.xpReward} XP ao completar esta lição
          </p>
        </div>

        <button
          onClick={onClick}
          disabled={disabled}
          className={`
            px-8 py-3 rounded-lg font-semibold text-white transition-all
            ${disabled
              ? 'bg-gray-300 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 shadow-lg hover:shadow-xl'
            }
          `}
        >
          {disabled ? 'Bloqueado' : 'Começar Prática'}
        </button>
      </div>

      {/* Progress indicator */}
      <div className="mt-4 flex items-center text-sm text-gray-600">
        <span className="font-medium">Objetivo:</span>
        <span className="ml-2">Praticar o sinal "{lesson.gestureName}" por 30 segundos</span>
      </div>
    </div>
  )
}
```

### URL Routing

```typescript
// In App.tsx or router configuration
import LessonDetail from './pages/LessonDetail'

function App() {
  return (
    <Routes>
      {/* Existing routes */}
      <Route path="/lessons/:lessonId" element={<LessonDetail />} />
      {/* Future: <Route path="/practice/:lessonId" element={<LessonPractice />} /> */}
    </Routes>
  )
}
```

---

## Dependencies
- **Blocks:** Epic 4 (interface de prática)
- **Blocked by:** Story 3.2 ✅ (repositorio), Story 3.4 ✅ (navegação do dashboard)
- **Requires:** contentRepository, React Router, Video APIs

---

## Definition of Done
- [ ] `src/pages/LessonDetail.tsx` criado e funcional
- [ ] Vídeo de referência reproduzível
- [ ] Descrição detalhada da lição exibida
- [ ] Objetivos de prática claros
- [ ] Recompensa XP visível
- [ ] Botão "Start Practice" funcional (placeholder)
- [ ] Estados locked/unlocked implementados
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
<!-- Dev: How did you verify the lesson detail page works? -->

---

## Senior Developer Review (AI)

<!-- Code Review Agent: Add findings here after *code-review -->

