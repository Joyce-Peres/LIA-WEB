# Conversão do Modelo TensorFlow para TensorFlow.js

## Status Atual

O modelo Keras (`.h5`) do projeto original está localizado em `modelos/modelo_gestos.h5` e contém **61 classes de gestos Libras**.

As classes foram extraídas do rotulador (`modelos/rotulador_gestos.pkl`) e já estão integradas no código Angular.

## Opções para Conversão

### Opção 1: Usando Python (Recomendado)

**Requisitos:**
- Python 3.8-3.11 (TensorFlow não suporta 3.12+)
- TensorFlow 2.x
- TensorFlowJS Converter

**Passos:**

```bash
# 1. Criar ambiente virtual com Python 3.11
python3.11 -m venv venv-converter
source venv-converter/bin/activate  # Linux/Mac
# ou
.\venv-converter\Scripts\activate  # Windows

# 2. Instalar dependências
pip install tensorflow==2.15.0 tensorflowjs pandas

# 3. Converter o modelo
python lia-web/scripts/convert-model.py \
  --input modelos/modelo_gestos.h5 \
  --output lia-web/src/assets/models/ \
  --labels dados/gestos_libras.csv
```

### Opção 2: Usando Conversor CLI do TensorFlowJS

```bash
# Instalar conversor globalmente
npm install -g @tensorflow/tfjs-node tensorflowjs

# Converter
tensorflowjs_converter \
  --input_format=keras \
  --output_format=tfjs_graph_model \
  modelos/modelo_gestos.h5 \
  lia-web/src/assets/models/
```

### Opção 3: Google Colab (Online, sem instalar nada local)

1. Acesse [Google Colab](https://colab.research.google.com/)
2. Cole e execute:

```python
!pip install tensorflowjs

from google.colab import files
import tensorflowjs as tfjs
import tensorflow as tf

# Upload do arquivo .h5
uploaded = files.upload()  # Selecione modelo_gestos.h5

# Carregar modelo
model = tf.keras.models.load_model('modelo_gestos.h5')

# Converter
tfjs.converters.save_keras_model(model, './converted_model')

# Baixar arquivos convertidos
!zip -r converted_model.zip converted_model
files.download('converted_model.zip')
```

3. Extraia o zip e copie os arquivos para `lia-web/src/assets/models/`

## Arquivos Gerados

Após a conversão, você terá:
- `model.json` - Arquitetura do modelo
- `group1-shard1of1.bin` - Pesos do modelo
- `metadata.json` - Metadados (gerado pelo script Python)

## Modo Mock

Enquanto o modelo não está convertido, o app funciona em **modo mock**:
- Simula predições aleatórias com as 61 classes reais
- Permite testar o fluxo completo da aplicação
- Útil para desenvolvimento e testes de UI

## Classes de Gestos (61 total)

Números: 1, 2, 3, 4, 5, 6, 7, 8, 9, 10
Letras: A-Z
Frases comuns: ABAIXO, ADOCANTE, AGORA, AMANHA, ANO, DESCULPA, DOMINGO, HORAS, MES, MINUTOS, OBRIGADA, ONDE, ONTEM, PAI, POR FAVOR, POR QUE, QUANDO, QUARTA-FEIRA, QUINTA-FEIRA, SABADO, SEGUNDA-FEIRA, SEXTA-FEIRA, TCHAU, TERÇA-FEIRA, TUDO BEM

## Troubleshooting

**Erro: "No matching distribution found for tensorflow"**
- Python 3.12+ não é suportado
- Use Python 3.8-3.11

**Erro: "tensorflowjs_converter not found"**
- Certifique-se que instalou globalmente: `npm install -g tensorflowjs`
- Verifique o PATH: `which tensorflowjs_converter` (Linux/Mac) ou `where tensorflowjs_converter` (Windows)

**Modelo muito grande**
- Use quantização: adicione `--quantize_uint8` ao comando do conversor
