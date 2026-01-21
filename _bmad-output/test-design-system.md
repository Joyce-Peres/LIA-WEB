# System-Level Test Design: LIA Web

**Date:** 2025-12-21
**Author:** TEA (Test Engineering Architect)
**Status:** Draft
**Mode:** System-Level (Phase 3 - Solutioning)

---

## Executive Summary

**Scope:** System-level testability review for LIA Web architecture before implementation-readiness gate check.

**Architecture Overview:**
- **Type:** Aplicação Web (PWA opcional) em **modo local** (sem backend)
- **AI Processing:** 100% edge computing (browser-based)
- **Backend:** None (MVP local-only; browser storage)
- **Frontend:** Angular 21 + TypeScript (Jest para testes)
- **ML Stack:** TensorFlow.js + MediaPipe Hands

**Testability Assessment Summary:**
- **Controllability:** ⚠️ CONCERNS (MediaPipe/TF.js require real hardware; storage local precisa de estratégia de reset/isolamento)
- **Observability:** ✅ PASS (logs no cliente + browser DevTools)
- **Reliability:** ⚠️ CONCERNS (Browser-based ML introduces flakiness, requires deterministic test data)

**Critical Testability Concerns:**
1. MediaPipe Hands requires real camera/webcam (cannot be mocked easily)
2. TensorFlow.js model inference is non-deterministic (floating-point precision)
3. Persistência local exige estratégia de isolamento/limpeza de storage entre testes (localStorage/IndexedDB)
4. Performance testing (NF1: <50ms inference) requires real hardware profiling

---

## Testability Assessment

### Controllability: ⚠️ CONCERNS

**Assessment:** System state can be controlled for most components, but AI pipeline presents challenges.

**Strengths:**
- ✅ **Camada local encapsulada:** Serviços Angular para sessão/perfil/progresso → facilmente mockável
- ✅ **Pipeline testável:** normalização/buffer/inferência separados em serviços

**Concerns:**
- ⚠️ **MediaPipe Hands:** Requires real webcam/camera hardware → cannot be mocked without significant effort
  - **Mitigation:** Use `getUserMedia` mock in tests, provide test video files for MediaPipe processing
  - **Recommendation:** Create test fixtures with pre-recorded video frames for deterministic testing
- ⚠️ **TensorFlow.js Model:** Model loading and inference require actual model files → test environment must include `/public/models`
  - **Mitigation:** Use lightweight test model or mock inference results for unit tests
  - **Recommendation:** Separate model loading from inference logic for testability
- ⚠️ **Backend remoto (opcional/futuro):** Se um BaaS for adotado futuramente, testes de integração exigirão ambiente dedicado ou mocks
  - **Mitigation:** manter camada de persistência com interface para mocking
  - **Recommendation:** tratar integração remota como opcional e isolada do core

**Recommendations:**
1. Criar fixtures determinísticas (landmarks ou frames) para testes do pipeline
2. Manter dependências do MediaPipe/TF.js encapsuladas em serviços para mocking
3. Padronizar helpers para reset de storage (localStorage/IndexedDB) em testes
4. Mockar `getUserMedia` em testes E2E (Playwright) quando aplicável

### Observability: ✅ PASS

**Assessment:** System state can be inspected and validated effectively.

- ✅ **Browser DevTools:** Full access to console, network, performance profiling
- ✅ **Logs no cliente:** Estado e persistência local podem ser inspecionados via DevTools
- ✅ **Functional Pipeline:** Pure functions enable step-by-step inspection
- ✅ **Custom Events:** `gestureRecognized` events can be monitored in tests
- ✅ **InferenceLog Interface:** Architecture defines logging structure for performance metrics

**Validation Capabilities:**
- ✅ **State Inspection:** Angular DevTools (quando disponível) + logs/sinais/observables no DevTools
- ✅ **Network Monitoring:** Playwright pode validar ausência de chamadas externas indesejadas
- ✅ **Performance Metrics:** Browser Performance API for inference timing
- ✅ **Error Tracking:** Console errors, network failures, model loading errors

**Recommendations:**
1. Implementar logging estruturado (ex.: InferenceLog) para debug em produção
2. Usar Playwright para monitorar rede e garantir ausência de chamadas externas no MVP

### Reliability: ⚠️ CONCERNS

**Assessment:** Tests can be isolated and parallelized, but ML pipeline introduces non-determinism.

**Strengths:**
- ✅ **Componentes previsíveis:** componentes Angular podem ser testados de forma isolada; regras de DI e serviços facilitam mocking
- ✅ **Persistência controlável:** Storage local pode ser resetado por teste → parallel-safe
- ✅ **Functional Pipeline:** Pure functions are deterministic (given same input, same output)
- ✅ **Test Isolation:** Cada teste pode usar storage isolado (contexto/limpeza)

**Concerns:**
- ⚠️ **TensorFlow.js Inference:** Floating-point operations are non-deterministic across devices
  - **Impact:** Same landmarks may produce slightly different confidence scores
  - **Mitigation:** Use confidence thresholds (0.85) with tolerance ranges in tests
  - **Recommendation:** Test confidence ranges (e.g., `confidence >= 0.85 && confidence <= 1.0`) instead of exact values
- ⚠️ **MediaPipe Detection:** Hand detection may vary based on lighting, camera quality, hand position
  - **Impact:** Tests may fail on different hardware or environments
  - **Mitigation:** Use pre-recorded video fixtures with known landmarks
  - **Recommendation:** Create test fixtures with deterministic landmark data
- ⚠️ **Browser Environment:** Different browsers (Chrome, Firefox, Safari) may have different MediaPipe/TF.js performance
  - **Impact:** Performance tests (NF1: <50ms) may pass in Chrome but fail in Safari
  - **Mitigation:** Define browser-specific performance baselines
  - **Recommendation:** Test on target browsers (Chrome for primary, Safari for mobile)

**Recommendations:**
1. Use deterministic test fixtures (pre-recorded video, known landmarks)
2. Test confidence ranges instead of exact values
3. Define browser-specific performance baselines
4. Implement retry logic for flaky ML inference tests

---

## Architecturally Significant Requirements (ASRs)

ASRs are quality requirements that drive architecture decisions and pose testability challenges.

### ASR-1: Real-Time Inference Performance (NF1)

**Requirement:** Inference complete (frame → resultado) < 50ms on average hardware (Chrome, 8GB RAM)

**Architecture Impact:**
- Edge computing (browser-based) chosen to eliminate network latency
- TensorFlow.js selected for browser compatibility
- MediaPipe Hands for efficient landmark extraction

**Testability Challenges:**
- ⚠️ Performance varies by hardware (CPU, GPU, browser)
- ⚠️ Cannot test in CI without real hardware
- ⚠️ Non-deterministic timing (garbage collection, browser optimizations)

**Testing Approach:**
- **Unit Tests:** Mock inference timing (not applicable for performance validation)
- **Integration Tests:** Profile inference time with real model on test hardware
- **E2E Tests:** Measure end-to-end latency (camera → feedback) with Playwright Performance API
- **Performance Tests:** Use k6 for load testing (if applicable) or browser Performance API for client-side profiling

**Test Environment Requirements:**
- Real hardware (Chrome, 8GB RAM minimum)
- Browser Performance API enabled
- Deterministic test data (pre-recorded video frames)

**Risk Score:** Probability=2 (Possible), Impact=3 (Critical) → **Score: 6 (HIGH)**

**Mitigation:**
- Define browser-specific performance baselines (Chrome: <50ms, Safari: <70ms)
- Use Performance API for automated profiling in E2E tests
- Document hardware requirements for performance testing

### ASR-2: Model Accuracy (NF2)

**Requirement:** Model accuracy > 93% for static signs in ideal conditions

**Architecture Impact:**
- LSTM model converted from Python (preserves accuracy)
- Normalization must replicate Python preprocessing exactly
- Confidence threshold (0.85) filters low-confidence predictions

**Testability Challenges:**
- ⚠️ Cannot validate accuracy without labeled test dataset
- ⚠️ Model conversion (Python → TF.js) may introduce precision loss
- ⚠️ Normalization must match Python exactly (testability depends on code review)

**Testing Approach:**
- **Unit Tests:** Validate normalization function matches Python preprocessing (compare outputs)
- **Integration Tests:** Test model inference with known test cases (golden dataset)
- **E2E Tests:** User acceptance testing with real users (CA1: 90% complete "Letra A")

**Test Environment Requirements:**
- Golden dataset (labeled test cases with expected predictions)
- Python preprocessing reference implementation for comparison
- Test fixtures with known gestures

**Risk Score:** Probability=2 (Possible), Impact=3 (Critical) → **Score: 6 (HIGH)**

**Mitigation:**
- Create golden dataset with labeled test cases
- Validate normalization function against Python reference
- Implement accuracy regression tests (compare TF.js vs Python outputs)

### ASR-3: Privacy by Default (NF3)

**Requirement:** 100% local processing, no raw video frames sent to servers

**Architecture Impact:**
- Edge computing architecture (no server-side inference)
- Only landmarks (anonymized) may be sent for analytics
- Sem backend no MVP: sessão/perfil/progresso são locais; não há dados de usuário remotos

**Testability Challenges:**
- ✅ Easy to validate (no network calls for video frames)
- ✅ Can intercept network requests in Playwright tests
- ⚠️ Analytics tracking (landmarks) must be validated separately

**Testing Approach:**
- **E2E Tests:** Intercept network requests, verify no video frames sent
- **Security Tests:** Validate privacy policy compliance (OWASP)
- **Integration Tests:** Verify analytics only sends landmarks (not raw video)

**Test Environment Requirements:**
- Network interception in Playwright tests
- Analytics endpoint mocking

**Risk Score:** Probability=1 (Unlikely), Impact=3 (Critical) → **Score: 3 (MEDIUM)**

**Mitigation:**
- Implement network interception tests in Playwright
- Validate analytics payload structure (landmarks only, no video)

### ASR-4: Responsive and Accessible UI (NF4)

**Requirement:** Interface responsive and accessible (WCAG 2.1 AA), works on desktop and mobile

**Architecture Impact:**
- CSS/Componentes Angular para responsividade
- Templates Angular com acessibilidade (ARIA/teclado)
- PWA opcional para suporte mobile

**Testability Challenges:**
- ✅ Playwright supports viewport testing (desktop/mobile)
- ✅ Accessibility testing tools available (axe-core, Lighthouse)
- ⚠️ Camera access on mobile requires real device testing

**Testing Approach:**
- **Component Tests:** Validate ARIA labels, keyboard navigation
- **E2E Tests:** Test responsive layouts (desktop/mobile viewports)
- **Accessibility Tests:** Use axe-core or Lighthouse for WCAG compliance
- **Mobile Tests:** Real device testing for camera access (Playwright mobile emulation + real devices)

**Test Environment Requirements:**
- Playwright viewport testing (desktop: 1920x1080, mobile: 375x667)
- Accessibility testing tools (axe-core)
- Real mobile devices for camera testing (optional but recommended)

**Risk Score:** Probability=1 (Unlikely), Impact=2 (Degraded) → **Score: 2 (LOW)**

**Mitigation:**
- Implement automated accessibility tests (axe-core in Playwright)
- Test responsive layouts in CI (multiple viewports)
- Document mobile device testing requirements

---

## Test Levels Strategy

Based on architecture (modo local com edge computing, Angular frontend, sem backend):

### Recommended Test Distribution

**Unit: 55%** - Lógica de domínio, normalização, buffer, pós-processamento (serviços puros)
**Integration: 25%** - Integração entre serviços (HandPose → Buffer → Inferência) e rotas principais
**E2E: 20%** - Jornadas críticas (login local → prática → progresso), com foco em estabilidade

**Rationale:**
- **Alta cobertura unit:** pipeline funcional (normalização/buffer/pós-processamento) é determinístico
- **Integração moderada:** inferência/MediaPipe exigem estratégia (mock/fixtures) para evitar flakiness
- **E2E focado:** caminhos críticos apenas, por depender de câmera/ML

### Test Level Breakdown

#### Unit Tests (50%)

**Scope:**
- Normalização (serviço `LandmarkNormalizerService`)
- Buffer (serviço `GestureBufferService`)
- Pós-processamento (threshold/suavização) no `GestureRecognitionService`
- Confidence threshold filtering
- XP calculation, scoring algorithms
- Persistência local (auth/profile/progresso)

**Tools:**
- Jest + `jest-preset-angular`

**Example:**
```typescript
// tests/unit/normalize.test.ts
describe('normalizeLandmarks', () => {
  it('should normalize x/y coordinates by video dimensions', () => {
    const landmarks = [{ x: 640, y: 480, z: 0.1 }];
    const normalized = normalizeLandmarks(landmarks, 1280, 960);
    expect(normalized[0]).toBeCloseTo(0.5, 2); // 640/1280
    expect(normalized[1]).toBeCloseTo(0.5, 2); // 480/960
  });
});
```

#### Integration Tests (30%)

**Scope:**
- Persistência local (progresso/perfil/sessão) via `localStorage`/serviços
- Model inference (TF.js model loading and prediction)
- MediaPipe Hands integration (landmark extraction)
- Authentication flow (login local)

**Tools:**
- Playwright API testing (`request` context)
- Test fixtures (pre-recorded video, known landmarks)

**Example:**
```typescript
// tests/integration/progress.spec.ts
test('should persist lesson progress locally', async () => {
  // Exercitar o serviço de progresso (local) e validar o estado persistido.
});
```

#### E2E Tests (20%)

**Scope:**
- Critical user journeys (login → practice → progress saved)
- Camera → feedback flow (gesture recognition)
- Authentication (Google OAuth)
- Progress persistence (dashboard shows saved progress)

**Tools:**
- Playwright (E2E testing)
- Test fixtures (pre-recorded video for MediaPipe)
- Mock `getUserMedia` API

**Example:**
```typescript
// tests/e2e/practice-flow.spec.ts
test('user can practice gesture and see feedback', async ({ page }) => {
  // Mock camera with test video
  await page.goto('/practice/letra-a');
  await page.click('[data-testid="start-camera"]');
  
  // Wait for gesture recognition
  await expect(page.getByText('Letra A')).toBeVisible();
  await expect(page.locator('.feedback-correct')).toBeVisible();
});
```

### Test Environment Needs

**Local Development:**
- Angular dev server (localhost:4200)
- Test fixtures (video files, model files)

**CI/CD:**
- Headless Chrome for E2E tests
- Test fixtures included in repo

**Performance Testing:**
- Real hardware (Chrome, 8GB RAM)
- Browser Performance API
- k6 for load testing (if applicable)

---

## NFR Testing Approach

### Security (NF3: Privacy by Default)

**Approach:**
- **Playwright E2E Tests:** Intercept network requests, verify no video frames sent
- **Security Audit:** OWASP Top 10 validation (XSS, SQL injection)
- **Auth/Authorization:** Testar guards/rotas e estados da sessão local

**Tools:**
- Playwright network interception
- OWASP ZAP (optional, for security audit)
- Testes de guards/rotas (Angular Router) e reset/isolamento de storage

**Test Scenarios:**
1. Verify no video frames sent to servers (network interception)
2. Validate analytics only sends landmarks (not raw video)
3. Test authentication (login local, restauração de sessão)
4. Test authorization (rotas protegidas/guards)

**Criteria:**
- ✅ PASS: No video frames in network requests, analytics payload validated, auth/authz tests green
- ⚠️ CONCERNS: Analytics payload structure unclear, RLS policies not fully tested
- ❌ FAIL: Video frames sent to servers, auth bypass possible

### Performance (NF1: <50ms Inference)

**Approach:**
- **Browser Performance API:** Profile inference time in E2E tests
- **k6 Load Testing:** Not applicable (edge computing, no server load)
- **Lighthouse:** Core Web Vitals (if applicable)

**Tools:**
- Browser Performance API (Playwright)
- Lighthouse (optional, for Core Web Vitals)

**Test Scenarios:**
1. Measure inference time (MediaPipe → TF.js → feedback) < 50ms
2. Profile end-to-end latency (camera frame → UI feedback) < 70ms (CA2)
3. Validate performance on different browsers (Chrome, Safari)

**Criteria:**
- ✅ PASS: Inference < 50ms (p95), end-to-end < 70ms (p95) with profiling evidence
- ⚠️ CONCERNS: Performance varies by hardware, missing browser-specific baselines
- ❌ FAIL: Inference > 50ms consistently, end-to-end > 70ms

### Reliability (Error Handling, Network Resilience)

**Approach:**
- **Playwright E2E Tests:** Test error handling and resilience to network disruptions
- **API Tests:** (MVP) garantir ausência de chamadas externas e resiliência a falhas de recursos (modelo/asset)

**Tools:**
- Playwright (E2E error scenarios)
- Playwright para interceptação de rede e validações do fluxo end-to-end

**Test Scenarios:**
1. Test graceful degradation when camera unavailable
2. Test network disruptions (temporary loss of connection) and graceful recovery
3. Test model loading errors (fallback UI)
4. Test storage errors (localStorage indisponível/quota) e UX de fallback

**Criteria:**
- ✅ PASS: erros tratados (câmera/modelo/storage), UX clara, sem dependências externas no MVP
- ⚠️ CONCERNS: Partial error coverage, missing network disruption scenarios
- ❌ FAIL: erros derrubam app, UX confusa, dependências externas inesperadas

### Maintainability (Code Quality, Test Coverage)

**Approach:**
- **CI Tools:** Coverage, duplication, vulnerability scanning
- **Playwright:** Observability validation (error tracking, telemetry)

**Tools:**
- GitHub Actions (coverage, duplication, audit)
- jscpd (code duplication)
- npm audit (vulnerabilities)
- Playwright (observability validation)

**Test Scenarios:**
1. Test coverage ≥80% (CI coverage report)
2. Code duplication <5% (jscpd CI job)
3. No critical/high vulnerabilities (npm audit CI job)
4. Structured logging validated (telemetry headers in Playwright)

**Criteria:**
- ✅ PASS: Coverage ≥80%, duplication <5%, no critical vulnerabilities, observability validated
- ⚠️ CONCERNS: Coverage 60-79%, duplication 5-10%, unclear ownership
- ❌ FAIL: Coverage <60%, duplication >10%, critical vulnerabilities, no observability

---

## Test Environment Requirements

### Infrastructure Needs

**Local Development:**
- Angular dev server (localhost:4200)
- Test fixtures directory (`/tests/fixtures`):
  - Pre-recorded video files (for MediaPipe testing)
  - Known landmark data (for normalization testing)
  - Model files (for TF.js testing)

**CI/CD:**
- Headless Chrome (Playwright)
- Test fixtures included in repo (Git LFS for large files)

**Performance Testing:**
- Real hardware (Chrome, 8GB RAM minimum)
- Browser Performance API enabled
- Deterministic test data (pre-recorded video frames)

### Test Data Requirements

**Fixtures:**
- Pre-recorded video files (known gestures: "Letra A", "Letra B", etc.)
- Known landmark data (for normalization validation)
- Test user accounts (modo local)
- Test modules/lessons (seed data)

**Factories:**
- User factory (create test users)
- Progress factory (create test progress data)
- Lesson factory (create test lessons)

---

## Testability Concerns

### Critical Concerns (Blockers)

**None identified.** Architecture is generally testable with proper fixtures and mocking.

### Moderate Concerns (Mitigation Required)

1. **MediaPipe Hands Requires Real Camera**
   - **Impact:** Cannot easily mock camera in tests
   - **Mitigation:** Use pre-recorded video fixtures, mock `getUserMedia` API
   - **Owner:** QA/Dev Team

2. **TensorFlow.js Inference Non-Determinism**
   - **Impact:** Tests may fail due to floating-point precision
   - **Mitigation:** Test confidence ranges instead of exact values
   - **Owner:** QA/Dev Team

3. **Performance Testing Requires Real Hardware**
   - **Impact:** Cannot validate NF1 (<50ms) in CI without real hardware
   - **Mitigation:** Define browser-specific baselines, use Performance API in E2E tests
   - **Owner:** QA/Dev Team

### Low Concerns (Monitor)

1. **Testes de integração (backend opcional/futuro)**
   - **Impact:** Se integrar um BaaS no futuro, será necessário ambiente dedicado ou mocks
   - **Mitigation:** manter persistência remota isolada atrás de interface e usar mocks nos testes
   - **Owner:** Dev Team

---

## Recommendations for Test Infrastructure Setup

### Test Infrastructure Setup

1. **Create Test Fixtures**
   - Pre-recorded video files for MediaPipe testing
   - Known landmark data for normalization validation
   - Test model files (lightweight version for unit tests)

2. **Implement Dependency Injection**
   - Encapsular MediaPipe/TF.js em serviços Angular (para mocking)
   - Manter interfaces/abstrações para persistência local (e futura remota, se existir)

3. **Set Up Test Environment**
   - Test fixtures directory structure
   - CI/CD test configuration (Playwright, Jest)

4. **Define Test Baselines**
   - Browser-specific performance baselines (Chrome: <50ms, Safari: <70ms)
   - Confidence threshold ranges (0.85-1.0) for ML tests
   - Test data factories (users, progress, lessons)

5. **Implement Test Utilities**
   - Mock `getUserMedia` API for Playwright tests
   - Network interception utilities para garantir ausência de chamadas externas no MVP
   - Performance profiling utilities (Browser Performance API)

### Test Framework Configuration

**Jest (Unit/Integration Tests):**
Ver configuração em `lia-web/jest.config.cjs`.

**Playwright (E2E/Integration Tests):**
```typescript
// playwright.config.ts
export default defineConfig({
  testDir: './tests',
  use: {
    baseURL: 'http://localhost:4200',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
});
```

### Test Data Management

**Fixtures:**
- Store pre-recorded video files in `/tests/fixtures/videos/`
- Store known landmark data in `/tests/fixtures/landmarks/`
- Use Git LFS for large files (video files)

**Factories:**
- Create factories in `/tests/factories/`:
  - `userFactory.ts` (create test users)
  - `progressFactory.ts` (create test progress)
  - `lessonFactory.ts` (create test lessons)

---

## Approval

**Test Design Approved By:**

- [ ] Product Manager: _______________ Date: _______
- [ ] Tech Lead: _______________ Date: _______
- [ ] QA Lead: _______________ Date: _______

**Comments:**

---

**Generated by**: BMad TEA Agent - Test Architect Module
**Workflow**: `_bmad/bmm/testarch/test-design`
**Version**: 4.0 (BMad v6)
**Mode**: System-Level (Phase 3)

