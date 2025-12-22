# Story 3.1: Criação das Tabelas de Módulos e Lições no Supabase

**Epic:** Epic 3 - Catálogo e Navegação de Conteúdo
**Story ID:** `3-1-criacao-das-tabelas-de-modulos-e-licoes-no-supabase`
**Status:** `done`
**Created:** 2025-12-21
**Priority:** High (base de dados necessária para o catálogo)

---

## User Story

**As a** developer,  
**I want to** create database tables for modules and lessons,  
**So that** content can be stored and retrieved from Supabase.

---

## Acceptance Criteria

**Given** I have access to Supabase database  
**When** I execute the SQL schema  
**Then** The modules table should be created with: id, slug, title, description, difficulty_level, order_index, icon_url  
**And** The lessons table should be created with: id, module_id (FK), gesture_name, display_name, video_ref_url, min_confidence_threshold, xp_reward  
**And** Initial data should be inserted: Alfabeto (iniciante, order 1), Números (iniciante, order 2), Saudações (intermediario, order 3)  
**And** Foreign key constraints should be properly set up  
**And** RLS policies should allow all users to read modules and lessons

---

## Context & Background

### Purpose
Esta é a base de dados necessária para armazenar o catálogo de conteúdo educacional da LIA. Os módulos representam categorias de aprendizado (Alfabeto, Números, Saudações) e as lições são os exercícios específicos dentro de cada módulo.

### Technical Requirements
- **Supabase:** PostgreSQL como backend
- **Tables:** modules, lessons
- **Relationships:** lessons.module_id → modules.id
- **RLS:** Row Level Security para controle de acesso
- **Initial Data:** Dados de exemplo para desenvolvimento

### Architecture Alignment
- **PRD:** F2.1 - Estrutura hierárquica módulos/lições
- **Database:** Supabase PostgreSQL
- **Security:** RLS policies para acesso seguro

---

## Tasks

### Task 1: Design table schemas
- [ ] Define modules table structure
- [ ] Define lessons table structure
- [ ] Plan foreign key relationships
- [ ] Define indexes for performance

### Task 2: Create SQL migration files
- [ ] Create supabase/sql/01_modules.sql
- [ ] Create supabase/sql/02_lessons.sql
- [ ] Include proper constraints and indexes

### Task 3: Add initial data
- [ ] Insert Alfabeto module (iniciante, order 1)
- [ ] Insert Números module (iniciante, order 2)
- [ ] Insert Saudações module (intermediario, order 3)
- [ ] Add sample lessons for each module

### Task 4: Configure RLS policies
- [ ] Enable RLS on both tables
- [ ] Create read policies for all users
- [ ] Test policies work correctly

### Task 5: Create database types
- [ ] Generate TypeScript types from schema
- [ ] Update src/types/database.ts
- [ ] Ensure type safety

---

## Technical Design

### Modules Table Schema

```sql
CREATE TABLE modules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  difficulty_level TEXT CHECK (difficulty_level IN ('iniciante', 'intermediario', 'avancado')),
  order_index INTEGER UNIQUE NOT NULL,
  icon_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_modules_order_index ON modules(order_index);
CREATE INDEX idx_modules_difficulty_level ON modules(difficulty_level);
```

### Lessons Table Schema

```sql
CREATE TABLE lessons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  gesture_name TEXT NOT NULL, -- e.g., "A", "1", "OLA"
  display_name TEXT NOT NULL, -- e.g., "Letra A", "Número 1", "Olá"
  video_ref_url TEXT, -- URL do vídeo de referência
  min_confidence_threshold DECIMAL(3,2) DEFAULT 0.70, -- 0.70 = 70%
  xp_reward INTEGER DEFAULT 10,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Unique constraint per module
  UNIQUE(module_id, gesture_name)
);

-- Indexes
CREATE INDEX idx_lessons_module_id ON lessons(module_id);
CREATE INDEX idx_lessons_module_order ON lessons(module_id, order_index);
```

### Initial Data

```sql
-- Modules
INSERT INTO modules (slug, title, description, difficulty_level, order_index, icon_url) VALUES
('alfabeto', 'Alfabeto', 'Aprenda as letras do alfabeto em Libras', 'iniciante', 1, '/icons/alfabeto.svg'),
('numeros', 'Números', 'Aprenda os números em Libras', 'iniciante', 2, '/icons/numeros.svg'),
('saudacoes', 'Saudações', 'Expressões de saudação em Libras', 'intermediario', 3, '/icons/saudacoes.svg');

-- Sample lessons for Alfabeto
INSERT INTO lessons (module_id, gesture_name, display_name, video_ref_url, min_confidence_threshold, xp_reward, order_index) 
SELECT m.id, 'A', 'Letra A', '/videos/letra-a.mp4', 0.75, 10, 1 FROM modules m WHERE m.slug = 'alfabeto'
UNION ALL
SELECT m.id, 'B', 'Letra B', '/videos/letra-b.mp4', 0.75, 10, 2 FROM modules m WHERE m.slug = 'alfabeto'
UNION ALL
SELECT m.id, 'C', 'Letra C', '/videos/letra-c.mp4', 0.75, 10, 3 FROM modules m WHERE m.slug = 'alfabeto';

-- Similar inserts for Números and Saudações...
```

### RLS Policies

```sql
-- Enable RLS
ALTER TABLE modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;

-- Allow all users to read modules
CREATE POLICY "Allow read access to modules" ON modules
FOR SELECT USING (true);

-- Allow all users to read lessons
CREATE POLICY "Allow read access to lessons" ON lessons
FOR SELECT USING (true);
```

### TypeScript Types

```typescript
// Generated from Supabase
export interface Database {
  public: {
    Tables: {
      modules: {
        Row: {
          id: string
          slug: string
          title: string
          description: string | null
          difficulty_level: 'iniciante' | 'intermediario' | 'avancado'
          order_index: number
          icon_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['modules']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['modules']['Insert']>
      }
      lessons: {
        Row: {
          id: string
          module_id: string
          gesture_name: string
          display_name: string
          video_ref_url: string | null
          min_confidence_threshold: number
          xp_reward: number
          order_index: number
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['lessons']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['lessons']['Insert']>
      }
    }
  }
}
```

---

## Dependencies
- **Blocks:** Story 3.2 (repositorio precisa das tabelas)
- **Blocked by:** Supabase project setup
- **Requires:** Supabase CLI installed

---

## Definition of Done
- [ ] supabase/sql/01_modules.sql criado e funcional
- [ ] supabase/sql/02_lessons.sql criado e funcional
- [ ] Dados iniciais inseridos corretamente
- [ ] Foreign keys e constraints configurados
- [ ] RLS policies permitem leitura para todos os usuários
- [ ] Tipos TypeScript gerados automaticamente
- [ ] Schema testado localmente (se possível)
- [ ] Arquivos commitados no Git

---

## Dev Agent Record

### Implementation Notes
<!-- Dev: Add implementation notes here -->

### Files Changed
<!-- Dev: List files created/modified -->

### Testing
<!-- Dev: How did you verify database schema? -->

---

## Senior Developer Review (AI)

<!-- Code Review Agent: Add findings here after *code-review -->
