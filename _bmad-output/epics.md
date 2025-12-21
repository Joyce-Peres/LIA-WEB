---
stepsCompleted: [1, 2, 3, 4]
inputDocuments: ['docs/prd.md', 'docs/architeture.md', '_bmad-output/analysis/brainstorming-session-2025-12-21-145636.md']
workflow_complete: true
---

# LIA Web - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for LIA Web, decomposing the requirements from the PRD, UX Design if it exists, and Architecture requirements into implementable stories.

## Requirements Inventory

### Functional Requirements

**F1 - Sistema de Autenticação e Perfil**
- F1.1: Login local (sem serviços externos), com sessão persistida no navegador
- F1.2: Perfil do usuário exibindo: nome, foto, XP total, sequência atual (streak)
- F1.3: Persistência do progresso entre sessões

**F2 - Catálogo de Módulos e Lições**
- F2.1: Estrutura hierárquica: Módulos (ex: "Alfabeto") contêm Lições (ex: "Letra A")
- F2.2: Navegação visual por módulos, com indicação claro de progresso (concluído/desbloqueado/bloqueado)
- F2.3: Cada lição deve exibir: (a) vídeo/imagem de referência, (b) descrição textual, (c) objetivo de prática

**F3 - Motor de Reconhecimento em Tempo Real (Core)**
- F3.1: Captura de vídeo da webcam a 30 FPS, com controle de início/parada
- F3.2: Extração de landmarks das mãos via MediaPipe Hands (21 pontos x,y,z por mão)
- F3.3: Buffer circular que mantém exatamente os últimos 30 frames de landmarks
- F3.4: Carga e execução do modelo LSTM convertido para TensorFlow.js
- F3.5: Lógica de inferência que formata o buffer para o shape [1, 30, 126]
- F3.6: Pós-processamento: threshold de confiança (0.85) e debounce para evitar oscilações

**F4 - Interface Gamificada de Aprendizado**
- F4.1: Tela de prática dividida em: Feed da Câmera, Vídeo de Referência, Controles, Feedback
- F4.2: Sistema de pontuação baseado em precisão e tempo de reconhecimento
- F4.3: Concessão de "Insígnias" (badges) visíveis no perfil por marcos (ex: "Primeiro Sinal", "Módulo Completo")
- F4.4: Feedback visual imediato: Overlay na câmera com cores (Verde/Acerto, Vermelho/Erro, Amarelo/Processando)

**F5 - Sistema de Progresso e Persistência**
- F5.1: Registro automático de lições concluídas e melhor pontuação
- F5.2: Cálculo de Experiência (XP) e atualização de nível
- F5.3: Persistência local do progresso no navegador (sem sincronização remota no MVP)

**F6 - Modo Tradutor (Feature Futura)**
- F6.1: Modo contínuo que traduz sequências de sinais (dactilologia) para texto
- F6.2: Detecção de pausas para delimitar palavras

### NonFunctional Requirements

**NF1 (Latência):** Inferência completa (frame → resultado) < 50ms em hardware médio (Chrome, 8GB RAM)

**NF2 (Precisão):** Acurácia do modelo mantida > 93% para sinais estáticos em condições ideais

**NF3 (Privacidade):** Processamento de vídeo 100% local. Nenhum frame bruto enviado a servidores. Apenas landmarks anonimizados podem ser enviados para analytics

**NF4 (Usabilidade):** Interface responsiva e acessível (WCAG 2.1 AA), funcionando em desktop e mobile

**Critérios de Aceitação de Negócio:**
- CA1: 90% dos usuários-teste conseguem completar a lição "Letra A" sem instruções externas
- CA2: O tempo médio de feedback é inferior a 70ms em 95% das execuções (métricas do navegador)
- CA3: MVP sem dependência de serviços externos: autenticação e persistência funcionam localmente no navegador; processamento de vídeo permanece 100% local

### Additional Requirements

**Requisitos Técnicos da Arquitetura:**

**Stack Tecnológica:**
- Frontend: React 18 + TypeScript + Vite + Tailwind CSS
- Machine Learning: TensorFlow.js (@tensorflow/tfjs) + MediaPipe Hands (@mediapipe/hands)
- Backend (MVP): Sem backend (armazenamento local no navegador)
- Backend (futuro/opcional): BaaS (ex.: Supabase) ou alternativa equivalente, somente se necessário
- Hospedagem (opcional): qualquer host de arquivos estáticos (ou apenas uso local durante o MVP)

**Estrutura de Diretórios:**
- /public/models - Modelo TF.js convertido (.json, .bin)
- /src/components/ui - Botões, Cards, Inputs reutilizáveis
- /src/components/game - CameraFrame, GestureOverlay, ScoreBoard
- /src/hooks - useCamera, useHandPose, useAuth
- /src/services/ai - Lógica pura de IA: normalização, buffer, inferência
- /src/lib/auth.ts - Autenticação local (sessão no navegador)
- /src/types/index.ts - Tipos TypeScript
- /src/pages - Login, Dashboard, LessonRoom, Profile

**Padrões de Design:**
- Estado: Context API + useReducer para estado global
- Hooks Customizados: useCamera, useHandPose para lógica complexa
- Camada de persistência local: utilitários em `/src/lib/*` para sessão/armazenamento sem acoplar a UI ao storage
- Eventos Customizados: Comunicação desacoplada entre UI e pipeline de IA
- Pipeline Funcional: Transformações puras (normalize → buffer → predict → debounce)

**Configuração de Backend (Opcional/Futuro):**
- Se adotado, documentar e integrar um BaaS (ex.: Supabase) apenas após o MVP local estar estável

**Especificações do Pipeline de IA:**
- Formato de entrada: [1, 30, 126] (batch, timesteps, features)
- Buffer FIFO de 30 frames
- Reset do buffer: Se nenhuma mão detectada por 10 frames consecutivos
- Normalização: Replicar exatamente pré-processamento do Python
- Threshold de confiança: 0.85
- Debounce: Mesma predição por 5 frames consecutivos

**Deploy e DevOps:**
- Ambiente dev: localhost:5173 (Vite) — modo local, sem backend
- Ambiente prod (opcional): deploy estático (ex.: GitHub Pages/Netlify/Vercel), sem dependência obrigatória
- Variáveis de ambiente: VITE_APP_VERSION

**Decisões Arquiteturais:**
- MVP sem dependência de serviços externos (offline possível para auth/persistência local)
- Processamento 100% local (edge computing)
- Sem backend Node.js customizado

**Requisitos Adicionais do Brainstorming (Fase 1 - Quick Wins):**
- Sistema de Estrelas com Combo Visual (paleta roxo/amarelo)
- Dashboard com Caminho Linear Visual (estrelas amarelas=concluído, roxas=em progresso, cinza=bloqueado)
- Tooltip com Feedback Técnico (informações de precisão ao passar mouse)
- Onboarding Simplificado
- Sistema de 5 Vidas por lição
- Personal Records no Dashboard (melhor pontuação por sinal, progresso temporal)

### FR Coverage Map

F1.1: Epic 1 - Login local (sem serviços externos)
F1.2: Epic 1 - Perfil do usuário exibindo nome, foto, XP total, streak
F1.3: Epic 1 - Persistência do progresso entre sessões
F2.1: Epic 3 - Estrutura hierárquica módulos/lições
F2.2: Epic 3 - Navegação visual por módulos com indicação de progresso
F2.3: Epic 3 - Exibição de conteúdo da lição (vídeo/imagem, descrição, objetivo)
F3.1: Epic 2 - Captura de vídeo da webcam a 30 FPS
F3.2: Epic 2 - Extração de landmarks das mãos via MediaPipe Hands
F3.3: Epic 2 - Buffer circular que mantém últimos 30 frames
F3.4: Epic 2 - Carga e execução do modelo LSTM convertido para TensorFlow.js
F3.5: Epic 2 - Lógica de inferência que formata buffer para shape [1, 30, 126]
F3.6: Epic 2 - Pós-processamento: threshold de confiança (0.85) e debounce
F4.1: Epic 4 - Tela de prática dividida (Feed da Câmera, Vídeo de Referência, Controles, Feedback)
F4.2: Epic 5 - Sistema de pontuação baseado em precisão e tempo
F4.3: Epic 5 - Concessão de insígnias (badges) visíveis no perfil
F4.4: Epic 4 - Feedback visual imediato com overlay na câmera (Verde/Acerto, Vermelho/Erro, Amarelo/Processando)
F5.1: Epic 5 - Registro automático de lições concluídas e melhor pontuação
F5.2: Epic 5 - Cálculo de Experiência (XP) e atualização de nível
F5.3: Epic 1/Epic 5 - Persistência local do progresso no navegador (sem sincronização remota no MVP)
F6.1: Epic 7 - Modo contínuo que traduz sequências de sinais (dactilologia) para texto
F6.2: Epic 7 - Detecção de pausas para delimitar palavras

## Epic List

### Epic 1: Setup e Autenticação
Usuários podem criar conta e fazer login para acessar a plataforma, com perfil personalizado e persistência de progresso entre sessões.
**FRs covered:** F1.1, F1.2, F1.3

### Epic 2: Motor de Reconhecimento de Gestos (Core)
Sistema reconhece gestos de Libras em tempo real com alta precisão, processando vídeo da webcam através de MediaPipe e modelo LSTM convertido para TensorFlow.js.
**FRs covered:** F3.1, F3.2, F3.3, F3.4, F3.5, F3.6

### Epic 3: Catálogo e Navegação de Conteúdo
Usuários podem navegar e visualizar módulos e lições disponíveis de forma organizada, com indicação clara de progresso (concluído/desbloqueado/bloqueado).
**FRs covered:** F2.1, F2.2, F2.3

### Epic 4: Interface de Prática e Feedback Visual
Usuários podem praticar sinais com feedback visual imediato através de interface dividida em feed da câmera, vídeo de referência, controles e feedback com overlay colorido.
**FRs covered:** F4.1, F4.4

### Epic 5: Sistema de Gamificação e Progresso
Usuários são motivados através de sistema completo de pontuação, XP, insígnias e progresso visual, com sincronização automática de dados.
**FRs covered:** F4.2, F4.3, F5.1, F5.2, F5.3

### Epic 6: Melhorias de UX e Features Adicionais (Quick Wins)
Interface mais atraente e features de engajamento adicionais: sistema de estrelas com combo visual, dashboard com caminho linear, tooltips técnicos, sistema de vidas, e recordes pessoais.
**FRs covered:** Features do brainstorming (Fase 1 - Quick Wins)

### Epic 7: Modo Tradutor (Feature Futura)
Usuários podem traduzir sequências de sinais (dactilologia) para texto em modo contínuo, com detecção automática de pausas.
**FRs covered:** F6.1, F6.2

---

## Epic 1: Setup e Autenticação

Usuários podem criar conta e fazer login para acessar a plataforma, com perfil personalizado e persistência de progresso entre sessões.

### Story 1.1: Configuração Inicial do Projeto React

As a developer,
I want to set up a React + TypeScript + Vite project with the prescribed directory structure,
So that I have a solid foundation for building the LIA Web application.

**Acceptance Criteria:**

**Given** I am starting a new project
**When** I initialize the project with Vite
**Then** The project should have React 18, TypeScript 5.0, and Tailwind CSS configured
**And** The directory structure should match: /public/models, /src/components/ui, /src/components/game, /src/hooks, /src/services/ai, /src/lib, /src/types, /src/pages
**And** Basic Vite configuration should be in place
**And** TypeScript configuration should be properly set up

### Story 1.2: Autenticação local (sem serviços externos)

As a developer,
I want to implement autenticação local (sem serviços externos),
So that o MVP funcione sem depender de plataformas pagas e sem risco de custos.

**Acceptance Criteria:**

**Given** I am on the login page
**When** I click the login button
**Then** a local session should be created and persisted in the browser
**And** I should be redirected to the dashboard
**And** I should be able to sign out, which clears the local session

### Story 1.3: Login (modo local)

As a user,
I want to log in using local-only mode,
So that I can access the LIA Web MVP without any external service setup.

**Acceptance Criteria:**

**Given** I am on the login page
**When** I click "Entrar (modo local)"
**Then** my local session should be established
**And** I should be redirected to the dashboard
**And** If authentication fails, an appropriate error message should be displayed

### Story 1.4: Página de Perfil do Usuário

As a user,
I want to view my profile with my name, photo, total XP, and current streak,
So that I can see my progress and achievements.

**Acceptance Criteria:**

**Given** I am logged in
**When** I navigate to my profile page
**Then** I should see my display name as **"LIA"**
**And** I should see an avatar (generated locally)
**And** I should see my total XP (initially 0)
**And** I should see my current streak (initially 0)
**And** The data should be loaded from local storage in the browser
**And** If the profile doesn't exist, it should be created automatically on first login

### Story 1.5: Persistência de Sessão e Progresso

As a user,
I want my session and progress to be saved between visits,
So that I don't lose my learning progress when I return to the platform.

**Acceptance Criteria:**

**Given** I have logged in previously
**When** I return to the application
**Then** My local session should be automatically restored if still valid
**And** My local progress data should be loaded from browser storage
**And** I should be redirected to the dashboard if session is valid
**And** If session is cleared, I should be redirected to login page
**And** Progress data should be persisted locally without any network dependency

---

## Epic 2: Motor de Reconhecimento de Gestos (Core)

Sistema reconhece gestos de Libras em tempo real com alta precisão, processando vídeo da webcam através de MediaPipe e modelo LSTM convertido para TensorFlow.js.

### Story 2.1: Conversão do Modelo LSTM para TensorFlow.js

As a developer,
I want to convert the trained LSTM model (modelo_gestos.h5) to TensorFlow.js format,
So that the model can run in the browser for real-time gesture recognition.

**Acceptance Criteria:**

**Given** I have the trained model file (modelo_gestos.h5) from the Python prototype
**When** I run the conversion script
**Then** The model should be converted to TensorFlow.js format (.json and .bin files)
**And** The converted model should maintain the same input shape [1, 30, 126]
**And** The model should be placed in /public/models directory
**And** The conversion should preserve model accuracy (>93%)

### Story 2.2: Implementação do Hook useCamera

As a developer,
I want to create a custom hook for camera management,
So that video capture can be easily integrated into components.

**Acceptance Criteria:**

**Given** I have a component that needs camera access
**When** I use the useCamera hook
**Then** The hook should request camera permissions
**And** The hook should initialize video stream at 30 FPS
**And** The hook should provide start/stop camera controls
**And** The hook should handle camera errors gracefully
**And** The hook should return video element reference and camera state

### Story 2.3: Integração do MediaPipe Hands

As a developer,
I want to integrate MediaPipe Hands for hand landmark extraction,
So that I can extract 21 points (x, y, z) per hand from video frames.

**Acceptance Criteria:**

**Given** I have a video stream from the camera
**When** I initialize MediaPipe Hands
**Then** MediaPipe should be configured to detect up to 2 hands
**And** For each detected hand, I should receive 21 landmarks with x, y, z coordinates
**And** If no hands are detected, the result should be null
**And** The processing should run at ~30 FPS without blocking the main thread
**And** MediaPipe should handle edge cases (partial hand visibility, multiple hands)

### Story 2.4: Implementação do Buffer Circular de 30 Frames

As a developer,
I want to implement a circular buffer that maintains exactly the last 30 frames of landmarks,
So that I can feed sequential data to the LSTM model.

**Acceptance Criteria:**

**Given** I have landmarks from MediaPipe Hands
**When** I add landmarks to the buffer
**Then** The buffer should maintain exactly 30 frames (FIFO)
**And** If buffer.length < 30, no inference should be triggered
**And** If no hands are detected for 10 consecutive frames, the buffer should be cleared
**And** The buffer should handle cases where only one hand is detected (fill second hand with zeros)
**And** The buffer should format data for shape [1, 30, 126] (batch, timesteps, features)

### Story 2.5: Normalização de Landmarks

As a developer,
I want to normalize landmarks exactly as done in Python training,
So that the model receives input in the expected format.

**Acceptance Criteria:**

**Given** I have raw landmarks from MediaPipe
**When** I normalize the landmarks
**Then** X coordinates should be divided by video width
**And** Y coordinates should be divided by video height
**And** Z coordinates should remain relative (not normalized)
**And** The normalization should match exactly the Python preprocessing
**And** The output should be a flat array of 126 features (21 points × 3 coords × 2 hands)

### Story 2.6: Carga e Execução do Modelo TensorFlow.js

As a developer,
I want to load and execute the TensorFlow.js model for inference,
So that I can recognize gestures in real-time.

**Acceptance Criteria:**

**Given** I have a buffer of 30 normalized frames
**When** I trigger inference
**Then** The model should be loaded from /public/models on first use
**And** The buffer should be formatted to shape [1, 30, 126]
**And** The model should return probability distribution (softmax) for all gesture classes
**And** Inference should complete in <50ms on average hardware
**And** The model should handle loading errors gracefully

### Story 2.7: Pós-processamento com Threshold e Debounce

As a developer,
I want to apply confidence threshold and debounce logic to predictions,
So that I get stable, accurate gesture recognition without oscillations.

**Acceptance Criteria:**

**Given** I have model predictions (probability distribution)
**When** I process the predictions
**Then** Only predictions with confidence > 0.85 should be considered valid
**And** The same prediction must repeat for 5 consecutive frames before being accepted
**And** If confidence drops below 0.85, the prediction should be reset
**And** If prediction changes before 5 frames, the counter should reset
**And** The final accepted prediction should be returned with confidence value

---

## Epic 3: Catálogo e Navegação de Conteúdo

Usuários podem navegar e visualizar módulos e lições disponíveis de forma organizada, com indicação clara de progresso (concluído/desbloqueado/bloqueado).

### Story 3.1: Criação das Tabelas de Módulos e Lições no Supabase

As a developer,
I want to create database tables for modules and lessons,
So that content can be stored and retrieved from Supabase.

**Acceptance Criteria:**

**Given** I have access to Supabase database
**When** I execute the SQL schema
**Then** The modules table should be created with: id, slug, title, description, difficulty_level, order_index, icon_url
**And** The lessons table should be created with: id, module_id (FK), gesture_name, display_name, video_ref_url, min_confidence_threshold, xp_reward
**And** Initial data should be inserted: Alfabeto (iniciante, order 1), Números (iniciante, order 2), Saudações (intermediario, order 3)
**And** Foreign key constraints should be properly set up
**And** RLS policies should allow all users to read modules and lessons

### Story 3.2: Serviço de Repositório para Módulos e Lições

As a developer,
I want to create repository functions for fetching modules and lessons,
So that components can easily access content data.

**Acceptance Criteria:**

**Given** I have Supabase client configured
**When** I call the repository functions
**Then** getModules() should return all modules ordered by order_index
**And** getLessonsByModule(moduleId) should return all lessons for a module
**And** getLessonById(lessonId) should return a specific lesson with module info
**And** All functions should handle errors and return null on failure
**And** Functions should be typed with TypeScript interfaces

### Story 3.3: Página de Catálogo de Módulos

As a user,
I want to see all available modules in a visual catalog,
So that I can choose what to learn.

**Acceptance Criteria:**

**Given** I am logged in and on the modules catalog page
**When** The page loads
**Then** I should see all modules displayed as cards or tiles
**And** Each module should show: title, description, difficulty level, icon
**And** Modules should be ordered by order_index
**And** I should see visual indication of my progress per module (not started/in progress/completed)
**And** I should be able to click on a module to see its lessons

### Story 3.4: Dashboard com Caminho Linear Visual

As a user,
I want to see my learning progress as a linear path with visual indicators,
So that I can understand my progress through the content.

**Acceptance Criteria:**

**Given** I am on the dashboard
**When** I view the learning path
**Then** I should see a linear path showing all lessons
**And** Completed lessons should show yellow stars
**And** In-progress lessons should show purple stars
**And** Locked lessons should show light gray stars
**And** The path should have smooth animations when lessons are completed
**And** Clicking on a lesson should navigate to the lesson page (if unlocked)

### Story 3.5: Página de Detalhes da Lição

As a user,
I want to view lesson details before practicing,
So that I know what I'm about to learn.

**Acceptance Criteria:**

**Given** I am viewing a lesson detail page
**When** The page loads
**Then** I should see the lesson's video/image reference
**And** I should see a textual description of the gesture
**And** I should see the practice objective
**And** I should see the XP reward for completing the lesson
**And** I should see a "Start Practice" button if the lesson is unlocked
**And** If the lesson is locked, I should see why (previous lesson not completed)

---

## Epic 4: Interface de Prática e Feedback Visual

Usuários podem praticar sinais com feedback visual imediato através de interface dividida em feed da câmera, vídeo de referência, controles e feedback com overlay colorido.

### Story 4.1: Componente CameraFrame com Overlay

As a user,
I want to see my camera feed with hand landmarks overlay,
So that I can see how my hands are being detected.

**Acceptance Criteria:**

**Given** I am on the practice page
**When** I start the camera
**Then** I should see my camera feed displayed
**And** Hand landmarks should be drawn on a canvas overlay
**And** The overlay should show 21 points per detected hand
**And** The landmarks should update in real-time (~30 FPS)
**And** The overlay should be responsive to different screen sizes

### Story 4.2: Layout da Tela de Prática

As a user,
I want a well-organized practice screen with all necessary elements,
So that I can practice effectively.

**Acceptance Criteria:**

**Given** I am on the practice page
**When** The page loads
**Then** I should see the camera feed section (left or top)
**And** I should see the reference video/image section
**And** I should see control buttons (start/stop camera, reset)
**And** I should see feedback section showing current prediction
**And** The layout should be responsive (desktop and mobile)
**And** All sections should be clearly separated and labeled

### Story 4.3: Feedback Visual com Cores (Overlay)

As a user,
I want immediate visual feedback when I perform gestures,
So that I know if I'm doing it correctly.

**Acceptance Criteria:**

**Given** I am practicing a gesture
**When** The system recognizes my gesture
**Then** The camera overlay should turn green when gesture is correct
**And** The overlay should turn red when gesture is incorrect
**And** The overlay should turn yellow when processing/recognizing
**And** The color change should be smooth and immediate
**And** The feedback should be clearly visible without obstructing the camera view

### Story 4.4: Sistema de Estrelas com Combo Visual

As a user,
I want to see stars appear when I correctly perform gestures,
So that I feel motivated and see my progress.

**Acceptance Criteria:**

**Given** I correctly perform a gesture
**When** The gesture is recognized with high confidence
**Then** Stars should appear with animation (purple/yellow theme)
**And** If I perform multiple correct gestures in a row, stars should get bigger (combo effect)
**And** Encouragement phrases should appear (varied messages)
**And** The combo counter should be visible
**And** The visual effect should be celebratory but not distracting

### Story 4.5: Tooltip com Feedback Técnico

As a user,
I want to see technical details about my gesture recognition,
So that I can understand the precision of my movements.

**Acceptance Criteria:**

**Given** I am practicing and stars appear
**When** I hover over the stars or feedback area
**Then** A tooltip should appear showing confidence percentage
**And** The tooltip should show inference time
**And** The tooltip should be non-intrusive and dismissible
**And** The tooltip should only appear on hover/click, not automatically

---

## Epic 5: Sistema de Gamificação e Progresso

Usuários são motivados através de sistema completo de pontuação, XP, insígnias e progresso visual, com sincronização automática de dados.

### Story 5.1: Sistema de Pontuação Baseado em Precisão e Tempo

As a user,
I want my performance to be scored based on accuracy and speed,
So that I can track my improvement.

**Acceptance Criteria:**

**Given** I am practicing a gesture
**When** I correctly perform the gesture
**Then** My score should be calculated based on confidence level (higher confidence = higher score)
**And** My score should be adjusted based on time to recognition (faster = bonus points)
**And** The score should be displayed in real-time
**And** My best score for the lesson should be tracked and displayed
**And** The scoring formula should be consistent and fair

### Story 5.2: Sistema de 5 Vidas por Lição

As a user,
I want to have limited attempts per lesson,
So that I am motivated to practice carefully.

**Acceptance Criteria:**

**Given** I am practicing a lesson
**When** I start the lesson
**Then** I should have 5 lives (attempts) available
**And** Each incorrect gesture should consume one life
**And** The remaining lives should be displayed visually
**And** When I run out of lives, I should see a message and need to restart the lesson
**And** Lives should reset when I restart the lesson or move to a new lesson

### Story 5.3: Cálculo e Atualização de XP

As a user,
I want to earn XP when I complete lessons,
So that I can see my overall progress.

**Acceptance Criteria:**

**Given** I complete a lesson successfully
**When** The lesson is marked as completed
**Then** I should earn XP based on the lesson's xp_reward value
**And** My total_xp in the profile should be updated
**And** The XP gain should be displayed with animation
**And** XP should be saved to Supabase immediately
**And** The XP calculation should account for lesson difficulty

### Story 5.4: Sistema de Insígnias (Badges)

As a user,
I want to earn badges for milestones,
So that I feel accomplished and motivated.

**Acceptance Criteria:**

**Given** I achieve certain milestones
**When** I complete my first gesture, complete a module, etc.
**Then** I should receive a badge notification
**And** The badge should be visible on my profile page
**And** Badges should have names like "Primeiro Sinal", "Módulo Completo"
**And** Badge data should be stored in Supabase (new badges table or user_progress)
**And** Badges should be displayed with icons/visuals

### Story 5.5: Registro Automático de Progresso

As a user,
I want my progress to be automatically saved,
So that I don't lose my achievements.

**Acceptance Criteria:**

**Given** I complete a lesson or achieve a milestone
**When** The action is completed
**Then** The progress should be saved to user_progress table in Supabase
**And** is_completed should be set to true when lesson is mastered
**And** best_score should be updated if current score is higher
**And** attempts_count should be incremented
**And** first_completed_at should be set on first completion
**And** last_practiced_at should be updated on each practice session

### Story 5.6: Personal Records no Dashboard

As a user,
I want to see my personal best scores and progress over time,
So that I can track my improvement.

**Acceptance Criteria:**

**Given** I am on my personal dashboard
**When** I view the records section
**Then** I should see my best score for each completed lesson
**And** I should see a temporal progress graph showing my improvement
**And** The graph should show score progression over time
**And** When I beat a personal record, it should be highlighted/celebrated
**And** The data should be loaded from user_progress table

### Story 5.7: Sincronização Contínua com Supabase

As a developer,
I want progress data to sync continuously with Supabase,
So that data is never lost and works across devices.

**Acceptance Criteria:**

**Given** I have progress updates to save
**When** Progress changes occur
**Then** Updates should be queued and sent to Supabase
**And** Failed updates should be retried automatically
**And** Updates should be debounced to avoid excessive API calls
**And** The sync status should be indicated to the user (optional loading indicator)
**And** Data should sync on page unload/close

---

## Epic 6: Melhorias de UX e Features Adicionais (Quick Wins)

Interface mais atraente e features de engajamento adicionais: sistema de estrelas com combo visual, dashboard com caminho linear, tooltips técnicos, sistema de vidas, e recordes pessoais.

### Story 6.1: Onboarding Simplificado

As a new user,
I want a quick and simple onboarding process,
So that I can start learning immediately.

**Acceptance Criteria:**

**Given** I am a new user logging in for the first time
**When** I complete authentication
**Then** I should see a brief welcome message (1-2 screens max)
**And** I should see a quick explanation of how to practice (optional)
**And** I should be able to skip the onboarding
**And** After onboarding, I should be taken directly to the dashboard
**And** The onboarding should not be shown again on subsequent logins

**Note:** Stories 4.4 (Estrelas), 3.4 (Caminho Linear), 4.5 (Tooltip), 5.2 (Vidas), and 5.6 (Records) are already covered in previous epics. This epic focuses on additional UX polish and the onboarding flow.

---

## Epic 7: Modo Tradutor (Feature Futura)

Usuários podem traduzir sequências de sinais (dactilologia) para texto em modo contínuo, com detecção automática de pausas.

### Story 7.1: Modo Tradutor Contínuo

As a user,
I want to translate continuous sequences of signs to text,
So that I can use Libras for communication.

**Acceptance Criteria:**

**Given** I am in translator mode
**When** I perform a sequence of signs
**Then** The system should recognize signs continuously
**And** Signs should be translated to text in real-time
**And** The translated text should be displayed
**And** The system should handle multiple signs in sequence
**And** Translation should maintain accuracy >93%

### Story 7.2: Detecção de Pausas para Delimitar Palavras

As a user,
I want the system to detect pauses between words,
So that my signing is properly segmented into words.

**Acceptance Criteria:**

**Given** I am signing in translator mode
**When** I pause between signs
**Then** The system should detect the pause (e.g., >1 second of no hand movement)
**And** The pause should trigger word boundary detection
**And** Signs before the pause should be grouped as one word
**And** The word should be added to the translated text
**And** The pause detection should be configurable/tunable

