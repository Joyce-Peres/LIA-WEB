<!-- Pivot: story reescrita para remover dependência de serviços externos -->
# Story 1.2: Autenticação local (sem serviços externos)

Status: done

## Story

As a user,
I want to sign in without any external services,
so that I can use the LIA Web MVP without costs and without depender de terceiros.

## Acceptance Criteria

1. **Given** I am on the login page  
   **When** I click the login button  
   **Then** a local session should be created and persisted in the browser  
   **And** I should be redirected to the dashboard  
   **And** I should be able to sign out, which clears the local session  
2. **Given** I access a protected route without a session  
   **When** I navigate to `/dashboard`  
   **Then** I should be redirected to `/login`

## Tasks / Subtasks

- [x] Task 1: Implement local auth/session (AC: 1, 2)
  - [x] Create `src/lib/auth.ts` with session persistence and subscription API
  - [x] Update `src/pages/Login.tsx` to create local session and navigate to `/dashboard`
  - [x] Update `src/pages/Dashboard.tsx` to gate access and support sign out
  - [x] Keep `/auth/callback` route compatible (no external OAuth in MVP)

## Dev Agent Record

### Completion Notes List

- ✅ Local session implemented via `localStorage` in `src/lib/auth.ts`
- ✅ Login flow now works without Google/Supabase (button: "Entrar (modo local)")
- ✅ Dashboard is protected and supports logout
- ✅ Build/lint succeeded after pivot

### File List

- src/lib/auth.ts
- src/pages/Login.tsx
- src/pages/Dashboard.tsx
- src/pages/AuthCallback.tsx


