# Story 3.3: Página de Catálogo de Módulos

**Epic:** Epic 3 - Catálogo e Navegação de Conteúdo
**Story ID:** `3-3-pagina-de-catalogo-de-modulos`
**Status:** `done`
**Created:** 2025-12-21
**Priority:** High (interface principal do catálogo)

---

## User Story

**As a** user,  
**I want to** see all available modules in a visual catalog,  
**So that** I can choose what to learn.

---

## Acceptance Criteria

**Given** I am logged in and on the modules catalog page  
**When** The page loads  
**Then** I should see all modules displayed as cards or tiles  
**And** Each module should show: title, description, difficulty level, icon  
**And** Modules should be ordered by order_index  
**And** I should see visual indication of my progress per module (not started/in progress/completed)  
**And** I should be able to click on a module to see its lessons

---

## Context & Background

### Purpose
Esta é a página principal do catálogo de conteúdo, onde usuários descobrem e navegam pelos módulos disponíveis. É a porta de entrada para todo o sistema de aprendizado.

### Technical Requirements
- **React Component**: Página funcional com hooks
- **Data Fetching**: Usa contentRepository criado na Story 3.2
- **UI Components**: Cards responsivos com Tailwind CSS
- **Navigation**: React Router para navegação entre módulos
- **Progress Indicators**: Estados visuais de progresso (TODO: integração futura)
- **Responsive Design**: Funciona em desktop e mobile

### Architecture Alignment
- **PRD:** Interface de catálogo organizada
- **Story 3.2 dependency:** Usa o repositório recém-criado
- **UI Components:** Reutilizáveis e acessíveis

---

## Tasks

### Task 1: Create ModuleCard component
- [ ] Create `src/components/modules/ModuleCard.tsx`
- [ ] Design card layout with icon, title, description, difficulty
- [ ] Add progress indicator (placeholder for now)
- [ ] Implement click handler for navigation
- [ ] Add hover and focus states

### Task 2: Create ModulesCatalog page
- [ ] Create `src/pages/ModulesCatalog.tsx`
- [ ] Implement data fetching with useEffect
- [ ] Add loading and error states
- [ ] Create responsive grid layout
- [ ] Integrate with React Router navigation

### Task 3: Implement loading and error states
- [ ] Add skeleton loading for cards
- [ ] Error boundary with retry functionality
- [ ] Empty state for no modules
- [ ] Network error handling

### Task 4: Add navigation to lessons
- [ ] Configure React Router route for module details
- [ ] Pass module data through navigation state
- [ ] Handle navigation errors gracefully

### Task 5: Add progress indicators (placeholder)
- [ ] Design progress badge/indicator UI
- [ ] Add placeholder logic for progress states
- [ ] Prepare for future user progress integration

### Task 6: Create comprehensive tests
- [ ] Unit tests for ModuleCard component
- [ ] Integration tests for ModulesCatalog page
- [ ] Test loading and error states
- [ ] Test navigation functionality

---

## Technical Design

### Component Hierarchy

```
ModulesCatalog (Page)
├── Loading State (Skeleton)
├── Error State (Retry)
├── Empty State (No modules)
└── Modules Grid
    └── ModuleCard[]
        ├── Module Icon
        ├── Module Title
        ├── Module Description
        ├── Difficulty Badge
        ├── Progress Indicator (placeholder)
        └── Click Handler → Navigation
```

### ModuleCard Component

```typescript
interface ModuleCardProps {
  module: Module
  progress?: ModuleProgress // Future integration
  onClick: (module: Module) => void
}

function ModuleCard({ module, progress, onClick }: ModuleCardProps) {
  const getDifficultyColor = (level: DifficultyLevel) => {
    switch (level) {
      case 'iniciante': return 'bg-green-100 text-green-800'
      case 'intermediario': return 'bg-yellow-100 text-yellow-800'
      case 'avancado': return 'bg-red-100 text-red-800'
    }
  }

  const getProgressStatus = () => {
    // Placeholder for future progress integration
    return { status: 'not-started', label: 'Não iniciado' }
  }

  return (
    <div
      className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer p-6"
      onClick={() => onClick(module)}
    >
      {/* Module Icon */}
      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
        {module.iconUrl ? (
          <img src={module.iconUrl} alt="" className="w-8 h-8" />
        ) : (
          <span className="text-2xl">📚</span>
        )}
      </div>

      {/* Module Title */}
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {module.title}
      </h3>

      {/* Module Description */}
      <p className="text-gray-600 text-sm mb-4 line-clamp-2">
        {module.description}
      </p>

      {/* Difficulty Badge */}
      <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getDifficultyColor(module.difficultyLevel)}`}>
        {module.difficultyLevel}
      </span>

      {/* Progress Indicator (placeholder) */}
      <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
        <span>{getProgressStatus().label}</span>
        <span>0%</span>
      </div>
    </div>
  )
}
```

### ModulesCatalog Page

```typescript
function ModulesCatalog() {
  const navigate = useNavigate()
  const [modules, setModules] = useState<Module[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadModules()
  }, [])

  const loadModules = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await contentRepository.getModules()
      setModules(data)
    } catch (err) {
      setError('Erro ao carregar módulos. Tente novamente.')
      console.error('Failed to load modules:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleModuleClick = (module: Module) => {
    navigate(`/modules/${module.slug}`, {
      state: { module }
    })
  }

  if (loading) {
    return <ModulesLoadingSkeleton />
  }

  if (error) {
    return <ModulesErrorState error={error} onRetry={loadModules} />
  }

  if (modules.length === 0) {
    return <ModulesEmptyState />
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Catálogo de Módulos
        </h1>
        <p className="text-gray-600">
          Escolha um módulo para começar sua jornada de aprendizado em Libras
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {modules.map((module) => (
          <ModuleCard
            key={module.id}
            module={module}
            onClick={handleModuleClick}
          />
        ))}
      </div>
    </div>
  )
}
```

### Loading and Error States

```typescript
function ModulesLoadingSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow-md p-6 animate-pulse">
            <div className="w-16 h-16 bg-gray-200 rounded-full mb-4"></div>
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-3 bg-gray-200 rounded mb-4"></div>
            <div className="h-6 bg-gray-200 rounded w-20"></div>
          </div>
        ))}
      </div>
    </div>
  )
}

function ModulesErrorState({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <div className="container mx-auto px-4 py-8 text-center">
      <div className="bg-red-50 border border-red-200 rounded-lg p-8 max-w-md mx-auto">
        <h2 className="text-lg font-semibold text-red-800 mb-2">
          Erro ao carregar módulos
        </h2>
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={onRetry}
          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
        >
          Tentar novamente
        </button>
      </div>
    </div>
  )
}
```

### React Router Integration

```typescript
// In App.tsx or router configuration
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import ModulesCatalog from './pages/ModulesCatalog'
// import ModuleLessons from './pages/ModuleLessons' // Future

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/modules" element={<ModulesCatalog />} />
        {/* <Route path="/modules/:slug" element={<ModuleLessons />} /> */} // Future
      </Routes>
    </BrowserRouter>
  )
}
```

### Future Progress Integration

```typescript
// Placeholder for future user progress integration
interface ModuleProgress {
  moduleId: string
  completedLessons: number
  totalLessons: number
  status: 'not-started' | 'in-progress' | 'completed'
}

// In ModuleCard component
function getProgressInfo(module: Module, progress?: ModuleProgress) {
  if (!progress) {
    return { status: 'not-started', percentage: 0, label: 'Não iniciado' }
  }

  const percentage = (progress.completedLessons / progress.totalLessons) * 100

  switch (progress.status) {
    case 'completed':
      return { status: 'completed', percentage: 100, label: 'Concluído' }
    case 'in-progress':
      return { status: 'in-progress', percentage, label: `${Math.round(percentage)}% concluído` }
    default:
      return { status: 'not-started', percentage: 0, label: 'Não iniciado' }
  }
}
```

---

## Dependencies
- **Blocks:** Story 3.4 (dashboard precisa do catálogo)
- **Blocked by:** Story 3.2 ✅ (repositorio necessário)
- **Requires:** contentRepository, React Router, Tailwind CSS

---

## Definition of Done
- [ ] `src/components/modules/ModuleCard.tsx` criado e estilizado
- [ ] `src/pages/ModulesCatalog.tsx` implementado com data fetching
- [ ] Estados de loading, erro e vazio implementados
- [ ] Navegação para detalhes do módulo configurada
- [ ] Indicadores de progresso (placeholders) adicionados
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
<!-- Dev: How did you verify the catalog page works? -->

---

## Senior Developer Review (AI)

<!-- Code Review Agent: Add findings here after *code-review -->

