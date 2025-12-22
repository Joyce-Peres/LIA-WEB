# Story 4.4: Sistema de Estrelas com Combo Visual

**Epic:** Epic 4 - Interface de Prática e Feedback Visual
**Story ID:** `4-4-sistema-de-estrelas-com-combo-visual`
**Status:** `done`
**Priority:** High (gamificação essencial para engajamento)

---

## User Story

**As a user,  
I want to see stars appear when I correctly perform gestures,  
So that I feel motivated and see my progress.**

---

## Acceptance Criteria

**Given** I correctly perform a gesture  
**When** The gesture is recognized with high confidence  
**Then** Stars should appear with animation (purple/yellow theme)  
**And** If I perform multiple correct gestures in a row, stars should get bigger (combo effect)  
**And** Encouragement phrases should appear (varied messages)  
**And** The combo counter should be visible  
**And** The visual effect should be celebratory but not distracting

---

## Context & Background

### Purpose
Este é o sistema de gamificação visual que transforma a prática em uma experiência divertida e motivacional. As estrelas aparecem como recompensa imediata por gestos corretos, criando um loop de feedback positivo que incentiva a continuidade da prática.

### Technical Requirements
- **Animações CSS**: Stars aparecem com efeitos celebratórios
- **Sistema de Combo**: Múltiplas estrelas consecutivas aumentam o efeito
- **Mensagens Motivacionais**: Frases variadas de encorajamento
- **Contador Visual**: Indicador de combo atual
- **Performance**: Animações leves que não impactam FPS

### Architecture Alignment
- **Story 4.3 dependency:** Integra com feedback visual
- **Gamificação**: Sistema de recompensas visuais
- **Real-time**: Resposta imediata a gestos corretos
- **Progressive Enhancement**: Funciona mesmo com animações desabilitadas

---

## Tasks

### Task 1: Create StarParticle component
- [ ] Create `src/components/practice/StarParticle.tsx`
- [ ] Implement animated star with random trajectories
- [ ] Add purple/yellow color themes
- [ ] Include particle physics (gravity, fade out)

### Task 2: Create ComboSystem hook
- [ ] Create `src/hooks/feedback/useComboSystem.ts`
- [ ] Track consecutive correct gestures
- [ ] Calculate combo multiplier and star count
- [ ] Manage combo timeout and reset

### Task 3: Create EncouragementMessages component
- [ ] Create varied encouragement phrases
- [ ] Random selection based on combo level
- [ ] Animated text appearance and disappearance
- [ ] Position overlay on camera feed

### Task 4: Integrate star system with Practice page
- [ ] Connect star spawning to correct gesture feedback
- [ ] Position stars relative to hand landmarks
- [ ] Manage multiple simultaneous star particles
- [ ] Add combo counter display

### Task 5: Add combo visual effects
- [ ] Larger stars for higher combos
- [ ] Special effects for milestone combos (5x, 10x)
- [ ] Sound effects integration (optional)
- [ ] Screen shake effect for big combos

### Task 6: Create comprehensive tests
- [ ] Test star particle animations
- [ ] Test combo system logic
- [ ] Test encouragement message variety
- [ ] Performance testing for multiple particles

---

## Technical Design

### Star Particle System

```typescript
interface StarParticleProps {
  id: string
  x: number
  y: number
  size: number
  color: 'purple' | 'yellow'
  onComplete: (id: string) => void
}

function StarParticle({ id, x, y, size, color, onComplete }: StarParticleProps) {
  const [position, setPosition] = useState({ x, y })
  const [opacity, setOpacity] = useState(1)
  const [scale, setScale] = useState(0)

  useEffect(() => {
    // Animation sequence
    const animation = [
      { scale: 0, opacity: 0 },
      { scale: 1, opacity: 1 }, // Appear
      { scale: 1.2, opacity: 1 }, // Grow slightly
      { scale: 1, opacity: 0 }, // Fade out
    ]

    // Random trajectory
    const angle = Math.random() * Math.PI * 2
    const distance = 50 + Math.random() * 100
    const duration = 1000 + Math.random() * 1000

    // Animate position
    const startTime = Date.now()
    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)

      // Easing function for natural movement
      const easeOut = 1 - Math.pow(1 - progress, 3)

      setPosition({
        x: x + Math.cos(angle) * distance * easeOut,
        y: y + Math.sin(angle) * distance * easeOut - (easeOut * 50), // Gravity
      })

      setOpacity(1 - progress)
      setScale(1 + progress * 0.5)

      if (progress < 1) {
        requestAnimationFrame(animate)
      } else {
        onComplete(id)
      }
    }

    // Start with appear animation
    setTimeout(() => {
      setScale(1)
      setOpacity(1)
      animate()
    }, 100)
  }, [id, x, y, onComplete])

  return (
    <div
      className={`absolute pointer-events-none select-none ${
        color === 'purple' ? 'text-purple-400' : 'text-yellow-400'
      }`}
      style={{
        left: position.x,
        top: position.y,
        transform: `scale(${scale})`,
        opacity,
        fontSize: `${size}px`,
      }}
    >
      ⭐
    </div>
  )
}
```

### Combo System Hook

```typescript
interface UseComboSystemOptions {
  onComboIncrease?: (combo: number, stars: number) => void
  onComboBreak?: (finalCombo: number) => void
  comboTimeout?: number // ms
}

function useComboSystem(options: UseComboSystemOptions = {}) {
  const { onComboIncrease, onComboBreak, comboTimeout = 3000 } = options

  const [combo, setCombo] = useState(0)
  const [lastCorrectTime, setLastCorrectTime] = useState<number | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout>()

  const addCorrectGesture = useCallback(() => {
    const now = Date.now()

    // Check if combo should continue
    if (lastCorrectTime && (now - lastCorrectTime) < comboTimeout) {
      const newCombo = combo + 1
      setCombo(newCombo)

      // Calculate star count based on combo
      const stars = Math.min(3 + Math.floor(newCombo / 2), 10)
      onComboIncrease?.(newCombo, stars)
    } else {
      // Start new combo
      setCombo(1)
      onComboIncrease?.(1, 3)
    }

    setLastCorrectTime(now)

    // Reset combo timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    timeoutRef.current = setTimeout(() => {
      if (combo > 0) {
        onComboBreak?.(combo)
        setCombo(0)
        setLastCorrectTime(null)
      }
    }, comboTimeout)
  }, [combo, lastCorrectTime, comboTimeout, onComboIncrease, onComboBreak])

  const breakCombo = useCallback(() => {
    if (combo > 0) {
      onComboBreak?.(combo)
      setCombo(0)
      setLastCorrectTime(null)
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
  }, [combo, onComboBreak])

  // Cleanup
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return {
    combo,
    addCorrectGesture,
    breakCombo,
  }
}
```

### Encouragement Messages

```typescript
const ENCOURAGEMENT_MESSAGES = {
  1: ['Ótimo!', 'Muito bem!', 'Excelente!'],
  2: ['Duas vezes!', 'Continuando!', 'Mantendo o ritmo!'],
  3: ['Três seguidas!', 'Você está voando!', 'Incrível!'],
  5: ['Cinco estrelas!', 'Combo incrível!', 'Você é demais!'],
  10: ['Dez seguidas!', 'Mestre absoluto!', 'Lenda viva!'],
}

function getRandomMessage(combo: number): string {
  const messages = ENCOURAGEMENT_MESSAGES[combo as keyof typeof ENCOURAGEMENT_MESSAGES]
    || ENCOURAGEMENT_MESSAGES[1]

  return messages[Math.floor(Math.random() * messages.length)]
}

interface EncouragementMessageProps {
  message: string
  onComplete: () => void
}

function EncouragementMessage({ message, onComplete }: EncouragementMessageProps) {
  const [visible, setVisible] = useState(false)
  const [opacity, setOpacity] = useState(0)
  const [scale, setScale] = useState(0.5)

  useEffect(() => {
    // Appear animation
    setVisible(true)
    setOpacity(1)
    setScale(1)

    // Disappear after 2 seconds
    setTimeout(() => {
      setOpacity(0)
      setScale(0.8)
      setTimeout(onComplete, 300)
    }, 2000)
  }, [onComplete])

  if (!visible) return null

  return (
    <div
      className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none z-50"
      style={{
        opacity,
        transform: `translate(-50%, -50%) scale(${scale})`,
        transition: 'all 0.3s ease-out',
      }}
    >
      <div className="bg-black/80 text-white px-6 py-3 rounded-full text-xl font-bold shadow-2xl">
        {message}
      </div>
    </div>
  )
}
```

### Integration with Practice Page

```typescript
// In Practice.tsx
function Practice() {
  const [stars, setStars] = useState<StarParticleData[]>([])
  const [encouragementMessage, setEncouragementMessage] = useState<string | null>(null)

  // Combo system
  const { combo, addCorrectGesture } = useComboSystem({
    onComboIncrease: (comboLevel, starCount) => {
      // Spawn stars at hand position (simplified)
      const newStars = Array.from({ length: starCount }, (_, i) => ({
        id: `star-${Date.now()}-${i}`,
        x: 200 + Math.random() * 200, // Random position near center
        y: 150 + Math.random() * 100,
        size: 20 + comboLevel * 2, // Bigger stars for higher combos
        color: comboLevel % 2 === 0 ? 'purple' : 'yellow' as const,
      }))

      setStars(prev => [...prev, ...newStars])

      // Show encouragement message
      if (comboLevel >= 2) {
        setEncouragementMessage(getRandomMessage(comboLevel))
      }
    },
  })

  // Handle landmarks (existing code)
  const handleLandmarksDetected = useCallback((landmarks, dimensions) => {
    // ... existing code ...

    if (hasHand && prediction.isCorrect) {
      // Trigger combo system
      addCorrectGesture()
    }
  }, [addCorrectGesture])

  // Handle star completion
  const handleStarComplete = useCallback((starId: string) => {
    setStars(prev => prev.filter(star => star.id !== starId))
  }, [])

  // Handle encouragement message completion
  const handleMessageComplete = useCallback(() => {
    setEncouragementMessage(null)
  }, [])

  return (
    <div className="relative">
      {/* Camera Section */}
      <CameraSection>
        {/* Existing camera content */}

        {/* Star Particles */}
        {stars.map(star => (
          <StarParticle
            key={star.id}
            {...star}
            onComplete={handleStarComplete}
          />
        ))}

        {/* Encouragement Message */}
        {encouragementMessage && (
          <EncouragementMessage
            message={encouragementMessage}
            onComplete={handleMessageComplete}
          />
        )}

        {/* Combo Counter */}
        {combo > 1 && (
          <div className="absolute top-4 left-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm font-bold">
            {combo}x Combo!
          </div>
        )}
      </CameraSection>
    </div>
  )
}
```

---

## Dependencies
- **Blocks:** Story 4.5 (tooltip usa feedback)
- **Blocked by:** Story 4.3 ✅ (feedback states necessários)
- **Requires:** CSS animations, React state management

---

## Definition of Done
- [ ] `src/components/practice/StarParticle.tsx` com animações
- [ ] `src/hooks/feedback/useComboSystem.ts` para rastrear combos
- [ ] Sistema de mensagens de encorajamento variadas
- [ ] Integração com página Practice (estrelas aparecem em gestos corretos)
- [ ] Contador de combo visual
- [ ] Efeitos especiais para combos altos
- [ ] Design responsivo e acessível
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
<!-- Dev: How did you verify the star combo system works? -->

---

## Senior Developer Review (AI)

<!-- Code Review Agent: Add findings here after *code-review -->

