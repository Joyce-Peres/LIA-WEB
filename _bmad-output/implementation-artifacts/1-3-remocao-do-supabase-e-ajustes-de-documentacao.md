<!-- Pivot: remover Supabase para manter MVP 100% local -->
# Story 1.3: Remoção do Supabase e ajustes de documentação (modo local)

Status: done

## Story

As a developer,
I want to remove Supabase dependencies and update documentation to match a local-only MVP,
so that the project has no external service requirements or cost risks.

## Acceptance Criteria

1. **Given** the project is set to run locally  
   **When** I run `npm install`, `npm run build`, and `npm run lint`  
   **Then** everything should pass without requiring any Supabase environment variables  
2. **Given** project docs and BMAD artifacts exist  
   **When** I read PRD/Architecture/Epics/Test Design  
   **Then** they should reflect the local-only MVP and treat Supabase as optional/future

## Tasks / Subtasks

- [x] Task 1: Remove Supabase dependency (AC: 1)
  - [x] Remove `@supabase/supabase-js` from `package.json`
  - [x] Delete `src/lib/supabase.ts`
  - [x] Remove Supabase env typing from `src/vite-env.d.ts`
  - [x] Update lockfile via `npm install`

- [x] Task 2: Update docs + BMAD artifacts for local-only MVP (AC: 2)
  - [x] Update `docs/prd.md` and `docs/architeture.md`
  - [x] Mark `docs/supabase-setup.md` as optional/future
  - [x] Update `_bmad-output/epics.md` and `_bmad-output/test-design-system.md`
  - [x] Update `_bmad-output/implementation-artifacts/sprint-status.yaml` to reflect new story slugs

## Dev Agent Record

### Completion Notes List

- ✅ Supabase removed; project builds/lints without env vars
- ✅ Docs updated to local-only MVP; Supabase marked optional/future
- ✅ BMAD artifacts aligned (epics/test design/sprint status)

### File List

- package.json
- package-lock.json
- src/vite-env.d.ts
- docs/prd.md
- docs/architeture.md
- docs/supabase-setup.md
- _bmad-output/epics.md
- _bmad-output/test-design-system.md
- _bmad-output/implementation-artifacts/sprint-status.yaml
- _bmad-output/implementation-artifacts/1-2-autenticacao-local-sem-servicos-externos.md
- _bmad-output/implementation-artifacts/1-3-remocao-do-supabase-e-ajustes-de-documentacao.md


