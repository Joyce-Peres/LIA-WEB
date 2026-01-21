# Conversão do modelo Keras (.h5) para TensorFlow.js (LIA Web)

Este documento descreve como converter o modelo treinado em Keras (`.h5`) para o formato TensorFlow.js, para execução 100% no navegador.

> **Fonte da verdade**: este guia + os scripts em `lia-web/scripts/`.  
> Se existir outro arquivo semelhante, ele deve apontar para este para evitar duplicação.

## Pré-requisitos

- Modelo treinado em `lia-web/modelos/modelo_gestos.h5`
- Rotulador em `lia-web/modelos/rotulador_gestos.pkl` (classes)
- Python **3.10 ou 3.11** (recomendado). Observação: TensorFlow costuma **não suportar Python 3.12+** em releases estáveis.

## Opção recomendada (mantém o app atualizado)

Use `lia-web/scripts/converter_para_web.py`. Ele:

- converte o `.h5` para `lia-web/src/assets/models/`
- atualiza `lia-web/src/assets/models/metadata.json`
- atualiza `lia-web/src/app/core/data/gesture-labels.ts` com as classes do rotulador

### Passo a passo (Windows / PowerShell)

```powershell
cd lia-web

# (opcional, recomendado) criar ambiente virtual dedicado
python -m venv .venv-conversao
.\.venv-conversao\Scripts\Activate.ps1

# instalar dependências dos scripts
pip install -r scripts/requirements.txt

# converter o modelo e atualizar os arquivos do app
python scripts\converter_para_web.py
```

### Saída gerada

- `lia-web/src/assets/models/model.json`
- `lia-web/src/assets/models/group1-shard*.bin`
- `lia-web/src/assets/models/metadata.json`
- `lia-web/src/app/core/data/gesture-labels.ts`

## Opção alternativa (conversão “genérica”)

Se você quiser converter com argumentos explícitos (sem atualizar automaticamente os labels TypeScript), use `lia-web/scripts/convert-model.py`:

```powershell
cd lia-web
python scripts\convert-model.py `
  --input modelos\modelo_gestos.h5 `
  --output src\assets\models `
  --labels dados\gestos_libras.csv
```

## Solução de problemas

- **Erro de import / módulos não encontrados**: confirme que você ativou o venv e rodou `pip install -r scripts/requirements.txt`.
- **Erro de versão do Python**: use Python 3.10/3.11 para os scripts de conversão.
- **Arquivos de modelo/labels não encontrados**: rode o treino primeiro (ver `lia-web/scripts/README.md`).

## Referências

- [TensorFlow.js Converter](https://www.tensorflow.org/js/tutorials/conversion/import_keras)
- [Keras to TF.js](https://www.tensorflow.org/js/guide/conversion)
- Artefato: `_bmad-output/implementation-artifacts/2-1-conversao-do-modelo-lstm-para-tensorflow-js.md`
