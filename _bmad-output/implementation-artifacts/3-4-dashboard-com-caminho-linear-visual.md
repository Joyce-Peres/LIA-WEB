# Story 3.4: Dashboard com Caminho Linear Visual

**Epic:** Epic 3 - Catálogo e Navegação de Conteúdo
**Story ID:** `3-4-dashboard-com-caminho-linear-visual`
**Status:** `done`
**Created:** 2025-12-21
**Priority:** High (dashboard principal do usuário)

---

## User Story

**As a** user,  
**I want to** see my learning progress as a linear path with visual indicators,  
**So that** I can understand my progress through the content.

---

## Acceptance Criteria

**Given** I am on the dashboard  
**When** I view the learning path  
**Then** I should see a linear path showing all lessons  
**And** Completed lessons should show yellow stars  
**And** In-progress lessons should show purple stars  
**And** Locked lessons should show light gray stars  
**And** The path should have smooth animations when lessons are completed  
**And** Clicking on a lesson should navigate to the lesson page (if unlocked)

---

## Context & Background

### Purpose
Este é o dashboard principal do usuário, mostrando todo o progresso de aprendizado através de um caminho visual linear. É a tela que motiva o usuário a continuar aprendendo, mostrando claramente o que já foi conquistado e o que ainda está por vir.

### Technical Requirements
- **React Component**: Dashboard funcional com hooks
- **Data Fetching**: Carregar lições e progresso do usuário
- **Visual Path**: Caminho linear com estrelas conectadas
- **Animations**: Transições suaves entre estados
- **Responsive**: Funciona em desktop e mobile
- **Accessibility**: Navegação por teclado e leitores de tela

### Architecture Alignment
- **PRD:** Dashboard visual de progresso
- **Story 3.2 dependency:** Usa contentRepository
- **Future Integration:** Conectará com sistema de progresso do usuário
- **UI Components:** Reutilizáveis e animados

---

## Tasks

### Task 1: Create LearningPath component
- [ ] Create `src/components/dashboard/LearningPath.tsx`
- [ ] Implement linear path layout with connecting lines
- [ ] Add responsive design for different screen sizes
- [ ] Prepare for lesson star integration

### Task 2: Create LessonStar component
- [ ] Create `src/components/dashboard/LessonStar.tsx`
- [ ] Implement three states: completed (yellow), in-progress (purple), locked (gray)
- [ ] Add click handlers for navigation
- [ ] Include hover animations and transitions

### Task 3: Create Dashboard page
- [ ] Create `src/pages/Dashboard.tsx` (update existing)
- [ ] Integrate LearningPath component
- [ ] Add user greeting and statistics
- [ ] Implement data loading for lessons and progress

### Task 4: Implement progress state management
- [ ] Create progress state logic (placeholder for now)
- [ ] Add lesson completion simulation
- [ ] Prepare data structure for user progress

### Task 5: Add animations and transitions
- [ ] Implement star state change animations
- [ ] Add path connection animations
- [ ] Smooth transitions between locked/in-progress/completed

### Task 6: Create comprehensive tests
- [ ] Unit tests for LearningPath and LessonStar components
- [ ] Test different progress states
- [ ] Test animations and interactions
- [ ] Accessibility testing

---

## Technical Design

### Component Hierarchy

```
Dashboard (Page)
├── UserGreeting
├── ProgressStats
├── LearningPath
    ├── PathConnector (visual line)
    └── LessonStar[]
        ├── StarIcon (SVG)
        ├── LessonInfo (tooltip/hover)
        └── ClickHandler → Navigation
```

### LearningPath Component

```typescript
interface LearningPathProps {
  lessons: Lesson[]
  userProgress: UserProgress // Future integration
  onLessonClick: (lesson: Lesson) => void
}

function LearningPath({ lessons, userProgress, onLessonClick }: LearningPathProps) {
  // Group lessons by module for better organization
  const groupedLessons = useMemo(() => {
    const groups: Record<string, Lesson[]> = {}
    lessons.forEach(lesson => {
      if (!groups[lesson.moduleId]) {
        groups[lesson.moduleId] = []
      }
      groups[lesson.moduleId].push(lesson)
    })
    return groups
  }, [lessons])

  return (
    <div className="learning-path">
      {Object.entries(groupedLessons).map(([moduleId, moduleLessons]) => (
        <div key={moduleId} className="module-section">
          <ModuleHeader moduleId={moduleId} />
          <div className="lesson-path">
            {moduleLessons.map((lesson, index) => (
              <React.Fragment key={lesson.id}>
                <LessonStar
                  lesson={lesson}
                  status={getLessonStatus(lesson, userProgress)}
                  onClick={() => onLessonClick(lesson)}
                />
                {index < moduleLessons.length - 1 && (
                  <PathConnector
                    fromStatus={getLessonStatus(lesson, userProgress)}
                    toStatus={getLessonStatus(moduleLessons[index + 1], userProgress)}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
```

### LessonStar Component

```typescript
interface LessonStarProps {
  lesson: Lesson
  status: 'locked' | 'in-progress' | 'completed'
  onClick: () => void
}

function LessonStar({ lesson, status, onClick }: LessonStarProps) {
  const getStarColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-yellow-400 fill-yellow-400'
      case 'in-progress': return 'text-purple-500 fill-purple-500'
      case 'locked': return 'text-gray-300 fill-gray-300'
      default: return 'text-gray-300 fill-gray-300'
    }
  }

  const isClickable = status !== 'locked'

  return (
    <div
      className={`lesson-star ${isClickable ? 'cursor-pointer' : 'cursor-not-allowed'}`}
      onClick={isClickable ? onClick : undefined}
    >
      <div className="relative">
        {/* Star Icon */}
        <svg
          className={`w-12 h-12 transition-all duration-500 ${getStarColor(status)} ${
            status === 'completed' ? 'animate-pulse' : ''
          }`}
          viewBox="0 0 24 24"
        >
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>

        {/* Glow effect for completed stars */}
        {status === 'completed' && (
          <div className="absolute inset-0 bg-yellow-400 rounded-full opacity-20 animate-ping"></div>
        )}

        {/* Tooltip with lesson info */}
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="bg-gray-800 text-white px-3 py-2 rounded-lg text-sm whitespace-nowrap">
            {lesson.displayName}
            {status === 'locked' && <div className="text-xs text-gray-400">Bloqueado</div>}
            {status === 'in-progress' && <div className="text-xs text-purple-300">Em andamento</div>}
            {status === 'completed' && <div className="text-xs text-yellow-300">Concluído</div>}
          </div>
        </div>
      </div>
    </div>
  )
}
```

### PathConnector Component

```typescript
interface PathConnectorProps {
  fromStatus: 'locked' | 'in-progress' | 'completed'
  toStatus: 'locked' | 'in-progress' | 'completed'
}

function PathConnector({ fromStatus, toStatus }: PathConnectorProps) {
  const getConnectorColor = () => {
    if (fromStatus === 'completed' && toStatus === 'completed') {
      return 'bg-yellow-400'
    }
    if (fromStatus === 'completed' || toStatus === 'in-progress') {
      return 'bg-purple-400'
    }
    return 'bg-gray-300'
  }

  return (
    <div className="path-connector flex-1 h-1 mx-2 rounded-full transition-colors duration-500">
      <div className={`h-full rounded-full ${getConnectorColor()}`}></div>
    </div>
  )
}
```

### Dashboard Page Integration

```typescript
function Dashboard() {
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [loading, setLoading] = useState(true)
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)

      // Load all lessons from all modules
      const allLessons: Lesson[] = []
      const modules = await contentRepository.getModules()

      for (const module of modules) {
        const moduleLessons = await contentRepository.getLessonsByModule(module.id)
        allLessons.push(...moduleLessons)
      }

      setLessons(allLessons.sort((a, b) => a.orderIndex - b.orderIndex))

      // TODO: Load user progress
      // const progress = await progressRepository.getUserProgress()
      // setUserProgress(progress)

    } catch (err) {
      console.error('Failed to load dashboard data:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleLessonClick = (lesson: Lesson) => {
    // TODO: Check if lesson is unlocked
    // TODO: Navigate to lesson page
    alert(`Lição: ${lesson.displayName}\n\nFuncionalidade em desenvolvimento!`)
  }

  if (loading) {
    return <DashboardLoadingSkeleton />
  }

  return (
    <div className="dashboard min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* User Greeting */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Bem-vindo de volta, {userName}!
          </h1>
          <p className="text-gray-600 mt-2">
            Continue sua jornada de aprendizado em Libras
          </p>
        </div>

        {/* Progress Stats */}
        <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard title="Lições Completadas" value="12" icon="⭐" />
          <StatCard title="Em Andamento" value="3" icon="🔥" />
          <StatCard title="Sequência Atual" value="7 dias" icon="📈" />
        </div>

        {/* Learning Path */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">
            Seu Caminho de Aprendizado
          </h2>
          <LearningPath
            lessons={lessons}
            userProgress={userProgress}
            onLessonClick={handleLessonClick}
          />
        </div>
      </div>
    </div>
  )
}
```

### Progress State Logic (Placeholder)

```typescript
// Placeholder for future user progress integration
function getLessonStatus(lesson: Lesson, userProgress?: UserProgress): 'locked' | 'in-progress' | 'completed' {
  if (!userProgress) {
    // For demo: first few lessons are completed, some in progress
    const lessonIndex = parseInt(lesson.gestureName) || 0
    if (lessonIndex <= 5) return 'completed'
    if (lessonIndex <= 8) return 'in-progress'
    return 'locked'
  }

  // Future: actual progress logic
  const progress = userProgress.lessons.find(p => p.lessonId === lesson.id)
  if (!progress) return 'locked'
  if (progress.isCompleted) return 'completed'
  if (progress.attempts > 0) return 'in-progress'
  return 'locked'
}
```

### Animations and Transitions

```css
/* Custom animations for star transitions */
@keyframes star-glow {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.2); opacity: 0.8; }
}

.star-completed {
  animation: star-glow 2s ease-in-out infinite;
}

/* Path connector animations */
.path-connector {
  position: relative;
  overflow: hidden;
}

.path-connector::after {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
  animation: shimmer 2s infinite;
}

@keyframes shimmer {
  0% { left: -100%; }
  100% { left: 100%; }
}
```

---

## Dependencies
- **Blocks:** Story 3.5 (página de lição usa navegação do dashboard)
- **Blocked by:** Story 3.2 ✅ (repositorio necessário), Story 3.3 ✅ (catálogo base)
- **Requires:** contentRepository, React Router, Tailwind CSS

---

## Definition of Done
- [ ] `src/components/dashboard/LearningPath.tsx` criado e implementado
- [ ] `src/components/dashboard/LessonStar.tsx` com três estados visuais
- [ ] `src/pages/Dashboard.tsx` integrado com caminho de aprendizado
- [ ] Estados visuais: amarelo (concluído), roxo (andamento), cinza (bloqueado)
- [ ] Animações suaves de transição entre estados
- [ ] Navegação funcional para lições desbloqueadas
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
<!-- Dev: How did you verify the learning path dashboard works? -->

---

## Senior Developer Review (AI)

<!-- Code Review Agent: Add findings here after *code-review -->

