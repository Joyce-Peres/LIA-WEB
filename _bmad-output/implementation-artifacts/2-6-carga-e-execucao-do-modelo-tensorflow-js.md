# Story 2.6: Carga e Execução do Modelo TensorFlow.js

**Epic:** Epic 2 - Motor de Reconhecimento de Gestos (Core)  
**Story ID:** `2-6-carga-e-execucao-do-modelo-tensorflow-js`  
**Status:** `done`  
**Created:** 2025-12-21  
**Priority:** High (depende da Story 2.4 ✅ e 2.5 ✅)

---

## User Story

**As a** developer,  
**I want to** load and execute the TensorFlow.js model for inference,  
**So that** I can recognize gestures in real-time.

---

## Acceptance Criteria

**Given** I have a buffer of 30 normalized frames  
**When** I trigger inference  
**Then** The model should be loaded from /public/models on first use  
**And** The buffer should be formatted to shape [1, 30, 126]  
**And** The model should return probability distribution (softmax) for all gesture classes  
**And** Inference should complete in <50ms on average hardware  
**And** The model should handle loading errors gracefully

---

## Context & Background

### Purpose
Esta é a peça final do pipeline de IA: conectar o buffer normalizado ao modelo TensorFlow.js para obter predições de gestos.

### Technical Requirements
- **Modelo**: TensorFlow.js LayersModel convertido de Keras
- **Input Shape**: [1, 30, 126] (batch, timesteps, features)
- **Output Shape**: [1, 61] (batch, classes) - distribuição softmax
- **Classes**: 61 gestos (números, letras, palavras em Libras)
- **Performance**: <50ms por inferência
- **Carregamento**: Lazy loading na primeira inferência

### Architecture Alignment
- **PRD:** F3.4 - Carga e execução do modelo LSTM convertido para TensorFlow.js
- **Current State:** Modelo mock disponível em /public/models
- **Pipeline:** Buffer → **Model** → Prediction

---

## Tasks

### Task 1: Install TensorFlow.js
- [ ] Install @tensorflow/tfjs package
- [ ] Verify compatibility with Vite bundler

### Task 2: Create useModelInference hook
- [ ] Create `src/hooks/useModelInference.ts`
- [ ] Implement lazy loading of model from /public/models
- [ ] Add inference execution with proper tensor management
- [ ] Handle loading states and errors

### Task 3: Implement model loading
- [ ] Load model.json and weights from /public/models
- [ ] Cache loaded model for subsequent inferences
- [ ] Handle loading errors (network, corrupted files)
- [ ] Provide loading progress feedback

### Task 4: Implement inference execution
- [ ] Convert buffer array to tf.tensor with shape [1, 30, 126]
- [ ] Execute model.predict()
- [ ] Convert output to probability array
- [ ] Clean up tensors to prevent memory leaks

### Task 5: Performance optimization
- [ ] Warm up model on first load
- [ ] Optimize tensor operations
- [ ] Monitor inference time
- [ ] Add performance warnings for slow hardware

### Task 6: Create comprehensive tests
- [ ] Unit tests for hook initialization
- [ ] Mock TensorFlow.js operations
- [ ] Test loading states and error handling
- [ ] Test inference execution with mock data
- [ ] Performance tests (if possible)

---

## Technical Design

### Hook Interface

```typescript
interface ModelInferenceConfig {
  modelPath?: string // Default: '/models/model.json'
  warmup?: boolean // Default: true
}

interface InferenceResult {
  predictions: number[] // 61 probabilities
  predictedClass: number
  confidence: number
  inferenceTime: number // ms
}

interface UseModelInferenceState {
  isLoading: boolean
  isReady: boolean
  error: string | null
  lastInferenceTime: number // ms
  modelLoaded: boolean
}

interface UseModelInferenceControls {
  loadModel: () => Promise<void>
  runInference: (buffer: number[][][]) => Promise<InferenceResult | null>
  warmup: () => Promise<void>
}

type UseModelInferenceReturn = UseModelInferenceState & UseModelInferenceControls
```

### Model Loading Flow

```
User triggers first inference
    ↓
Check if model is loaded
    ↓
If not loaded: load from /public/models/model.json
    ↓
Parse model architecture and load weights
    ↓
Cache model instance
    ↓
Execute warmup (optional)
    ↓
Model ready for inference
```

### Inference Execution

```typescript
async function runInference(buffer: number[][][]): Promise<InferenceResult> {
  // Convert to tensor: [1, 30, 126]
  const inputTensor = tf.tensor(buffer, [1, 30, 126], 'float32')

  // Start timing
  const startTime = performance.now()

  // Run inference
  const outputTensor = model.predict(inputTensor) as tf.Tensor

  // Convert to probabilities
  const probabilities = await outputTensor.data()

  // End timing
  const inferenceTime = performance.now() - startTime

  // Find best prediction
  const predictions = Array.from(probabilities)
  const predictedClass = predictions.indexOf(Math.max(...predictions))
  const confidence = predictions[predictedClass]

  // Cleanup tensors
  inputTensor.dispose()
  outputTensor.dispose()

  return {
    predictions,
    predictedClass,
    confidence,
    inferenceTime
  }
}
```

### Error Handling

```typescript
// Loading errors
- Network failure: "Failed to load model from /models/model.json"
- Corrupted file: "Invalid model file format"
- Unsupported browser: "WebGL not available"

// Inference errors
- Invalid input shape: "Buffer must have shape [1, 30, 126]"
- Model not loaded: "Model not ready for inference"
- Memory issues: "GPU memory exhausted"
```

### Performance Considerations

- **Lazy Loading**: Model loaded only when first inference requested
- **Tensor Cleanup**: Explicit disposal to prevent memory leaks
- **WebGL Backend**: Use GPU acceleration when available
- **Warmup**: Initial dummy inference to optimize subsequent calls
- **Timing**: Monitor inference time for performance warnings

---

## Dependencies
- **Blocks:** Story 2.7 (Pós-processamento precisa das predições)
- **Blocked by:** Story 2.4 ✅ (buffer), Story 2.5 ✅ (normalização)
- **Requires:** TensorFlow.js, modelo em /public/models

---

## Definition of Done
- [ ] @tensorflow/tfjs instalado
- [ ] `src/hooks/useModelInference.ts` criado e implementado
- [ ] Modelo carrega de /public/models na primeira inferência
- [ ] Buffer formatado corretamente para [1, 30, 126]
- [ ] Modelo retorna distribuição de probabilidade (61 classes)
- [ ] Inferência completa em <50ms
- [ ] Tratamento robusto de erros de carregamento
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
<!-- Dev: How did you verify model loading and inference? -->

---

## Senior Developer Review (AI)

<!-- Code Review Agent: Add findings here after *code-review -->

