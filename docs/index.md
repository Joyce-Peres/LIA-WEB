---
title: Documentação do Projeto (Fonte da Verdade)
description: Mapa da documentação do LIA Web e onde atualizar cada informação.
author: Joyce
date: 2025-12-21
---

# Documentação do LIA Web

Este arquivo é o **hub** da documentação para evitar duplicações e informação obsoleta.

## Fontes da verdade (atualize aqui primeiro)

- **PRD (requisitos e critérios)**: `docs/prd.md`  
  O que o produto precisa fazer (FRs/NFRs), métricas e critérios de aceitação.
- **Arquitetura (decisões técnicas)**: `docs/architeture.md`  
  Como o sistema será construído (stack, padrões, pipeline de IA, dados, deploy).

## Artefatos gerados pelo BMAD (não duplicar conteúdo aqui)

Estes arquivos são **outputs de workflow**. Use como referência/registro do processo, mas evite “copiar e colar” conteúdo deles para PRD/Arquitetura sem necessidade:

- **Epics e Stories**: `_bmad-output/epics.md`
- **Test design (sistema)**: `_bmad-output/test-design-system.md`
- **Implementation readiness**: `_bmad-output/implementation-readiness-report-*.md`
- **Brainstorming**: `_bmad-output/analysis/brainstorming-session-*.md`
- **Status dos workflows**: `_bmad-output/bmm-workflow-status.yaml`
- **Status da sprint/execução**: `_bmad-output/implementation-artifacts/sprint-status.yaml`

## README (deve ser curto)

O `README.md` deve ficar focado em:

- visão rápida do repositório
- como rodar localmente (setup)
- links para `docs/` e `_bmad-output/` quando precisar de detalhe

## Regras para evitar redundância

- **Não repetir stack + decisões** em três lugares. Se já está em `docs/architeture.md`, no README apenas linke.
- **Não marcar funcionalidades como “✅ concluídas”** se estiverem em épicos futuros.
- Quando uma decisão mudar (ex.: “offline”), **corrija PRD + Arquitetura** e apenas cite o impacto nos artefatos gerados.

## Nota importante (stack atual)
O projeto está sendo desenvolvido em **Angular** (`lia-web/`) e em **modo local** (**sem Supabase**).

Alguns artefatos antigos do `_bmad-output/` podem ter sido gerados quando o projeto ainda estava descrito como React/Vite; trate `docs/prd.md` + `docs/architeture.md` como fonte da verdade.

## Guias de onboarding e setup (evitar duplicação)

- **Guia para iniciantes (Windows / passo a passo)**: `../GUIA-INICIANTES.md`
- **Setup do ambiente Python/ML (Windows)**: `../lia-web/SETUP-AMBIENTE.md`
- **Conversão do modelo para TF.js (fonte da verdade)**: `model-conversion.md`

