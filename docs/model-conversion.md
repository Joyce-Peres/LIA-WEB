# Conversão de Modelo LSTM para TensorFlow.js

## Contexto
Este documento descreve o processo de conversão do modelo LSTM treinado em Keras (`modelo_gestos.h5`) para o formato TensorFlow.js, permitindo execução 100% no browser.

## Problema de Compatibilidade (Python 3.14)
A versão atual do Python (3.14) é muito nova e incompatível com `tensorflowjs` devido a conflitos com `numpy<1.19` que não compila no Python 3.14+.

## Solução Recomendada

### Opção 1: Ambiente Python 3.9-3.11 (Recomendado)
Se você possui Python 3.9, 3.10 ou 3.11 instalado:

```bash
# Criar ambiente virtual
python3.10 -m venv venv-conversion
source venv-conversion/bin/activate  # Windows: venv-conversion\Scripts\activate

# Instalar dependências
pip install tensorflowjs tensorflow joblib

# Executar conversão
python scripts/convert_model.py
```

### Opção 2: Conversão Manual (Linha de Comando)
```bash
tensorflowjs_converter \
  --input_format=keras \
  modelos/modelo_gestos.h5 \
  public/models
```

### Opção 3: Usar Modelo Mock (Desenvolvimento Inicial)
Para continuar o desenvolvimento sem bloquear nas stories 2.2-2.7, podemos criar um modelo mock que simula a estrutura esperada.

## Estrutura Esperada do Modelo Convertido

```
public/models/
├── model.json          # Arquitetura do modelo + manifest de pesos
├── group1-shard1of1.bin # Tensores de pesos (binário)
└── metadata.json       # Classes de gestos, input shape, etc.
```

### model.json (simplificado)
```json
{
  "format": "layers-model",
  "generatedBy": "TensorFlow.js tfjs-layers v4.x",
  "convertedBy": "TensorFlow.js Converter v4.x",
  "weightsManifest": [...],
  "modelTopology": {
    "keras_version": "2.x",
    "backend": "tensorflow",
    "model_config": {
      "class_name": "Sequential",
      "config": {
        "layers": [
          {
            "class_name": "LSTM",
            "config": {"units": 128, "return_sequences": true}
          },
          ...
        ]
      }
    }
  }
}
```

### metadata.json (custom)
```json
{
  "modelVersion": "1.0.0",
  "inputShape": [1, 30, 126],
  "timesteps": 30,
  "features": 126,
  "classes": ["Letra_A", "Letra_B", ...],
  "numClasses": 30,
  "minConfidenceThreshold": 0.7,
  "bufferSize": 30
}
```

## Próximos Passos para Story 2.1

### Para desenvolvimento local-only (sem modelo real agora)
1. Criar arquivos mock em `public/models` (metadata.json + estrutura básica)
2. Continuar para Stories 2.2-2.7 (useCamera, MediaPipe, buffer, etc.)
3. Integrar modelo real quando ambiente Python compatível estiver disponível

### Para conversão real
1. Instalar Python 3.10 ou usar Docker:
   ```dockerfile
   FROM python:3.10-slim
   RUN pip install tensorflowjs tensorflow joblib
   COPY modelos/ /app/modelos/
   WORKDIR /app
   RUN tensorflowjs_converter --input_format=keras modelos/modelo_gestos.h5 public/models
   ```
2. Executar `scripts/convert_model.py`
3. Verificar arquivos gerados em `public/models`

## Comandos de Verificação

```bash
# Verificar arquivos gerados
ls -lh public/models/

# Verificar tamanho do modelo
du -sh public/models/

# Ver estrutura do model.json
cat public/models/model.json | jq .modelTopology.config.layers
```

## Referências
- [TensorFlow.js Converter](https://www.tensorflow.org/js/tutorials/conversion/import_keras)
- [Keras to TF.js Guide](https://www.tensorflow.org/js/guide/conversion)
- Story: `_bmad-output/implementation-artifacts/2-1-conversao-do-modelo-lstm-para-tensorflow-js.md`

