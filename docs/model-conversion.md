---
title: Conversão do modelo Keras (.h5) para TensorFlow.js (Angular)
description: Fonte da verdade para converter o modelo LSTM treinado em Python para ser usado no LIA Web (Angular) via TF.js.
author: Joyce
date: 2026-01-21
---

# Conversão do modelo Keras (.h5) para TensorFlow.js

Este guia descreve como converter o modelo LSTM treinado (`lia-web/modelos/modelo_gestos.h5`) para o formato TensorFlow.js usado pela aplicação Angular.

## Onde ficam os arquivos (fonte da verdade)

- **Modelo Keras (entrada)**: `lia-web/modelos/modelo_gestos.h5`
- **Rotulador de classes (entrada)**: `lia-web/modelos/rotulador_gestos.pkl`
- **Assets gerados para o app (saída)**: `lia-web/src/assets/models/`
  - `model.json`
  - `group1-shard*.bin`
  - `metadata.json`
- **Labels TypeScript (saída)**: `lia-web/src/app/core/data/gesture-labels.ts`

## Requisitos (Python)

- Python **3.8–3.11** (TensorFlow tende a não suportar versões mais novas)
- Dependências: `tensorflow`, `tensorflowjs`, `joblib` (e `pandas` se você usar o script com CSV)

> Se você estiver com conflitos de dependências no Windows, use o guia de ambiente em `lia-web/SETUP-AMBIENTE.md`.

## Opção recomendada: usar o script do projeto (gera assets + labels)

O script `lia-web/scripts/converter_para_web.py`:
- converte o `.h5` para TF.js dentro de `lia-web/src/assets/models/`
- gera/atualiza `metadata.json`
- atualiza `lia-web/src/app/core/data/gesture-labels.ts`

No PowerShell:

```powershell
cd lia-web

# Ative o seu ambiente Python (exemplo: venv versionado no repositório)
.\scripts\ml_venv\Scripts\Activate.ps1

# Rode a conversão
python .\scripts\converter_para_web.py
```

## Opção alternativa: conversão genérica via script com parâmetros

Se você quiser controlar input/output/labels manualmente, use:

```powershell
cd lia-web

.\scripts\ml_venv\Scripts\Activate.ps1

python .\scripts\convert-model.py `
  --input .\modelos\modelo_gestos.h5 `
  --output .\src\assets\models\ `
  --labels .\dados\gestos_libras.csv
```

## Verificação pós-conversão

Confira se existem arquivos em `lia-web/src/assets/models/`:

```powershell
dir .\lia-web\src\assets\models\
```

## Referências

- [TensorFlow.js Converter](https://www.tensorflow.org/js/tutorials/conversion/import_keras)
- Artefato histórico: `_bmad-output/implementation-artifacts/2-1-conversao-do-modelo-lstm-para-tensorflow-js.md`

