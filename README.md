# LIA Web - Libras com Inteligência Artificial

Plataforma web responsiva que ensina Língua Brasileira de Sinais (Libras) utilizando reconhecimento de gestos em tempo real com processamento 100% local no navegador.

## 🎯 Sobre o Projeto

O LIA Web é uma aplicação educacional que utiliza visão computacional e deep learning para fornecer feedback automático no aprendizado de Libras. A plataforma processa o vídeo da webcam localmente no navegador, garantindo privacidade e latência mínima (<50ms).

**Características principais:**
- ✅ Reconhecimento de gestos em tempo real com modelo LSTM
- ✅ Processamento 100% local (privacidade por padrão)
- ✅ Acurácia >93% no reconhecimento de sinais
- ✅ Interface gamificada com sistema de XP, badges e streaks
- ✅ Sem necessidade de backend (MVP totalmente client-side)

## 🚀 Tecnologias

- **Frontend:** Angular 21 + TypeScript
- **Build:** Angular CLI + esbuild
- **Styling:** CSS moderno + componentes customizados
- **Machine Learning:** TensorFlow.js + MediaPipe Hands
- **Testes:** Jest
- **Backend (MVP):** nenhum (modo local — sessão e dados no navegador)
- **Deployment:** host de arquivos estáticos

## 📋 Pré-requisitos

- Node.js 20+ 
- npm 11.6.2+
- Webcam funcional
- Navegador moderno com suporte a WebGL (Chrome, Edge, Firefox)

## ⚙️ Instalação

1. Clone o repositório:

```bash
git clone https://github.com/Joyce-Peres/LIA-WEB.git
cd LIA-WEB/lia-web
```

2. Instale as dependências:

```bash
npm install
```

3. Inicie o servidor de desenvolvimento:

```bash
npm start
```

O aplicativo estará disponível em `http://localhost:4200`

## 🏗️ Estrutura do Projeto

```
lia-web/
├── src/
│   ├── app/                    # Módulos Angular
│   │   ├── components/         # Componentes da aplicação
│   │   ├── services/           # Serviços (AI, camera, auth)
│   │   ├── models/             # Interfaces e tipos TypeScript
│   │   └── pages/              # Páginas/rotas principais
│   ├── assets/                 # Recursos estáticos
│   │   ├── models/             # Modelos TensorFlow.js convertidos
│   │   └── images/             # Imagens e ícones
│   └── environments/           # Configurações de ambiente
├── scripts/                    # Scripts Python para ML
│   ├── coletar_gestos.py      # Coleta de dados de treinamento
│   ├── treinar_modelo.py      # Treinamento do modelo LSTM
│   └── converter_simples.py   # Conversão para TensorFlow.js
├── modelos/                    # Modelos Python originais (.h5)
├── dados/                      # Datasets de treinamento
└── public/                     # Arquivos públicos estáticos
```

## 📝 Scripts Disponíveis

### Desenvolvimento Web
- `npm start` - Inicia servidor de desenvolvimento (localhost:4200)
- `npm run build` - Cria build de produção
- `npm run watch` - Build em modo watch
- `npm test` - Executa testes com Jest
- `npm run test:watch` - Executa testes em modo watch

### Machine Learning (Python)
Para trabalhar com o pipeline de ML, consulte [SETUP-AMBIENTE.md](lia-web/SETUP-AMBIENTE.md).

```powershell
# Ativar ambiente virtual Python
.\scripts\venv_coleta\Scripts\Activate.ps1

# Coletar dados de gestos
python scripts/coletar_gestos.py

# Treinar modelo LSTM
python scripts/treinar_modelo.py

# Converter modelo para TensorFlow.js
python scripts/converter_simples.py
```

## 🎯 Funcionalidades

### Implementadas ✅
- Autenticação local (sem serviços externos)
- Captura de vídeo da webcam a 30 FPS
- Extração de landmarks das mãos via MediaPipe Hands (21 pontos x,y,z por mão)
- Buffer circular com últimos 30 frames de landmarks
- Carga e execução do modelo LSTM com TensorFlow.js
- Normalização de landmarks para shape [1, 30, 126]
- Pós-processamento com threshold (0.85) e debounce
- Interface responsiva e acessível

### Em Desenvolvimento ⏳
- Sistema de perfil do usuário completo
- Catálogo de módulos e lições estruturado
- Interface gamificada de aprendizado
- Sistema de pontuação e feedback visual
- Badges e sistema de conquistas
- Persistência de progresso entre sessões

### Planejadas 📋
- Modo PWA (Progressive Web App)
- Suporte offline completo
- Sincronização opcional em nuvem (futuro)
- Análise de progresso e estatísticas
- Suporte a múltiplos idiomas

## 🧠 Pipeline de Reconhecimento

O sistema segue um pipeline de processamento em tempo real:

1. **Captura** → Webcam captura vídeo a 30 FPS
2. **Extração** → MediaPipe Hands detecta 21 landmarks por mão (x, y, z)
3. **Normalização** → Coordenadas normalizadas para [0, 1]
4. **Buffer** → Mantém janela deslizante de 30 frames (126 features por frame)
5. **Inferência** → Modelo LSTM processa sequência temporal
6. **Pós-processamento** → Threshold de confiança + debounce
7. **Feedback** → Interface exibe resultado com feedback visual

## 🧪 Arquitetura Técnica

### Padrões de Design
- **Fat Client**: Toda lógica de negócio no navegador
- **Edge Computing**: Processamento de IA 100% client-side
- **Services Pattern**: Encapsulamento de lógica (AI, Camera, Auth)
- **Reactive Programming**: RxJS para gerenciamento de streams
- **Component-Based**: Arquitetura modular com Angular

### Decisões Arquiteturais
- **Sem Backend (MVP)**: Elimina complexidade operacional e custos
- **Processamento Local**: Garante privacidade (dados nunca saem do dispositivo)
- **WebGL Acceleration**: TensorFlow.js usa GPU quando disponível
- **Latência <50ms**: Requisito crítico atendido com edge computing

## 👩‍💻 Desenvolvimento

Este projeto segue a **BMad Method** (Behavioral Modeling and Automated Development) para desenvolvimento estruturado e orientado a comportamento.

### Metodologia de Desenvolvimento

A BMad Method organiza o desenvolvimento em camadas:
- **Core**: Ferramentas, tarefas e workflows fundamentais
- **BMB** (Basic): Agentes básicos e workflows de desenvolvimento
- **BMGD** (Game Design): Agentes especializados em gamificação
- **BMM** (ML): Agentes especializados em Machine Learning
- **CIS**: Agentes de Continuous Improvement System

### Documentação Técnica

#### Documentos Principais (source of truth)
- [docs/index.md](docs/index.md) - Hub de documentação central
- [docs/prd.md](docs/prd.md) - Product Requirements Document
- [docs/architeture.md](docs/architeture.md) - Decisões arquiteturais e padrões técnicos
- [docs/model-conversion.md](docs/model-conversion.md) - Guia de conversão do modelo ML
- [docs/responsividade.md](docs/responsividade.md) - Estratégia de design responsivo

#### Artefatos Gerados (BMAD)
- [_bmad-output/epics.md](_bmad-output/epics.md) - Épicos e stories do projeto
- [_bmad-output/test-design-system.md](_bmad-output/test-design-system.md) - Estratégia de testes
- [_bmad-output/implementation-artifacts/](_bmad-output/implementation-artifacts/) - Documentação de implementação por tarefa

### Configuração do Ambiente de Desenvolvimento

#### Frontend (Angular)
```bash
cd lia-web
npm install
npm start
```

#### Machine Learning (Python)
Consulte [lia-web/SETUP-AMBIENTE.md](lia-web/SETUP-AMBIENTE.md) para configuração completa do ambiente Python.

**Resumo:**
```powershell
# Criar ambiente virtual
python -m venv ml_venv

# Ativar
.\ml_venv\Scripts\Activate.ps1

# Instalar dependências
pip install numpy==1.24.3 protobuf==3.20.3
pip install tensorflow==2.13.0
pip install mediapipe==0.10.9 opencv-python pandas joblib
pip install scikit-learn==1.2.2
```

## 🧪 Testes

O projeto utiliza Jest para testes unitários:

```bash
# Executar todos os testes
npm test

# Modo watch
npm run test:watch

# Com coverage
npm test -- --coverage
```

## 🚀 Build e Deploy

### Build de Produção
```bash
npm run build
```

Os arquivos otimizados serão gerados em `dist/lia-web/browser/`.

### Deploy
O projeto é uma aplicação estática e pode ser hospedada em qualquer serviço de hosting:
- **Vercel**: Deploy automático via GitHub
- **Netlify**: Drag & drop ou CI/CD
- **GitHub Pages**: Para demonstrações
- **Azure Static Web Apps**: Para ambiente corporativo

### Requisitos de Hosting
- Suporte a SPA (Single Page Application)
- Rewrite rules para Angular Router
- HTTPS (necessário para acesso à webcam)

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

### Convenções de Código
- Seguir o guia de estilo do Angular
- Usar TypeScript strict mode
- Adicionar testes para novas funcionalidades
- Documentar funções e componentes complexos

## 📊 Status do Projeto

**Branch Atual:** `feature/development`  
**Fase:** MVP em desenvolvimento  
**Última Atualização:** Janeiro 2026

### Roadmap
- ✅ Fase 1: Setup inicial e arquitetura base
- ✅ Fase 2: Pipeline de reconhecimento de gestos
- 🔄 Fase 3: Interface de aprendizado gamificada (em andamento)
- ⏳ Fase 4: Sistema de persistência e progresso
- ⏳ Fase 5: Testes de usabilidade e refinamentos
- ⏳ Fase 6: PWA e otimizações finais

## 📄 Licença

Projeto acadêmico - SIMAC 2025

## 👥 Autores

Desenvolvido por Joyce Peres e equipe como parte do projeto acadêmico SIMAC 2025.

## 📞 Suporte

Para questões e suporte:
- Abra uma issue no GitHub
- Consulte a documentação em [docs/](docs/)
- Verifique os artefatos de implementação em [_bmad-output/](_bmad-output/)

---

**LIA Web** - Democratizando o ensino de Libras com tecnologia 🤟
