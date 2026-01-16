#!/usr/bin/env python3
"""
Script Simples de Conversão do Modelo para TensorFlow.js
Usa comandos CLI do tensorflowjs_converter
"""

import os
import sys
import json
import subprocess
from pathlib import Path
from datetime import datetime

# Configurações
SCRIPT_DIR = Path(__file__).parent
PROJECT_ROOT = SCRIPT_DIR.parent

MODEL_PATH = PROJECT_ROOT / 'modelos' / 'modelo_gestos.h5'
LABEL_PATH = PROJECT_ROOT / 'modelos' / 'rotulador_gestos.pkl'
OUTPUT_DIR = PROJECT_ROOT / 'src' / 'assets' / 'models'

SEQUENCE_LENGTH = 30
FEATURES = 126
MIN_CONFIDENCE = 0.85
RESET_THRESHOLD = 10

print("="*60)
print("    🔄 LIA - CONVERSÃO SIMPLES PARA WEB 🔄")
print("="*60)
print()

# Verificar arquivos
if not MODEL_PATH.exists():
    print(f"❌ Modelo não encontrado: {MODEL_PATH}")
    print("💡 Execute primeiro: python treinar_modelo.py")
    sys.exit(1)

if not LABEL_PATH.exists():
    print(f"❌ Labels não encontrados: {LABEL_PATH}")
    sys.exit(1)

print("✅ Arquivos encontrados!")
print()

# Criar diretório de saída
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# Converter usando o comando tensorflowjs_converter
print("🔄 Convertendo modelo com tensorflowjs_converter...")
cmd = [
    sys.executable, "-m", "tensorflowjs.converters.convert_h5_to_tfjs",
    str(MODEL_PATH),
    str(OUTPUT_DIR)
]

try:
    result = subprocess.run(cmd, capture_output=True, text=True, check=True)
    print("✅ Modelo convertido com sucesso!")
except subprocess.CalledProcessError as e:
    print(f"❌ Erro na conversão:")
    print(e.stderr)
    sys.exit(1)
except FileNotFoundError:
    print("❌ tensorflowjs não está instalado!")
    print("Execute: pip install tensorflowjs==3.21.0")
    sys.exit(1)

# Carregar classes
print()
print("📋 Carregando classes...")
try:
    import joblib
    le = joblib.load(LABEL_PATH)
    classes = list(le.classes_)
    print(f"   Classes ({len(classes)}): {classes}")
except Exception as e:
    print(f"❌ Erro ao carregar classes: {e}")
    sys.exit(1)

# Criar metadata.json
print()
print("📝 Gerando metadata.json...")

metadata = {
    "modelVersion": datetime.now().strftime("%Y.%m.%d"),
    "status": "ready",
    "note": "Modelo treinado localmente",
    "conversionDate": datetime.now().isoformat(),
    "inputShape": [None, SEQUENCE_LENGTH, FEATURES],
    "outputShape": [None, len(classes)],
    "timesteps": SEQUENCE_LENGTH,
    "features": FEATURES,
    "featureDescription": "21 landmarks × 3 coords (x,y,z) × 2 hands",
    "classes": classes,
    "numClasses": len(classes),
    "minConfidenceThreshold": MIN_CONFIDENCE,
    "bufferSize": SEQUENCE_LENGTH,
    "resetThreshold": RESET_THRESHOLD,
    "conversionPending": False
}

metadata_path = OUTPUT_DIR / 'metadata.json'
with open(metadata_path, 'w', encoding='utf-8') as f:
    json.dump(metadata, f, indent=2, ensure_ascii=False)

print(f"   ✅ Metadata salvo: {metadata_path}")

# Atualizar gesture-labels.ts
print()
print("📝 Atualizando gesture-labels.ts...")
labels_ts_path = PROJECT_ROOT / 'src' / 'app' / 'shared' / 'constants' / 'gesture-labels.ts'

if labels_ts_path.exists():
    classes_export = f"export const GESTURE_LABELS = {json.dumps(classes, indent=2)} as const;\n"
    classes_export += f"\nexport type GestureLabel = typeof GESTURE_LABELS[number];\n"

    try:
        with open(labels_ts_path, 'w', encoding='utf-8') as f:
            f.write(classes_export)
        print(f"   ✅ Atualizado: {labels_ts_path}")
    except Exception as e:
        print(f"   ⚠️  Não foi possível atualizar gesture-labels.ts: {e}")
else:
    print(f"   ⚠️  Arquivo não encontrado: {labels_ts_path}")

print()
print("="*60)
print("✅ CONVERSÃO CONCLUÍDA!")
print("="*60)
print()
print(f"📁 Arquivos gerados em: {OUTPUT_DIR}")
print(f"   • model.json")
print(f"   • group1-shard*.bin")
print(f"   • metadata.json")
print()
print("💡 Próximo passo: Testar a aplicação web")
print("="*60)
