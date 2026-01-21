# LIA Web — Libras com Inteligência Artificial

Aplicação web (Angular) para ensino/prática de Libras com **reconhecimento de gestos em tempo real** e **processamento local** no navegador.

## Pré-requisitos

- Node.js 20+
- npm 11+
- Webcam e navegador moderno (HTTPS é necessário para acesso à câmera)

## Rodar localmente (Angular)

```bash
git clone https://github.com/Joyce-Peres/LIA-WEB.git
cd LIA-WEB/lia-web
npm install
npm start
```

App: `http://localhost:4200`

## Documentação (fonte da verdade)

- Hub (evita redundância): `docs/index.md`
- Requisitos e critérios: `docs/prd.md`
- Arquitetura e decisões técnicas: `docs/architeture.md`
- Conversão do modelo para web: `docs/model-conversion.md`
- Responsividade/UI: `docs/responsividade.md`

## Estrutura do repositório (alto nível)

```text
/docs           # Documentação canônica do projeto
/lia-web        # Aplicação Angular + scripts de ML
/_bmad-output   # Artefatos gerados por workflows (referência, não “fonte da verdade”)
```

## Scripts úteis

- Frontend:
  - `npm start`
  - `npm test`
  - `npm run build`
- ML (Python): ver `lia-web/scripts/README.md` e `lia-web/SETUP-AMBIENTE.md`

## Licença

Projeto acadêmico — SIMAC 2025.
