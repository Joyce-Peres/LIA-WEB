# Story 2.3: Integração do MediaPipe Hands

**Epic:** Epic 2 - Motor de Reconhecimento de Gestos (Core)  
**Story ID:** `2-3-integracao-do-mediapipe-hands`  
**Status:** `done`  
**Created:** 2025-12-21  
**Priority:** High (depende da Story 2.2 ✅)

---

## User Story

**As a** developer,  
**I want to** integrate MediaPipe Hands for hand landmark extraction,  
**So that** I can extract 21 points (x, y, z) per hand from video frames at ~30 FPS.

---

## Acceptance Criteria

**Given** I have a video stream from the camera  
**When** I initialize MediaPipe Hands  
**Then** MediaPipe should be configured to detect up to 2 hands  
**And** For each detected hand, I should receive 21 landmarks with x, y, z coordinates  
**And** If no hands are detected, the result should be null  
**And** The processing should run at ~30 FPS without blocking the main thread  
**And** MediaPipe should handle edge cases (partial hand visibility, multiple hands)

---

## Context & Background

### Purpose
O MediaPipe Hands é uma biblioteca do Google que detecta e rastreia 21 pontos-chave (landmarks) da mão em tempo real usando modelos de ML otimizados para web.

### Technical Requirements
- **MediaPipe Hands:** `@mediapipe/hands` + `@mediapipe/drawing_utils` (opcional, para debug)
- **Max Hands:** 2 (ambas as mãos)
- **Detection Confidence:** 0.7 (balance entre precisão e recall)
- **Tracking Confidence:** 0.5 (permite rastreamento mais fluido)
- **Output:** Array de landmarks `{ x: number, y: number, z: number }` (21 por mão)
- **Performance:** ~30 FPS, processamento assíncrono

### Architecture Alignment
- **PRD:** FR2 - "Detecção de landmarks da mão em tempo real"
- **Architecture:** "useCamera → **MediaPipe** → Buffer → LSTM"
- **Edge Computing:** MediaPipe roda 100% no browser (WebAssembly)

---

## Tasks

### Task 1: Install dependencies
- [ ] Install `@mediapipe/hands`
- [ ] Install `@mediapipe/drawing_utils` (opcional, para visualização)
- [ ] Verificar tamanho do bundle (~6MB WASM + models)

### Task 2: Create useHandPose hook
- [ ] Create `src/hooks/useHandPose.ts`
- [ ] Initialize MediaPipe Hands with config
- [ ] Implement `processFrame(video: HTMLVideoElement)` method
- [ ] Return landmarks array and processing state

### Task 3: Implement frame processing
- [ ] Process video frames at ~30 FPS
- [ ] Extract 21 landmarks per hand (x, y, z normalized 0-1)
- [ ] Handle 0, 1, or 2 hands detected
- [ ] Provide handedness info (Left/Right)

### Task 4: Error handling & performance
- [ ] Handle MediaPipe initialization errors
- [ ] Optimize processing loop (requestAnimationFrame)
- [ ] Monitor FPS and warn if <20 FPS
- [ ] Cleanup MediaPipe instance on unmount

### Task 5: Testing
- [ ] Unit tests for hook initialization
- [ ] Mock MediaPipe results
- [ ] Test edge cases (no hands, 1 hand, 2 hands)
- [ ] Performance tests (simulate 30 FPS)

---

## Technical Design

### Hook Interface

```typescript
interface HandLandmark {
  x: number // 0-1 (normalizado por largura do vídeo)
  y: number // 0-1 (normalizado por altura do vídeo)
  z: number // Profundidade relativa
}

interface HandResult {
  landmarks: HandLandmark[] // 21 landmarks
  handedness: 'Left' | 'Right'
}

interface UseHandPoseState {
  results: HandResult[] | null // null ou array com 0-2 mãos
  isProcessing: boolean
  error: string | null
  fps: number // FPS atual de processamento
}

interface UseHandPoseControls {
  processFrame: (video: HTMLVideoElement) => Promise<void>
  startProcessing: (video: HTMLVideoElement) => void
  stopProcessing: () => void
}

type UseHandPoseReturn = UseHandPoseState & UseHandPoseControls
```

### Usage Example

```typescript
function GestureRecognitionPage() {
  const { videoRef, isActive, startCamera } = useCamera()
  const { results, processFrame, fps } = useHandPose({
    maxHands: 2,
    minDetectionConfidence: 0.7,
    minTrackingConfidence: 0.5
  })

  useEffect(() => {
    if (isActive && videoRef.current) {
      const interval = setInterval(() => {
        processFrame(videoRef.current!)
      }, 1000 / 30) // 30 FPS

      return () => clearInterval(interval)
    }
  }, [isActive, videoRef, processFrame])

  return (
    <div>
      <video ref={videoRef} />
      <p>Mãos detectadas: {results?.length || 0}</p>
      <p>FPS: {fps.toFixed(1)}</p>
    </div>
  )
}
```

### MediaPipe Configuration

```typescript
const hands = new Hands({
  locateFile: (file) => {
    return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
  }
})

hands.setOptions({
  maxNumHands: 2,
  modelComplexity: 1, // 0 (lite), 1 (full)
  minDetectionConfidence: 0.7,
  minTrackingConfidence: 0.5
})

hands.onResults((results) => {
  // results.multiHandLandmarks: Array<Array<{x, y, z}>>
  // results.multiHandedness: Array<{label: 'Left'|'Right'}>
})
```

### 21 Hand Landmarks (MediaPipe)

```
WRIST = 0
THUMB_CMC = 1, THUMB_MCP = 2, THUMB_IP = 3, THUMB_TIP = 4
INDEX_FINGER_MCP = 5, INDEX_FINGER_PIP = 6, INDEX_FINGER_DIP = 7, INDEX_FINGER_TIP = 8
MIDDLE_FINGER_MCP = 9, MIDDLE_FINGER_PIP = 10, MIDDLE_FINGER_DIP = 11, MIDDLE_FINGER_TIP = 12
RING_FINGER_MCP = 13, RING_FINGER_PIP = 14, RING_FINGER_DIP = 15, RING_FINGER_TIP = 16
PINKY_MCP = 17, PINKY_PIP = 18, PINKY_DIP = 19, PINKY_TIP = 20
```

---

## Dependencies
- **Blocks:** Story 2.4 (Buffer Circular precisa dos landmarks)
- **Blocked by:** Story 2.2 ✅ (precisa do `videoRef` do useCamera)
- **Requires:** Browser moderno com WebAssembly e WebGL

---

## Definition of Done
- [ ] MediaPipe Hands instalado
- [ ] `src/hooks/useHandPose.ts` criado e implementado
- [ ] Hook processa frames a ~30 FPS
- [ ] Detecta 0-2 mãos corretamente
- [ ] Retorna 21 landmarks (x, y, z) por mão
- [ ] Testes unitários criados e passando
- [ ] Performance verificada (FPS >= 20)
- [ ] Code review aprovado
- [ ] Arquivos commitados no Git

---

## Dev Agent Record

### Implementation Notes
<!-- Dev: Add implementation notes here -->

### Files Changed
<!-- Dev: List files created/modified -->

### Testing
<!-- Dev: How did you verify MediaPipe integration? -->

---

## Senior Developer Review (AI)

<!-- Code Review Agent: Add findings here after *code-review -->

