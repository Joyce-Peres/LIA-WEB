# Story 2.5: Normalização de Landmarks

**Epic:** Epic 2 - Motor de Reconhecimento de Gestos (Core)  
**Story ID:** `2-5-normalizacao-de-landmarks`  
**Status:** `done`  
**Created:** 2025-12-21  
**Priority:** High (depende da Story 2.3 ✅ e 2.4 ✅)

---

## User Story

**As a** developer,  
**I want to** normalize landmarks exactly as done in Python training,  
**So that** the model receives input in the expected format.

---

## Acceptance Criteria

**Given** I have raw landmarks from MediaPipe  
**When** I normalize the landmarks  
**Then** X coordinates should be divided by video width  
**And** Y coordinates should be divided by video height  
**And** Z coordinates should remain relative (not normalized)  
**And** The normalization should match exactly the Python preprocessing  
**And** The output should be a flat array of 126 features (21 points × 3 coords × 2 hands)

---

## Context & Background

### Purpose
A normalização garante que o modelo receba dados no mesmo formato usado durante o treinamento. Isso é crítico para a precisão do reconhecimento de gestos.

### Technical Requirements
- **X Normalization:** `x / video_width` (0-1 range)
- **Y Normalization:** `y / video_height` (0-1 range)  
- **Z Preservation:** `z` remains relative (no normalization)
- **Output:** Flat array of 126 features
- **Compatibility:** Must match Python preprocessing exactly

### Architecture Alignment
- **PRD:** F3.5 mentions "Lógica de inferência que formata buffer para shape [1, 30, 126]"
- **Current Implementation:** Basic normalization exists in `useGestureBuffer`
- **Goal:** Extract and validate normalization logic for reuse

---

## Tasks

### Task 1: Create normalization service
- [ ] Create `src/services/ai/normalizeLandmarks.ts`
- [ ] Implement `normalizeLandmarks()` function
- [ ] Support single frame normalization
- [ ] Include video dimensions parameters

### Task 2: Verify Python compatibility
- [ ] Review Python preprocessing code (if available)
- [ ] Ensure X, Y, Z handling matches training
- [ ] Validate output format matches expectations

### Task 3: Handle edge cases
- [ ] Handle missing hands (fill with zeros)
- [ ] Handle partial visibility (existing landmarks only)
- [ ] Validate coordinate ranges (0-1 for X,Y)

### Task 4: Create comprehensive tests
- [ ] Unit tests for normalization function
- [ ] Test edge cases (missing hands, out-of-bounds)
- [ ] Validate output shape and ranges
- [ ] Performance tests

### Task 5: Integrate with existing buffer
- [ ] Refactor `useGestureBuffer` to use new service
- [ ] Ensure backward compatibility
- [ ] Update buffer tests if needed

---

## Technical Design

### Normalization Service Interface

```typescript
export interface NormalizationOptions {
  videoWidth: number
  videoHeight: number
}

export interface NormalizedFrame {
  features: number[] // 126 features
  originalHandCount: number // 0, 1, or 2
}

/**
 * Normalize landmarks to match Python training preprocessing
 */
export function normalizeLandmarks(
  handResults: HandResult[] | null,
  options: NormalizationOptions
): NormalizedFrame
```

### Normalization Logic

```typescript
function normalizeLandmarks(handResults: HandResult[] | null, { videoWidth, videoHeight }: NormalizationOptions): NormalizedFrame {
  const features: number[] = []
  const originalHandCount = handResults?.length || 0

  // Hand 1 (first hand or null)
  const hand1 = handResults?.[0]
  if (hand1) {
    hand1.landmarks.forEach(point => {
      features.push(point.x / videoWidth)  // X: 0-1
      features.push(point.y / videoHeight) // Y: 0-1
      features.push(point.z)               // Z: relative (unchanged)
    })
  } else {
    // Fill with zeros
    for (let i = 0; i < 21 * 3; i++) features.push(0)
  }

  // Hand 2 (second hand or null)
  const hand2 = handResults?.[1]
  if (hand2) {
    hand2.landmarks.forEach(point => {
      features.push(point.x / videoWidth)
      features.push(point.y / videoHeight)
      features.push(point.z)
    })
  } else {
    // Fill with zeros
    for (let i = 0; i < 21 * 3; i++) features.push(0)
  }

  return {
    features, // 126 features
    originalHandCount
  }
}
```

### 21 MediaPipe Hand Landmarks

The normalization preserves all 21 keypoints per hand:

```
0: WRIST
1-4: THUMB (CMC, MCP, IP, TIP)
5-8: INDEX FINGER (MCP, PIP, DIP, TIP)
9-12: MIDDLE FINGER (MCP, PIP, DIP, TIP)
13-16: RING FINGER (MCP, PIP, DIP, TIP)
17-20: PINKY (MCP, PIP, DIP, TIP)
```

### Usage Examples

```typescript
// Single frame normalization
const normalized = normalizeLandmarks(handResults, {
  videoWidth: 640,
  videoHeight: 480
})

// Features array: [x0,y0,z0, x1,y1,z1, ..., x20,y20,z20, ...] (126 values)
// X,Y: 0-1 normalized, Z: relative
```

### Integration with Buffer

```typescript
// In useGestureBuffer.ts
const normalized = normalizeLandmarks(handResults, {
  videoWidth: videoDimensionsRef.current.width,
  videoHeight: videoDimensionsRef.current.height
})

buffer.push(normalized.features)
```

---

## Dependencies
- **Blocks:** Story 2.6 (Modelo TF.js precisa da normalização)
- **Blocked by:** Story 2.3 ✅ (precisa dos HandResult), Story 2.4 ✅ (usa normalização)
- **Requires:** HandResult type from useHandPose

---

## Definition of Done
- [ ] `src/services/ai/normalizeLandmarks.ts` criado e implementado
- [ ] Normalização compatível com Python training
- [ ] X coordinates: divided by video width (0-1)
- [ ] Y coordinates: divided by video height (0-1)
- [ ] Z coordinates: remain relative (unchanged)
- [ ] Output: flat array of 126 features
- [ ] Testes unitários criados e passando
- [ ] Integrado com useGestureBuffer
- [ ] Code review aprovado
- [ ] Arquivos commitados no Git

---

## Dev Agent Record

### Implementation Notes
<!-- Dev: Add implementation notes here -->

### Files Changed
<!-- Dev: List files created/modified -->

### Testing
<!-- Dev: How did you verify normalization matches Python? -->

---

## Senior Developer Review (AI)

<!-- Code Review Agent: Add findings here after *code-review -->

