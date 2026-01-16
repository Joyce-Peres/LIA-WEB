#!/usr/bin/env python3
"""
Conversão Manual do Modelo para TensorFlow.js
Converte o modelo H5 para o formato TensorFlow SavedModel e então para TFJS
"""

import json
import sys
from pathlib import Path
from datetime import datetime

# Configurações
SCRIPT_DIR = Path(__file__).parent
PROJECT_ROOT = SCRIPT_DIR.parent

MODEL_PATH = PROJECT_ROOT / 'modelos' / 'modelo_gestos.h5'
LABEL_PATH = PROJECT_ROOT / 'modelos' / 'rotulador_gestos.pkl'
TEMP_DIR = PROJECT_ROOT / 'modelos' / 'temp_saved_model'
OUTPUT_DIR = PROJECT_ROOT / 'src' / 'assets' / 'models'

SEQUENCE_LENGTH = 30
FEATURES = 126
MIN_CONFIDENCE = 0.85
RESET_THRESHOLD = 10

print("="*60)
print("    🔄 LIA - CONVERSÃO MANUAL PARA WEB 🔄")
print("="*60)
print()

# Verificar arquivos
if not MODEL_PATH.exists():
    print(f"❌ Modelo não encontrado: {MODEL_PATH}")
    sys.exit(1)

if not LABEL_PATH.exists():
    print(f"❌ Labels não encontrados: {LABEL_PATH}")
    sys.exit(1)

print("✅ Arquivos encontrados!")
print()

# Carregar TensorFlow
print("📦 Carregando TensorFlow...")
try:
    import tensorflow as tf
    print(f"   TensorFlow: {tf.__version__}")
except ImportError:
    print("❌ TensorFlow não está instalado!")
    sys.exit(1)

# Carregar modelo
print()
print("📂 Carregando modelo Keras...")
try:
    model = tf.keras.models.load_model(MODEL_PATH)
    print(f"   Input shape: {model.input_shape}")
    print(f"   Output shape: {model.output_shape}")
except Exception as e:
    print(f"❌ Erro ao carregar modelo: {e}")
    sys.exit(1)

# Salvar como SavedModel
print()
print("💾 Salvando como TensorFlow SavedModel...")
TEMP_DIR.mkdir(parents=True, exist_ok=True)
try:
    tf.saved_model.save(model, str(TEMP_DIR))
    print(f"   ✅ SavedModel criado: {TEMP_DIR}")
except Exception as e:
    print(f"❌ Erro ao salvar SavedModel: {e}")
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
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

metadata = {
    "modelVersion": datetime.now().strftime("%Y.%m.%d"),
    "status": "pending",
    "note": "Modelo treinado localmente - conversão manual pendente",
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
    "conversionPending": True,
    "savedModelPath": str(TEMP_DIR),
    "instructions": "Use: tensorflowjs_converter --input_format=tf_saved_model temp_saved_model/ src/assets/models/"
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
print("✅ PREPARAÇÃO CONCLUÍDA!")
print("="*60)
print()
print("📁 SavedModel criado em:")
print(f"   {TEMP_DIR}")
print()
print("⚠️  PRÓXIMO PASSO MANUAL:")
print("   Para completar a conversão, instale tensorflowjs em um")
print("   ambiente Python separado e execute:")
print()
print("   pip install tensorflowjs")
print()
print("   tensorflowjs_converter \\")
print(f"       --input_format=tf_saved_model \\")
print(f"       {TEMP_DIR} \\")
print(f"       {OUTPUT_DIR}")
print()
print("="*60)
