# Story 3.2: Serviço de Repositório para Módulos e Lições

**Epic:** Epic 3 - Catálogo e Navegação de Conteúdo
**Story ID:** `3-2-servico-de-repositorio-para-modulos-e-licoes`
**Status:** `done`
**Created:** 2025-12-21
**Priority:** High (precisa da Story 3.1 ✅)

---

## User Story

**As a** developer,  
**I want to** create repository functions for fetching modules and lessons,  
**So that** components can easily access content data.

---

## Acceptance Criteria

**Given** I have Supabase client configured  
**When** I call the repository functions  
**Then** getModules() should return all modules ordered by order_index  
**And** getLessonsByModule(moduleId) should return all lessons for a module  
**And** getLessonById(lessonId) should return a specific lesson with module info  
**And** All functions should handle errors and return null on failure  
**And** Functions should be typed with TypeScript interfaces

---

## Context & Background

### Purpose
O serviço de repositório é a camada de abstração entre a UI e o banco de dados Supabase. Ele fornece funções tipadas e seguras para consultar módulos e lições, centralizando a lógica de acesso aos dados.

### Technical Requirements
- **Cliente Supabase**: Usar @supabase/supabase-js
- **Tipos TypeScript**: Interfaces fortemente tipadas
- **Tratamento de erros**: Graceful error handling
- **Ordenação**: Resultados ordenados por order_index
- **Relações**: Consultas com JOIN para dados relacionados

### Architecture Alignment
- **PRD:** Acesso organizado ao catálogo de conteúdo
- **Story 3.1 dependency:** Usa tabelas criadas na story anterior
- **Service Layer:** Abstração entre UI e dados

---

## Tasks

### Task 1: Create repository interfaces
- [ ] Define ContentRepository interface
- [ ] Define query options and response types
- [ ] Import database types from previous story

### Task 2: Implement Supabase client setup
- [ ] Create Supabase client instance
- [ ] Configure connection (URL and anon key)
- [ ] Handle environment variables

### Task 3: Implement getModules() function
- [ ] Query modules table ordered by order_index
- [ ] Include optional filtering by difficulty_level
- [ ] Return typed Module[] array
- [ ] Handle query errors gracefully

### Task 4: Implement lesson queries
- [ ] getLessonsByModule(moduleId): Query lessons for specific module
- [ ] getLessonById(lessonId): Get single lesson with module join
- [ ] Order results by order_index
- [ ] Include error handling

### Task 5: Implement module queries
- [ ] getModuleById(id): Get single module
- [ ] getModuleBySlug(slug): Get module by URL slug
- [ ] getModuleWithLessons(moduleId): Module + all its lessons

### Task 6: Add utility functions
- [ ] countLessonsByModule(): Count lessons per module
- [ ] getModulesWithStats(): Modules with lesson counts
- [ ] validateModuleSlug(): Check if slug exists

### Task 7: Create comprehensive tests
- [ ] Unit tests for all repository functions
- [ ] Mock Supabase client responses
- [ ] Test error scenarios
- [ ] Test data transformation

---

## Technical Design

### Repository Interface

```typescript
export interface ContentRepository {
  // Module operations
  getModules(options?: GetModulesOptions): Promise<Module[]>
  getModuleById(id: string): Promise<Module | null>
  getModuleBySlug(slug: string): Promise<Module | null>
  getModuleWithLessons(moduleId: string): Promise<ModuleWithLessons | null>

  // Lesson operations
  getLessonsByModule(moduleId: string, options?: GetLessonsOptions): Promise<Lesson[]>
  getLessonById(lessonId: string): Promise<LessonWithModule | null>

  // Utility operations
  countLessonsByModule(moduleId: string): Promise<number>
  getModulesWithStats(): Promise<ModuleWithStats[]>
}
```

### Query Options

```typescript
export interface GetModulesOptions {
  difficultyLevel?: DifficultyLevel
  includeLessonCount?: boolean
}

export interface GetLessonsOptions {
  limit?: number
  offset?: number
}
```

### Supabase Client Setup

```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

### Implementation Examples

#### getModules()
```typescript
async getModules(options: GetModulesOptions = {}): Promise<Module[]> {
  try {
    let query = supabase
      .from('modules')
      .select('*')
      .order('order_index', { ascending: true })

    if (options.difficultyLevel) {
      query = query.eq('difficulty_level', options.difficultyLevel)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching modules:', error)
      return []
    }

    return data || []
  } catch (err) {
    console.error('Failed to get modules:', err)
    return []
  }
}
```

#### getLessonsByModule()
```typescript
async getLessonsByModule(moduleId: string, options: GetLessonsOptions = {}): Promise<Lesson[]> {
  try {
    let query = supabase
      .from('lessons')
      .select('*')
      .eq('module_id', moduleId)
      .order('order_index', { ascending: true })

    if (options.limit) {
      query = query.limit(options.limit)
    }

    if (options.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching lessons:', error)
      return []
    }

    return data || []
  } catch (err) {
    console.error('Failed to get lessons:', err)
    return []
  }
}
```

#### getLessonById()
```typescript
async getLessonById(lessonId: string): Promise<LessonWithModule | null> {
  try {
    const { data, error } = await supabase
      .from('lessons')
      .select(`
        *,
        modules (
          id,
          slug,
          title,
          description,
          difficulty_level,
          order_index,
          icon_url,
          created_at,
          updated_at
        )
      `)
      .eq('id', lessonId)
      .single()

    if (error) {
      console.error('Error fetching lesson:', error)
      return null
    }

    if (!data) return null

    return {
      ...data,
      module: data.modules
    }
  } catch (err) {
    console.error('Failed to get lesson:', err)
    return null
  }
}
```

### Error Handling Strategy

```typescript
// Centralized error handling
function handleSupabaseError(operation: string, error: any): null {
  console.error(`Repository ${operation} error:`, error)
  return null
}

// Usage in methods
const { data, error } = await supabase.from('modules').select('*')
if (error) return handleSupabaseError('getModules', error)
```

### Type Safety

```typescript
// Ensure database types match application types
type DatabaseModule = Database['public']['Tables']['modules']['Row']
type DatabaseLesson = Database['public']['Tables']['lessons']['Row']

// Transform functions if needed
function transformModule(dbModule: DatabaseModule): Module {
  return {
    ...dbModule,
    difficultyLevel: dbModule.difficulty_level,
    orderIndex: dbModule.order_index,
    iconUrl: dbModule.icon_url,
    createdAt: dbModule.created_at,
    updatedAt: dbModule.updated_at,
  }
}
```

---

## Dependencies
- **Blocks:** Story 3.3 (página de catálogo usa o repositório)
- **Blocked by:** Story 3.1 ✅ (tabelas necessárias)
- **Requires:** @supabase/supabase-js, tipos database

---

## Definition of Done
- [ ] `src/repositories/contentRepository.ts` criado e implementado
- [ ] Cliente Supabase configurado com env vars
- [ ] getModules() retorna módulos ordenados por order_index
- [ ] getLessonsByModule() retorna lições de um módulo
- [ ] getLessonById() retorna lição com dados do módulo
- [ ] Todas funções com tratamento de erro robusto
- [ ] Interfaces TypeScript fortemente tipadas
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
<!-- Dev: How did you verify repository functions work? -->

---

## Senior Developer Review (AI)

<!-- Code Review Agent: Add findings here after *code-review -->

