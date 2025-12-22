# Story 2.7: Pós-processamento com Threshold e Debounce

**Epic:** Epic 2 - Motor de Reconhecimento de Gestos (Core)  
**Story ID:** `2-7-pos-processamento-com-threshold-e-debounce`  
**Status:** `done`  
**Created:** 2025-12-21  
**Priority:** High (finaliza o Epic 2 ✅)

---

## User Story

**As a** developer,  
**I want to apply confidence threshold and debounce logic to predictions,  
**So that** I get stable, accurate gesture recognition without oscillations.

---

## Acceptance Criteria

**Given** I have model predictions (probability distribution)  
**When** I process the predictions  
**Then** Only predictions with confidence > 0.85 should be considered valid  
**And** The same prediction must repeat for 5 consecutive frames before being accepted  
**And** If confidence drops below 0.85, the prediction should be reset  
**And** If prediction changes before 5 frames, the counter should reset  
**And** The final accepted prediction should be returned with confidence value

---

## Context & Background

### Purpose
O pós-processamento é crucial para evitar oscilações e falsos positivos no reconhecimento de gestos. O modelo pode produzir predições instáveis, especialmente em transições entre gestos.

### Technical Requirements
- **Confidence Threshold:** Apenas predições > 0.85 são consideradas
- **Debounce Logic:** Mesma predição deve repetir por 5 frames consecutivos
- **Reset Conditions:** Confiança < 0.85 ou mudança de predição
- **Stable Output:** Predições só são aceitas quando estáveis

### Architecture Alignment
- **PRD:** F3.6 - Pós-processamento: threshold de confiança (0.85) e debounce
- **Current Pipeline:** Modelo TF.js → **Pós-processamento** → Resultado Final
- **Goal:** Interface final entre pipeline de IA e UI

---

## Tasks

### Task 1: Create useGesturePostProcessing hook
- [ ] Create `src/hooks/useGesturePostProcessing.ts`
- [ ] Implement state management for stable predictions
- [ ] Add method `processPrediction()` with threshold and debounce logic

### Task 2: Implement confidence threshold (0.85)
- [ ] Filter predictions below confidence threshold
- [ ] Return null for low-confidence predictions
- [ ] Log warnings for debugging

### Task 3: Implement debounce mechanism
- [ ] Track consecutive frames with same prediction
- [ ] Reset counter on prediction change or low confidence
- [ ] Accept prediction only after 5 consecutive frames

### Task 4: Handle edge cases
- [ ] Handle null/undefined predictions from model
- [ ] Reset state when gesture changes
- [ ] Provide current processing state (debouncing, accepted, etc.)

### Task 5: Create comprehensive tests
- [ ] Unit tests for threshold filtering
- [ ] Test debounce logic (5-frame requirement)
- [ ] Test state resets and edge cases
- [ ] Integration tests with mock predictions

---

## Technical Design

### Hook Interface

```typescript
interface PostProcessingConfig {
  confidenceThreshold?: number // Default: 0.85
  debounceFrames?: number // Default: 5
}

interface StablePrediction {
  gestureClass: number
  confidence: number
  stableFrames: number
  lastUpdated: number
}

interface UseGesturePostProcessingState {
  currentPrediction: StablePrediction | null
  isDebouncing: boolean
  debounceProgress: number // 0 to debounceFrames
  lastRawPrediction: InferenceResult | null
}

interface UseGesturePostProcessingControls {
  processPrediction: (prediction: InferenceResult | null) => StablePrediction | null
  reset: () => void
  getStablePrediction: () => StablePrediction | null
}

type UseGesturePostProcessingReturn = UseGesturePostProcessingState & UseGesturePostProcessingControls
```

### Processing Logic Flow

```
Raw Prediction (InferenceResult)
    ↓
Check confidence > threshold (0.85)
    ↓
If below threshold: return null, reset debounce
    ↓
Compare with current debouncing prediction
    ↓
If different: reset counter, start new debounce
If same: increment counter
    ↓
If counter >= 5: accept prediction, return stable result
If counter < 5: return null (still debouncing)
```

### State Management

```typescript
interface InternalState {
  currentDebouncingClass: number | null
  consecutiveFrames: number
  stablePrediction: StablePrediction | null
}

function processPrediction(prediction: InferenceResult | null): StablePrediction | null {
  if (!prediction || prediction.confidence < config.confidenceThreshold) {
    // Reset debounce state
    resetDebounce()
    return null
  }

  if (state.currentDebouncingClass === null) {
    // Start new debounce
    state.currentDebouncingClass = prediction.predictedClass
    state.consecutiveFrames = 1
  } else if (state.currentDebouncingClass === prediction.predictedClass) {
    // Continue debounce
    state.consecutiveFrames++
  } else {
    // Prediction changed, restart debounce
    state.currentDebouncingClass = prediction.predictedClass
    state.consecutiveFrames = 1
  }

  if (state.consecutiveFrames >= config.debounceFrames) {
    // Accept stable prediction
    const stableResult: StablePrediction = {
      gestureClass: prediction.predictedClass,
      confidence: prediction.confidence,
      stableFrames: state.consecutiveFrames,
      lastUpdated: Date.now()
    }
    state.stablePrediction = stableResult
    return stableResult
  }

  // Still debouncing
  return null
}
```

### Usage Example

```typescript
function GestureRecognitionPipeline() {
  const { runInference } = useModelInference()
  const { processPrediction, currentPrediction, isDebouncing } = useGesturePostProcessing({
    confidenceThreshold: 0.85,
    debounceFrames: 5
  })

  // Process inference results
  useEffect(() => {
    if (inferenceData) {
      const rawPrediction = runInference(inferenceData)
      const stablePrediction = processPrediction(rawPrediction)
      
      if (stablePrediction) {
        // Gesture is stable and ready to use
        console.log('Stable gesture detected:', stablePrediction.gestureClass)
      }
    }
  }, [inferenceData, runInference, processPrediction])

  return (
    <div>
      {isDebouncing && <div>Processando gesto... ({debounceProgress}/5)</div>}
      {currentPrediction && <div>Gesto reconhecido: {currentPrediction.gestureClass}</div>}
    </div>
  )
}
```

---

## Dependencies
- **Blocks:** Epic 4 (Interface precisa das predições estáveis)
- **Blocked by:** Story 2.6 ✅ (precisa dos InferenceResult)
- **Requires:** InferenceResult type from useModelInference

---

## Definition of Done
- [ ] `src/hooks/useGesturePostProcessing.ts` criado e implementado
- [ ] Threshold de confiança > 0.85 implementado
- [ ] Debounce de 5 frames consecutivos implementado
- [ ] Reset automático quando confiança baixa ou gesto muda
- [ ] Estado de processamento (debouncing) disponível
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
<!-- Dev: How did you verify post-processing logic? -->

---

## Senior Developer Review (AI)

<!-- Code Review Agent: Add findings here after *code-review -->

