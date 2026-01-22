# LIA Web — Libras com Inteligência Artificial

Plataforma web para apoiar o aprendizado de Língua Brasileira de Sinais (Libras) com **reconhecimento de gestos em tempo real**, com processamento **local no navegador**.

## Visão geral

- **Frontend**: Angular + TypeScript (código em `lia-web/`)
- **Reconhecimento de mãos**: MediaPipe Hands
- **Inferência do modelo**: TensorFlow.js (carregado em runtime via CDN)
- **Modo do MVP**: sem backend (dados e sessão no navegador)

## Como rodar localmente

### Pré-requisitos

- Node.js 20+
- npm 11.6.2+
- Webcam funcional
- Navegador moderno

### Passo a passo

1. Clone o repositório e entre no app:

```bash
git clone https://github.com/Joyce-Peres/LIA-WEB.git
cd LIA-WEB/lia-web
```

2. Instale as dependências:

```bash
npm install
```

3. Suba o servidor de desenvolvimento:

```bash
npm start
```

4. Abra a aplicação no navegador:

- `http://localhost:4200`

Se você quer um passo a passo detalhado para Windows (Git, VS Code e troubleshooting), veja o **[Guia para iniciantes](GUIA-INICIANTES.md)**.

## Estrutura do repositório

```
LIA-WEB/
├── lia-web/        # Aplicação Angular (frontend)
├── docs/           # Documentação do produto e decisões técnicas (fonte da verdade)
├── _bmad/          # Workflows e agentes BMAD (inclui o agente tech-writer)
├── _bmad-output/   # Artefatos gerados pelos workflows (registros e históricos)
└── dist/           # Artefatos de build (não editar manualmente)
```

## Documentação (fonte da verdade)

Para evitar duplicação e conteúdo divergente, use este mapa:

- **[Hub da documentação](docs/index.md)**
- **[PRD](docs/prd.md)** (requisitos e critérios)
- **[Arquitetura](docs/architeture.md)** (decisões técnicas e pipeline)
- **[Conversão do modelo](docs/model-conversion.md)** (Keras → TF.js)
- **[Responsividade](docs/responsividade.md)**

## BMAD (BMM) e o agente `tech-writer`

Este repositório inclui o BMAD em `_bmad/` e usa o módulo BMM para **planejamento, documentação e rastreabilidade**.

- **Config do BMM**: `_bmad/bmm/config.yaml` (define idioma e pasta de saída)
- **Saídas/artefatos**: `_bmad-output/`
- **Nota**: alguns arquivos em `_bmad-output/` podem ser históricos; trate `docs/` como fonte da verdade para stack e decisões.

### Como usar o `tech-writer` (Paige)

O agente está em `_bmad/bmm/agents/tech-writer.md`. Em um ambiente/IDE com suporte aos agentes BMAD, você pode usar os comandos do menu do agente, por exemplo:

- `*improve-readme` (revisar e melhorar README)
- `*validate-doc` (validar documento)
- `*generate-mermaid` (gerar diagrama Mermaid)
- `*document-project` (documentar o projeto/brownfield)
- `*dismiss` (encerrar o agente)

## Scripts úteis (Angular)

Execute a partir de `lia-web/`:

- `npm start`
- `npm run build`
- `npm run watch`
- `npm test`
- `npm run test:watch`

## Machine Learning (Python)

Para o setup do ambiente e scripts de coleta/treino/conversão, veja **[Setup do ambiente de ML](lia-web/SETUP-AMBIENTE.md)**.





