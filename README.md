# LIA Web - Libras com Inteligência Artificial

Plataforma web responsiva que ensina Língua Brasileira de Sinais (Libras) utilizando reconhecimento de gestos em tempo real com processamento 100% local no navegador.

## 🚀 Tecnologias

- **Frontend:** React 18 + TypeScript + Vite
- **Styling:** Tailwind CSS
- **Machine Learning:** TensorFlow.js + MediaPipe Hands
- **Backend:** Supabase (PostgreSQL, Auth, Storage)
- **Deployment:** Vercel

## 📋 Pré-requisitos

- Node.js 18+ 
- npm ou yarn

## ⚙️ Instalação

1. Clone o repositório:

```bash
git clone <repository-url>
cd LIA-WEB
```

2. Instale as dependências:

```bash
npm install
```

3. Configure as variáveis de ambiente:

```bash
cp .env.example .env
# Edite .env com suas credenciais do Supabase
```

4. Inicie o servidor de desenvolvimento:

```bash
npm run dev
```

O aplicativo estará disponível em `http://localhost:5173`

## 🏗️ Estrutura do Projeto

```
/public/models          # Modelos TensorFlow.js
/src
  /components/ui        # Componentes UI reutilizáveis
  /components/game      # Componentes do jogo (CameraFrame, GestureOverlay, ScoreBoard)
  /hooks                # Hooks customizados (useCamera, useHandPose, useAuth)
  /services/ai          # Lógica de IA (normalização, buffer, inferência)
  /lib                  # Cliente Supabase e utilitários
  /types                # Definições TypeScript
  /pages                # Componentes de página (Login, Dashboard, LessonRoom, Profile)
```

## 📝 Scripts Disponíveis

- `npm run dev` - Inicia servidor de desenvolvimento (localhost:5173)
- `npm run build` - Cria build de produção
- `npm run preview` - Preview do build de produção
- `npm run lint` - Executa linter

## 🎯 Funcionalidades

> Nota: este repositório está em fase inicial (setup). As funcionalidades abaixo serão entregues ao longo das próximas stories/épicos.

- ⏳ Autenticação com Google via Supabase
- ⏳ Reconhecimento de gestos em tempo real
- ⏳ Sistema gamificado (XP, badges, streaks)
- ⏳ Progresso persistente entre sessões
- ✅ Interface responsiva e acessível (base UI + Tailwind, ainda sem telas do produto)

## 👩‍💻 Desenvolvimento

Este projeto segue a metodologia BMad Method para desenvolvimento estruturado.

### Documentação (fonte da verdade)

- `docs/index.md` - hub de documentação (onde atualizar cada informação)
- `docs/prd.md` - requisitos e critérios (PRD)
- `docs/architeture.md` - decisões e padrões técnicos (Arquitetura)

### Artefatos gerados (BMAD)

- `_bmad-output/epics.md` - epics e stories gerados
- `_bmad-output/test-design-system.md` - estratégia de testes (sistema)
- `_bmad-output/implementation-readiness-report-*.md` - readiness report

## 📄 Licença

Projeto acadêmico - SIMAC 2025
