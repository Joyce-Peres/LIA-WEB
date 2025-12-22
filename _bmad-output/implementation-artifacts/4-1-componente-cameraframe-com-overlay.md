# Story 4.1: Componente CameraFrame com Overlay

**Epic:** Epic 4 - Interface de Prática e Feedback Visual
**Story ID:** `4-1-componente-cameraframe-com-overlay`
**Status:** `done`
**Created:** 2025-12-22
**Priority:** High (base fundamental para interface de prática)

---

## User Story

**As a** user,  
**I want to** see my camera feed with hand landmarks overlay,  
**So that** I can see how my hands are being detected.

---

## Acceptance Criteria

**Given** I am on the practice page  
**When** I start the camera  
**Then** I should see my camera feed displayed  
**And** Hand landmarks should be drawn on a canvas overlay  
**And** The overlay should show 21 points per detected hand  
**And** The landmarks should update in real-time (~30 FPS)  
**And** The overlay should be responsive to different screen sizes

---

## Context & Background

### Purpose
Este é o componente fundamental da interface de prática. Ele combina o feed da câmera com a visualização em tempo real dos landmarks das mãos detectados pelo MediaPipe Hands. É a base visual que permite aos usuários ver exatamente como suas mãos estão sendo interpretadas pelo sistema.

### Technical Requirements
- **React Component**: Canvas overlay sobre vídeo
- **MediaPipe Integration**: Usa useHandPose hook criado no Epic 2
- **Real-time Rendering**: 30 FPS mínimo
- **Canvas Drawing**: 21 pontos por mão + conexões
- **Responsive**: Adapta a diferentes tamanhos de tela
- **Performance**: Otimizado para não bloquear UI

### Architecture Alignment
- **Epic 2 dependency:** Usa useHandPose hook
- **Canvas API:** Desenho direto no canvas para performance
- **WebRTC:** Feed da câmera via getUserMedia
- **Real-time:** Loop de renderização contínua

---

## Tasks

### Task 1: Create CameraFrame component base
- [ ] Create `src/components/practice/CameraFrame.tsx`
- [ ] Implement video element for camera feed
- [ ] Add canvas overlay positioned absolutely
- [ ] Set up responsive container sizing

### Task 2: Integrate MediaPipe landmarks
- [ ] Import and use useHandPose hook
- [ ] Connect video element to MediaPipe processing
- [ ] Extract hand landmarks from results
- [ ] Handle multiple hands (até 2)

### Task 3: Implement landmark drawing
- [ ] Create drawLandmarks function for canvas
- [ ] Draw 21 keypoints per hand (4 fingers + palm)
- [ ] Draw connections between keypoints
- [ ] Use consistent colors and stroke width

### Task 4: Add real-time rendering loop
- [ ] Set up requestAnimationFrame loop
- [ ] Clear and redraw canvas each frame
- [ ] Sync canvas size with video dimensions
- [ ] Handle canvas resize on window resize

### Task 5: Implement responsive behavior
- [ ] Make component responsive to container size
- [ ] Maintain aspect ratio of camera feed
- [ ] Scale landmarks proportionally
- [ ] Test on different screen sizes

### Task 6: Create comprehensive tests
- [ ] Unit tests for CameraFrame component
- [ ] Mock useHandPose hook responses
- [ ] Test canvas rendering and landmark drawing
- [ ] Test responsive behavior

---

## Technical Design

### Component Structure

```
CameraFrame
├── Video Element (camera feed)
├── Canvas Overlay (landmarks)
├── useHandPose Hook (MediaPipe integration)
└── Rendering Loop (requestAnimationFrame)
```

### Canvas Drawing Implementation

```typescript
interface Landmark {
  x: number
  y: number
  z: number
}

interface HandResult {
  landmarks: Landmark[]
  handedness: 'Left' | 'Right'
}

function drawLandmarks(
  ctx: CanvasRenderingContext2D,
  landmarks: Landmark[],
  videoWidth: number,
  videoHeight: number
) {
  // Scale landmarks to canvas size
  const scaleX = ctx.canvas.width / videoWidth
  const scaleY = ctx.canvas.height / videoHeight

  // Draw keypoints
  landmarks.forEach((landmark, index) => {
    const x = landmark.x * videoWidth * scaleX
    const y = landmark.y * videoHeight * scaleY

    ctx.beginPath()
    ctx.arc(x, y, 3, 0, 2 * Math.PI)
    ctx.fillStyle = getKeypointColor(index)
    ctx.fill()
  })

  // Draw connections
  HAND_CONNECTIONS.forEach(([start, end]) => {
    const startPoint = landmarks[start]
    const endPoint = landmarks[end]

    ctx.beginPath()
    ctx.moveTo(startPoint.x * videoWidth * scaleX, startPoint.y * videoHeight * scaleY)
    ctx.lineTo(endPoint.x * videoWidth * scaleX, endPoint.y * videoHeight * scaleY)
    ctx.strokeStyle = '#00ff00'
    ctx.lineWidth = 2
    ctx.stroke()
  })
}
```

### Real-time Rendering Loop

```typescript
function useRenderingLoop(
  videoRef: RefObject<HTMLVideoElement>,
  canvasRef: RefObject<HTMLCanvasElement>,
  handResults: HandResult[]
) {
  useEffect(() => {
    let animationId: number

    const render = () => {
      const video = videoRef.current
      const canvas = canvasRef.current

      if (!video || !canvas) return

      const ctx = canvas.getContext('2d')
      if (!ctx) return

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Draw landmarks for each hand
      handResults.forEach((hand) => {
        drawLandmarks(ctx, hand.landmarks, video.videoWidth, video.videoHeight)
      })

      // Continue loop
      animationId = requestAnimationFrame(render)
    }

    render()

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId)
      }
    }
  }, [handResults])
}
```

### MediaPipe Hand Connections

```typescript
// Hand landmark connections (MediaPipe Hands)
const HAND_CONNECTIONS = [
  // Thumb
  [0, 1], [1, 2], [2, 3], [3, 4],
  // Index finger
  [0, 5], [5, 6], [6, 7], [7, 8],
  // Middle finger
  [0, 9], [9, 10], [10, 11], [11, 12],
  // Ring finger
  [0, 13], [13, 14], [14, 15], [15, 16],
  // Pinky
  [0, 17], [17, 18], [18, 19], [19, 20],
  // Palm
  [5, 9], [9, 13], [13, 17],
]
```

### Responsive Sizing

```typescript
function useResponsiveCanvas(
  videoRef: RefObject<HTMLVideoElement>,
  canvasRef: RefObject<HTMLCanvasElement>,
  containerRef: RefObject<HTMLDivElement>
) {
  useEffect(() => {
    const resizeCanvas = () => {
      const container = containerRef.current
      const canvas = canvasRef.current
      const video = videoRef.current

      if (!container || !canvas || !video) return

      // Maintain aspect ratio
      const aspectRatio = video.videoWidth / video.videoHeight
      const containerWidth = container.clientWidth
      const containerHeight = container.clientHeight

      let width = containerWidth
      let height = containerWidth / aspectRatio

      if (height > containerHeight) {
        height = containerHeight
        width = containerHeight * aspectRatio
      }

      canvas.width = width
      canvas.height = height
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
    }

    window.addEventListener('resize', resizeCanvas)
    resizeCanvas()

    return () => window.removeEventListener('resize', resizeCanvas)
  }, [])
}
```

### Hook Integration

```typescript
function CameraFrame({ className = '' }: CameraFrameProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Camera hook (from Epic 2)
  const {
    startCamera,
    stopCamera,
    isCameraReady,
    error: cameraError,
    videoDimensions,
  } = useCamera()

  // Hand pose detection (from Epic 2)
  const {
    handResults,
    isReady: handPoseReady,
    error: handPoseError,
  } = useHandPose(videoRef)

  // Set up rendering loop
  useRenderingLoop(videoRef, canvasRef, handResults)

  // Handle responsive sizing
  useResponsiveCanvas(videoRef, canvasRef, containerRef)

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover rounded-lg"
      />

      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none"
        style={{ mixBlendMode: 'multiply' }}
      />

      {/* Loading/Error states */}
      {(!isCameraReady || !handPoseReady) && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
          <div className="text-white text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
            <p>Inicializando câmera...</p>
          </div>
        </div>
      )}
    </div>
  )
}
```

---

## Dependencies
- **Blocks:** Story 4.2 (layout usa este componente)
- **Blocked by:** Epic 2 ✅ (useCamera e useHandPose hooks)
- **Requires:** MediaPipe Hands, Canvas API, WebRTC

---

## Definition of Done
- [ ] `src/components/practice/CameraFrame.tsx` criado e funcional
- [ ] Feed da câmera exibido corretamente
- [ ] Canvas overlay com landmarks desenhados (21 pontos por mão)
- [ ] Atualização em tempo real (~30 FPS)
- [ ] Suporte a múltiplas mãos (até 2)
- [ ] Design responsivo funcionando
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
<!-- Dev: How did you verify the camera frame with overlay works? -->

---

## Senior Developer Review (AI)

<!-- Code Review Agent: Add findings here after *code-review -->

