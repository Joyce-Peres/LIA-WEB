# 🤟 Scripts de Machine Learning - LIA-WEB

Este diretório contém os scripts Python para treinar e usar o modelo de reconhecimento de gestos em Libras.

## 📋 Pré-requisitos

```bash
# Criar ambiente virtual (recomendado)
python -m venv .venv
.venv\Scripts\activate  # Windows
# source .venv/bin/activate  # Linux/Mac

# Instalar dependências
pip install -r requirements.txt
```

## 🔄 Fluxo Completo de Treinamento

### 1️⃣ Coletar Dados

```bash
python coletar_gestos.py
```

- Abre a webcam para capturar gestos
- Use **ESPAÇO** para iniciar/parar gravação
- Use **ESC** para cancelar
- Colete pelo menos **15 amostras** de cada gesto

**Controles:**
- Digite o nome do gesto (ex: A, B, OI, TCHAU)
- ESPAÇO: Iniciar/Salvar gravação
- ESC: Cancelar gravação atual
- Digite 'sair' para encerrar

### 2️⃣ Treinar Modelo

```bash
python treinar_modelo.py
```

Opções:
```bash
python treinar_modelo.py --epochs 50        # Mais épocas
python treinar_modelo.py --min-amostras 20  # Exigir mais amostras
python treinar_modelo.py --test-size 0.3    # 30% para teste
```

**Saída:**
- `modelos/modelo_gestos.h5` - Modelo Keras
- `modelos/rotulador_gestos.pkl` - Encoder de classes

### 3️⃣ Testar Reconhecimento

```bash
python reconhecer_gestos.py
```

Opções:
```bash
python reconhecer_gestos.py --confianca 0.8  # Aumentar threshold
python reconhecer_gestos.py --alvo A         # Validar gesto específico
```

**Controles:**
- ESC: Sair
- R: Resetar buffer
- V: Alternar modo verbose
- T: Definir gesto alvo

### 4️⃣ Converter para Web

```bash
python converter_para_web.py
```

**Saída:**
- `src/assets/models/model.json` - Modelo TensorFlow.js
- `src/assets/models/metadata.json` - Metadata atualizado
- `src/app/core/data/gesture-labels.ts` - Labels TypeScript

## 📊 Estrutura de Dados

### Formato de entrada do modelo

```
Input shape: (batch, 30, 126)
              │     │    └── 126 features = 21 landmarks × 3 coords × 2 mãos
              │     └── 30 timesteps (frames)
              └── batch size
```

### Landmarks MediaPipe

Cada mão tem 21 landmarks, cada um com coordenadas (x, y, z):
- 0: Pulso
- 1-4: Polegar
- 5-8: Indicador
- 9-12: Médio
- 13-16: Anelar
- 17-20: Mindinho

## 🎯 Gestos Suportados (exemplo)

O modelo pode ser treinado para reconhecer qualquer gesto. Lista de gestos típicos:

**Alfabeto:** A, B, C, D, E, F, G, H, I, J, K, L, M, N, O, P, Q, R, S, T, U, V, W, X, Y, Z

**Números:** 1, 2, 3, 4, 5, 6, 7, 8, 9, 10

**Saudações:** OI, TCHAU, OBRIGADO, DESCULPA, POR FAVOR, TUDO BEM

**Dias:** SEGUNDA-FEIRA, TERÇA-FEIRA, QUARTA-FEIRA, QUINTA-FEIRA, SEXTA-FEIRA, SABADO, DOMINGO

## 🐛 Solução de Problemas

### Câmera não abre
- Verifique se a webcam está conectada
- Feche outros aplicativos usando a câmera
- Tente `cv2.VideoCapture(1)` se tiver múltiplas câmeras

### Baixa acurácia
- Colete mais amostras (mínimo 15-20 por gesto)
- Varie iluminação e ângulos durante coleta
- Aumente número de épocas de treinamento
- Reduza número de classes (gestos muito similares confundem)

### Erro de memória
- Reduza batch_size no treinamento
- Feche outros programas pesados

## 📁 Estrutura de Diretórios

```
lia-web/
├── scripts/
│   ├── requirements.txt
│   ├── coletar_gestos.py
│   ├── treinar_modelo.py
│   ├── reconhecer_gestos.py
│   └── converter_para_web.py
├── dados/
│   └── gestos_libras.csv
├── modelos/
│   ├── modelo_gestos.h5
│   └── rotulador_gestos.pkl
└── src/assets/models/
    ├── model.json
    ├── group1-shard1of1.bin
    └── metadata.json
```
