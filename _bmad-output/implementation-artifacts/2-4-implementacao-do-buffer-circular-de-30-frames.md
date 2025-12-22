# Story 2.4: Implementação do Buffer Circular de 30 Frames

**Epic:** Epic 2 - Motor de Reconhecimento de Gestos (Core)  
**Story ID:** `2-4-implementacao-do-buffer-circular-de-30-frames`  
**Status:** `done`  
**Created:** 2025-12-21  
**Priority:** High (depende da Story 2.3 ✅)

---

## User Story

**As a** developer,  
**I want to** implement a circular buffer that maintains exactly the last 30 frames of landmarks,  
**So that** I can feed sequential data to the LSTM model.

---

## Acceptance Criteria

**Given** I have landmarks from MediaPipe Hands  
**When** I add landmarks to the buffer  
**Then** The buffer should maintain exactly 30 frames (FIFO)  
**And** If buffer.length < 30, no inference should be triggered  
**And** If no hands are detected for 10 consecutive frames, the buffer should be cleared  
**And** The buffer should handle cases where only one hand is detected (fill second hand with zeros)  
**And** The buffer should format data for shape [1, 30, 126] (batch, timesteps, features)

---

## Context & Background

### Purpose
O buffer circular é o componente que armazena a sequência temporal de landmarks necessária para o modelo LSTM. Ele precisa manter exatamente 30 frames (timesteps) para corresponder ao shape de entrada do modelo treinado.

### Technical Requirements
- **Buffer Size:** Exatamente 30 frames
- **Behavior:** FIFO (First In, First Out)
- **Shape Final:** [1, 30, 126] onde 126 = 21 pontos × 3 coordenadas × 2 mãos
- **Hand Handling:** 
  - 2 mãos: landmarks de ambas (42 pontos × 3 = 126)
  - 1 mão: landmarks da mão detectada + zeros para a segunda mão (42 + 84 = 126)
  - 0 mãos: zeros para ambas as mãos (126 zeros)
- **Reset Conditions:** 10 frames consecutivos sem mãos detectadas
- **Inference Trigger:** Apenas quando buffer está cheio (30 frames)

### Architecture Alignment
- **PRD:** F3.3 - Buffer circular que mantém últimos 30 frames
- **Architecture:** "useHandPose → **Buffer** → LSTM"
- **Pipeline:** Buffer é o "ponte" entre detecção e inferência

---

## Tasks

### Task 1: Create useGestureBuffer hook
- [ ] Create `src/hooks/useGestureBuffer.ts`
- [ ] Implement buffer state management
- [ ] Add method `addFrame(handResults: HandResult[] | null)`
- [ ] Implement FIFO logic (circular buffer)
- [ ] Track consecutive frames without hands

### Task 2: Implement frame formatting
- [ ] Convert HandResult[] to flat array of 126 features
- [ ] Handle 0, 1, or 2 hands detected
- [ ] Fill missing hands with zeros
- [ ] Normalize coordinates (X/videoWidth, Y/videoHeight, Z as-is)

### Task 3: Buffer management logic
- [ ] Maintain exactly 30 frames in buffer
- [ ] Clear buffer after 10 consecutive null frames
- [ ] Return formatted buffer when ready for inference
- [ ] Provide buffer status (isReady, frameCount, consecutiveNulls)

### Task 4: Integration with video dimensions
- [ ] Accept video dimensions for normalization
- [ ] Update normalization when dimensions change
- [ ] Handle video resize gracefully

### Task 5: Testing
- [ ] Unit tests for buffer FIFO behavior
- [ ] Test hand filling logic (0/1/2 hands)
- [ ] Test buffer clearing on consecutive nulls
- [ ] Test shape formatting [1, 30, 126]
- [ ] Performance tests for buffer operations

---

## Technical Design

### Hook Interface

```typescript
interface GestureBufferConfig {
  bufferSize?: number // Default: 30
  maxConsecutiveNulls?: number // Default: 10
  videoWidth?: number
  videoHeight?: number
}

interface GestureBufferState {
  isReady: boolean // Buffer has exactly bufferSize frames
  frameCount: number
  consecutiveNulls: number
  buffer: number[][] // [frame][126 features]
}

interface GestureBufferControls {
  addFrame: (handResults: HandResult[] | null, videoWidth?: number, videoHeight?: number) => void
  clear: () => void
  getInferenceData: () => number[][] | null // Returns [1, 30, 126] or null if not ready
  updateVideoDimensions: (width: number, height: number) => void
}

type UseGestureBufferReturn = GestureBufferState & GestureBufferControls
```

### Frame Processing Flow

```
HandResult[] | null
    ↓
Normalize coordinates
    ↓
Convert to 126 features (42 + 84 or zeros)
    ↓
Add to circular buffer (FIFO)
    ↓
Check if buffer is ready (30 frames)
    ↓
Check consecutive nulls (reset if > 10)
    ↓
Return inference data or null
```

### 126 Feature Format

```
// Hand 1 (detected or first hand)
frame[0-41] = [x0,y0,z0, x1,y1,z1, ..., x20,y20,z20] // 21 points × 3 = 42

// Hand 2 (second hand or zeros if only 1 hand detected)
frame[42-125] = [x0,y0,z0, x1,y1,z1, ..., x20,y20,z20] // 21 points × 3 = 84
// Total: 42 + 84 = 126 features per frame
```

### Usage Example

```typescript
function GestureRecognitionPipeline() {
  const { results: handResults } = useHandPose()
  const { videoRef, isActive } = useCamera()
  const { isReady, getInferenceData, addFrame } = useGestureBuffer({
    bufferSize: 30,
    maxConsecutiveNulls: 10
  })

  useEffect(() => {
    if (handResults !== undefined) { // can be null or []
      addFrame(handResults, videoRef.current?.videoWidth, videoRef.current?.videoHeight)
    }
  }, [handResults, videoRef, addFrame])

  useEffect(() => {
    if (isReady) {
      const inferenceData = getInferenceData() // [1, 30, 126]
      if (inferenceData) {
        runInference(inferenceData)
      }
    }
  }, [isReady, getInferenceData])

  return <div>Buffer ready: {isReady}</div>
}
```

### Normalization Logic

```typescript
function normalizeLandmarks(handResults: HandResult[], videoWidth: number, videoHeight: number): number[] {
  const features: number[] = []

  // Hand 1 (always present in some form)
  if (handResults.length >= 1) {
    handResults[0].landmarks.forEach(point => {
      features.push(point.x / videoWidth)  // 0-1
      features.push(point.y / videoHeight) // 0-1
      features.push(point.z)               // relative, keep as-is
    })
  } else {
    // No hands: fill with zeros
    for (let i = 0; i < 21 * 3; i++) features.push(0)
  }

  // Hand 2
  if (handResults.length >= 2) {
    handResults[1].landmarks.forEach(point => {
      features.push(point.x / videoWidth)
      features.push(point.y / videoHeight)
      features.push(point.z)
    })
  } else {
    // One hand or no hands: fill with zeros
    for (let i = 0; i < 21 * 3; i++) features.push(0)
  }

  return features // 126 features
}
```

---

## Dependencies
- **Blocks:** Story 2.5 (Normalização precisa do buffer)
- **Blocked by:** Story 2.3 ✅ (precisa dos HandResult do useHandPose)
- **Requires:** TypeScript types de HandResult

---

## Definition of Done
- [ ] `src/hooks/useGestureBuffer.ts` criado e implementado
- [ ] Buffer mantém exatamente 30 frames (FIFO)
- [ ] Trata corretamente casos de 0/1/2 mãos
- [ ] Limpa buffer após 10 frames consecutivos sem mãos
- [ ] Formata dados para shape [1, 30, 126]
- [ ] Testes unitários criados e passando
- [ ] Integração com useHandPose funciona
- [ ] Code review aprovado
- [ ] Arquivos commitados no Git

---

## Dev Agent Record

### Implementation Notes
<!-- Dev: Add implementation notes here -->

### Files Changed
<!-- Dev: List files created/modified -->

### Testing
<!-- Dev: How did you verify buffer functionality? -->

---

## Senior Developer Review (AI)

<!-- Code Review Agent: Add findings here after *code-review -->

