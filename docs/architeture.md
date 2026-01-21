# Documento de Arquitetura: LIA Web

## 1. Visão Arquitetural
Arquitetura (MVP): Aplicação Web Progressiva (PWA) **sem backend** (modo local). O processamento de IA ocorre integralmente no navegador (edge computing).

Padrão: Separação clara entre:

Cliente Rico (Fat Client): Contém toda a lógica de negócio, interface e pipeline de ML.

Persistência Local (Browser Storage): Autenticação e progresso persistidos no navegador (ex.: `localStorage`/`IndexedDB`), sem dependências de serviços externos.

Serviços Gerenciados (Opcional/Futuro): Um BaaS (ex.: Supabase) pode ser integrado mais tarde para sincronização entre dispositivos, mas **não faz parte do MVP**.

Justificativa: Elimina a complexidade operacional de manter servidores de inferência, reduz custos iniciais, garante privacidade por padrão (dados nunca saem do dispositivo) e atende ao requisito crítico de latência (<50ms).

## 2. Diagrama de Fluxo de Dados

```mermaid
flowchart TD
  U[Usuário] --> UI[Interface Angular]
  UI --> MP[MediaPipe Hands]
  UI --> LA[Auth Local]
  MP --> B[Buffer 30 frames]
  B --> TF[TF.js Model (runtime)]
  TF --> GL[Lógica de Jogo]
  LA --> P[Perfil do Usuário (Local)]
  GL --> F[Feedback UI]
  GL --> PP[Persistência de Progresso]
  P --> PP
```

## 3. Decisões de Design e Padrões

### 3.1. Padrões de Estado
Angular Signals + RxJS: Estado reativo e streams (ex.: resultados do MediaPipe), combinando `signal/computed` e `BehaviorSubject` quando útil.

Services Pattern: A maior parte da lógica de domínio fica encapsulada em serviços (ex.: `AuthService`, `GestureRecognitionService`, `ModelInferenceService`), reduzindo acoplamento com componentes/páginas e facilitando testes.

### 3.2. Padrões de Comunicação
Camada de Persistência Local: Autenticação, perfil e progresso encapsulados em serviços e persistidos em `localStorage` (MVP). Exemplos reais:

- Sessão local: `lia-web/src/app/core/services/auth.service.ts`
- Perfil: `lia-web/src/app/core/services/profile.service.ts`
- Progresso: `lia-web/src/app/core/services/user-progress.service.ts`

Comunicação por streams: O pipeline de IA publica resultados via `results$` (RxJS) e os serviços de orquestração expõem sinais/estado computado para a UI.

### 3.3. Padrões de Processamento de IA
Pipeline Funcional: O fluxo de landmarks é tratado como uma série de transformações puras (normalize → buffer → predict → debounce).

Web Workers (Opcional Fase 2): O processamento do MediaPipe e TF.js pode ser movido para um Worker para não bloquear a thread principal.

## 4. Stack Tecnológica Detalhada

### 4.1. Dependências Principais (package.json)

```json
{
  "dependencies": {
    "@angular/core": "^21.0.0",
    "@angular/router": "^21.0.0",
    "@angular/ssr": "^21.0.4",
    "rxjs": "~7.8.0",
    "@mediapipe/hands": "^0.4.0"
  },
  "devDependencies": {
    "@angular/cli": "^21.0.4",
    "@angular/build": "^21.0.4",
    "typescript": "~5.9.2"
  }
}
```

Observação: o TensorFlow.js é carregado em runtime via CDN (ver `ModelInferenceService`) para reduzir custo de bundling e evitar polyfills de Node no build.

### 4.2. Backend remoto (fora do escopo atual)
O projeto está em **modo local**, sem backend e **sem Supabase**.

Se no futuro houver necessidade de sincronização entre dispositivos, a integração com um BaaS (ex.: Supabase) deve ser tratada como **feature opcional e isolada**.

## 5. Componentes Técnicos Detalhados

### 5.1. Serviços Angular (Core da IA)

O core do reconhecimento está implementado como **serviços Angular**:

- `lia-web/src/app/core/services/handpose.service.ts` (MediaPipe Hands + stream de resultados)
- `lia-web/src/app/core/services/gesture-buffer.service.ts` (buffer circular de 30 frames + reset por ausência)
- `lia-web/src/app/core/services/landmark-normalizer.service.ts` (normalização compatível com o treino)
- `lia-web/src/app/core/services/model-inference.service.ts` (carrega TF.js via CDN + inferência + modo mock)
- `lia-web/src/app/core/services/gesture-recognition.service.ts` (orquestra pipeline completo + pós-processamento)
### 5.2. Normalização de Landmarks

```typescript
// Referência: `lia-web/src/app/core/services/landmark-normalizer.service.ts`
// O requisito é manter o pré-processamento consistente com o treino.
```
### 5.3. Página de prática + overlay (Angular)

```typescript
// Referência: `lia-web/src/app/pages/practice.component.ts` (+ HTML/CSS)
// Responsabilidades (alto nível):
// 1. Gerenciar stream de vídeo da webcam (via `CameraService`)
// 2. Desenhar landmarks em um <canvas> sobreposto (quando aplicável)
// 3. Acionar o pipeline (`GestureRecognitionService`) usando o <video>
// 4. Aplicar feedback visual conforme estado (recognizing/correct/incorrect)
```

## 6. Estratégia de Implantação e DevOps

### 6.1. Ambiente
Desenvolvimento: localhost:4200 (Angular dev server) — modo local, sem backend.

Produção (MVP): Opcional. Frontend estático em qualquer host de arquivos estáticos (ou apenas uso local), sem dependências de backend.

### 6.2. Variáveis de Ambiente (.env.example)

```env
# Preferir configuração via Angular environments (`src/environments/*`)
# e/ou build-time replacements do Angular CLI quando necessário.
```

### 6.3. Pipeline de Deploy
Push para branch main → trigger CI (opcional)

Build do frontend (TypeScript compilation, bundling)

Upload de assets estáticos para host de arquivos estáticos (opcional)

Deploy automático com URL de preview

## 7. Monitoramento e Métricas

### 7.1. Métricas do Cliente (Logging no Console)

```typescript
// Estrutura de log para análise de performance
interface InferenceLog {
  timestamp: number;
  inferenceTime: number; // tempo em ms
  confidence: number;
  gesturePredicted: string;
  gestureCorrect: string;
  bufferFillPct: number;
}
```

### 7.2. Dashboards (Opcional/Futuro)
Uso: Usuários ativos diários/semanais.

Progresso: Média de lições concluídas por usuário.

Performance: Latência média de inferência agregada.

Engajamento: XP total distribuído, insígnias mais conquistadas.

## 8. Riscos e Planos de Mitigação

| Risco | Probabilidade | Impacto | Mitigação |
| --- | --- | --- | --- |
| Modelo TF.js muito lento no mobile | Alta | Alto | 1. Quantização do modelo. 2. Fallback para versão reduzida (10 frames). 3. Feedback visual de “processando”. |
| MediaPipe não detecta mãos em baixa luz | Média | Médio | 1. Guia visual de posicionamento. 2. Modo “prática” sem validação. 3. Usar iluminação auxiliar como preenchimento. |
| Limites de storage local / quotas do navegador | Média | Médio | Evitar armazenar blobs grandes em `localStorage`; preferir `IndexedDB` quando necessário; documentar limites por navegador. |

## 9. Roadmap Técnico

Fase 1 (MVP): Core funcional.

PRD & Arquitetura

Setup do projeto (modo local, sem backend)

Conversão do modelo LSTM → TF.js

Página de prática para o alfabeto

Autenticação e perfil básico

Fase 2 (Gamificação): Engajamento.

Sistema completo de XP e insígnias

Múltiplos módulos (Números, Saudações)

Dashboard de progresso

Animações e feedback polido

Fase 3 (Escala): Robustez e features.

Modo Tradutor (dactilologia)

Web Workers para IA

Testes E2E (Playwright)

PWA (instalável, sem modo offline)