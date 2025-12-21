# PRD Técnico: LIA Web (Libras com Inteligência Artificial)

## 1. Visão e Objetivos
Problema Central: Escassez de ferramentas interativas, acessíveis e com feedback automático para o ensino autônomo de Libras.

Solução Proposta: Plataforma web responsiva que, usando a câmera do usuário, ensina sinais de Libras e fornece feedback em tempo real via IA, com processamento 100% local para garantir privacidade.

Objetivo Técnico: Portar o protótipo acadêmico LIA (Python/LSTM) para uma aplicação web escalável, mantendo acurácia >93% e latência <50ms.

## 2. Público-Alvo
Persona Primária (Aprendiz): Adultos ouvintes que desejam aprender Libras básico de forma autônoma, flexível e com feedback imediato.

Persona Secundária (Revisor): Usuários surdos ou fluentes em Libras que validam a precisão cultural dos sinais ensinados.

## 3. Requisitos Funcionais (Para Fragmentação/Sharding)
F1 - Sistema de Autenticação e Perfil
F1.1: Login com conta Google via Supabase Auth.

F1.2: Perfil do usuário exibindo: nome, foto, XP total, sequência atual (streak).

F1.3: Persistência do progresso entre sessões.

F2 - Catálogo de Módulos e Lições
F2.1: Estrutura hierárquica: Módulos (ex: "Alfabeto") contêm Lições (ex: "Letra A").

F2.2: Navegação visual por módulos, com indicação claro de progresso (concluído/desbloqueado/bloqueado).

F2.3: Cada lição deve exibir: (a) vídeo/imagem de referência, (b) descrição textual, (c) objetivo de prática.

F3 - Motor de Reconhecimento em Tempo Real (Core)
F3.1: Captura de vídeo da webcam a 30 FPS, com controle de início/parada.

F3.2: Extração de landmarks das mãos via MediaPipe Hands (21 pontos x,y,z por mão).

F3.3: Buffer circular que mantém exatamente os últimos 30 frames de landmarks.

F3.4: Carga e execução do modelo LSTM convertido para TensorFlow.js.

F3.5: Lógica de inferência que formata o buffer para o shape [1, 30, 126].

F3.6: Pós-processamento: threshold de confiança (0.85) e debounce para evitar oscilações.

F4 - Interface Gamificada de Aprendizado
F4.1: Tela de prática dividida em: Feed da Câmera, Vídeo de Referência, Controles, Feedback.

F4.2: Sistema de pontuação baseado em precisão e tempo de reconhecimento.

F4.3: Concessão de "Insígnias" (badges) visíveis no perfil por marcos (ex: "Primeiro Sinal", "Módulo Completo").

F4.4: Feedback visual imediato: Overlay na câmera com cores (Verde/Acerto, Vermelho/Erro, Amarelo/Processando).

F5 - Sistema de Progresso e Persistência
F5.1: Registro automático de lições concluídas e melhor pontuação.

F5.2: Cálculo de Experiência (XP) e atualização de nível.

F5.3: Sincronização contínua e segura com o banco de dados Supabase.

F6 - Modo Tradutor (Feature Futura)
F6.1: Modo contínuo que traduz sequências de sinais (dactilologia) para texto.

F6.2: Detecção de pausas para delimitar palavras.

## 4. Requisitos Não-Funcionais e KPIs
KPIs Técnicos (Mensuráveis)
NF1 (Latência): Inferência completa (frame → resultado) < 50ms em hardware médio (Chrome, 8GB RAM).

NF2 (Precisão): Acurácia do modelo mantida > 93% para sinais estáticos em condições ideais.

NF3 (Privacidade): Processamento de vídeo 100% local. Nenhum frame bruto enviado a servidores. Apenas landmarks anonimizados podem ser enviados para analytics.

NF4 (Usabilidade): Interface responsiva e acessível (WCAG 2.1 AA), funcionando em desktop e mobile.

Critérios de Aceitação de Negócio
CA1: 90% dos usuários-teste conseguem completar a lição "Letra A" sem instruções externas.

CA2: O tempo médio de feedback é inferior a 70ms em 95% das execuções (métricas do navegador).

CA3: **Não suportar modo offline** (requer conexão para autenticação e sincronização). O processamento de vídeo permanece 100% local.

## 5. Stack Tecnológica e Decisões de Arquitetura
Decisões Concretas (Sem Ambiguidades):

Frontend: React 18 + TypeScript + Vite + Tailwind CSS.

Machine Learning no Cliente: TensorFlow.js (@tensorflow/tfjs) + MediaPipe Hands (@mediapipe/hands).

Backend & Database: Supabase (PostgreSQL com RLS, Auth, Storage). Não desenvolver backend customizado.

Hospedagem: Vercel (Frontend estático).

Estrutura de Diretórios Prescritiva:

```text
/lia-web
  /public/models          # Modelo TF.js convertido (.json, .bin)
  /src
    /components/ui        # Botões, Cards, Inputs reutilizáveis
    /components/game      # CameraFrame, GestureOverlay, ScoreBoard
    /hooks                # useCamera, useHandPose, useAuth
    /services/ai          # Lógica pura de IA: normalização, buffer, inferência
    /lib/supabase.ts      # Cliente configurado do Supabase
    /types/index.ts       # Tipos TypeScript (User, Landmark, Prediction)
    /pages/               # Login, Dashboard, LessonRoom, Profile
```

## 6. Especificações do Pipeline de IA (Crítico)

### 6.1. Formato de Entrada do Modelo
O modelo LSTM original foi treinado com sequências temporais de 30 frames.

Cada frame contém landmarks de até 2 mãos (21 pontos x 3 coordenadas x 2 mãos = 126 features).

Shape do Tensor de Entrada: [1, 30, 126] (batch, timesteps, features).

Se apenas uma mão for detectada, preencher os valores da segunda mão com 0.

### 6.2. Lógica do Buffer e Inferência
Coletar landmarks do MediaPipe a cada frame (30 FPS).

Adicionar ao buffer FIFO (tamanho fixo: 30 frames).

Regra de reset: Se nenhuma mão for detectada por mais de 10 frames consecutivos, o buffer é limpo.

A inferência só é disparada quando buffer.length === 30.

Aplicar exatamente a mesma normalização usada no treinamento (ex: dividir coordenadas x,y pela largura/altura da tela).

### 6.3. Saída e Debounce
O modelo retorna um array de probabilidades (softmax) para cada sinal do vocabulário.

Threshold de confiança: Considerar válido apenas se confidence > 0.85.

Debounce: Exigir que a mesma predição se repita por pelo menos 5 frames consecutivos antes de atualizar a UI e conceder pontos. Isso evita oscilações.

## 7. Próximos Passos para o Agente (Action Plan)
Instrução para o Cursor/BMAD: "Use este PRD como fonte única da verdade. Ao gerar código, priorize a estrutura de arquivos da Seção 5 e a lógica de IA da Seção 6. Não crie backend Node.js customizado; use exclusivamente o SDK do Supabase."

Setup do Projeto: Inicializar projeto React/TypeScript com a estrutura de diretórios acima.

Configurar Supabase: Criar projeto, executar SQL de criação de tabelas (fornecido no arquitetura.md) e configurar autenticação Google.

Conversão do Modelo: Criar script Python para converter modelo_gestos.h5 para formato TensorFlow.js.

Componente Core: Implementar o hook useHandPose que integra MediaPipe, gerencia o buffer e chama o modelo TF.js.

Interface Básica: Construir a página LessonRoom com os componentes CameraFrame, GestureOverlay e ScoreBoard.

