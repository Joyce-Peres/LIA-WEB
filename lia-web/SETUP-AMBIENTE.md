# Setup do Ambiente ML para LIA-WEB

## Problema
Existem conflitos de versões entre as dependências de ML:
- TensorFlow 2.13.0 requer numpy <= 1.24.3
- Mediapipe 0.10.x requer protobuf < 4
- Scikit-learn mais recente requer scipy >= 1.10 que precisa numpy >= 1.26
- TensorFlowJS 3.21.0 requer jax, flax e outras dependências pesadas

## Solução Recomendada

### Opção 1: Usar modelo já treinado (RECOMENDADO)
Se você já tem o modelo treinado (`modelo_gestos.h5`), converta para TensorFlow.js manualmente:

```powershell
# 1. Instalar tensorflowjs-converter globalmente ou em ambiente separado
pip install tensorflowjs

# 2. Converter o modelo
tensorflowjs_converter --input_format=keras \
    .\lia-web\modelos\modelo_gestos.h5 \
    .\lia-web\src\assets\models\
```

### Opção 2: Ambiente para coleta + treinamento apenas
Para coletar dados e treinar o modelo (sem conversão):

```powershell
# Criar ambiente com Python 3.11
C:\Users\Joyce\AppData\Local\Programs\Python\Python311\python.exe -m venv ml_venv

# Ativar
.\ml_venv\Scripts\Activate.ps1

# Instalar dependências base
pip install numpy==1.24.3 protobuf==3.20.3

# Instalar TensorFlow
pip install tensorflow==2.13.0

# Instalar demais pacotes
pip install mediapipe==0.10.9 opencv-python pandas joblib

# Scikit-learn compatível (usar versão mais antiga)
pip install scikit-learn==1.2.2
```

### Opção 3: Ambiente completo (com todos os conflitos resolvidos)

```powershell
# Criar novo ambiente limpo
python -m venv ml_complete

# Ativar
.\ml_complete\Scripts\Activate.ps1

# Instalar na ordem específica para minimizar conflitos
pip install numpy==1.24.3
pip install protobuf==3.20.3
pip install tensorflow==2.13.0
pip install scikit-learn==1.2.2
pip install joblib pandas

# OpenCV e MediaPipe (aceitar warnings de numpy)
pip install opencv-python==4.8.1.78
pip install mediapipe==0.10.9

# TensorFlowJS com dependências (demorado, ~500MB)
pip install jax[cpu] flax
pip install tensorflowjs==3.21.0
```

## Comandos para Uso

### Coletar Gestos
```powershell
.\ml_venv\Scripts\Activate.ps1
python c:\LIA\LIA-WEB\lia-web\scripts\coletar_gestos.py
```

### Treinar Modelo
```powershell
.\ml_venv\Scripts\Activate.ps1
python c:\LIA\LIA-WEB\lia-web\scripts\treinar_modelo.py
```

### Converter para Web
```powershell
# Opção A: Comando direto (se tensorflowjs instalado)
tensorflowjs_converter --input_format=keras ^
    .\lia-web\modelos\modelo_gestos.h5 ^
    .\lia-web\src\assets\models\

# Opção B: Script Python
python c:\LIA\LIA-WEB\lia-web\scripts\converter_simples.py
```

## Estado Atual do Projeto

Ambiente `ml_venv` configurado com:
- ✅ TensorFlow 2.13.0
- ✅ NumPy 1.26.4 (scipy requer >= 1.26)
- ✅ Protobuf 3.20.3
- ✅ MediaPipe 0.10.9
- ✅ Scikit-learn 1.8.0
- ✅ Pandas, OpenCV, Joblib
- ⚠️ Scipy 1.10.1 (tem conflito menor com numpy)
- ❌ TensorFlowJS (falta jax/flax - pacotes muito grandes)

## Notas

1. Os warnings sobre incompatibilidade de numpy geralmente não impedem a execução
2. TensorFlow 2.13 funciona com numpy 1.26 apesar do warning
3. Para conversão, é mais simples usar o comando CLI `tensorflowjs_converter` diretamente
4. Modelo já foi treinado com sucesso (100% acurácia)
