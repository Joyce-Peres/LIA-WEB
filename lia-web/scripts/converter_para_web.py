#!/usr/bin/env python3
"""
Script de Conversão do Modelo para TensorFlow.js (LIA-WEB)

Converte o modelo Keras (.h5) treinado para o formato TensorFlow.js
e atualiza o metadata.json usado pela aplicação web.

Uso:
    python converter_para_web.py

Saída:
    - src/assets/models/model.json       : Modelo TensorFlow.js
    - src/assets/models/group1-shard*.bin: Pesos do modelo
    - src/assets/models/metadata.json    : Metadata atualizado

Requisitos:
    pip install tensorflow tensorflowjs joblib
"""

import json
import sys
from pathlib import Path
from datetime import datetime

# ============================================================================
# CONFIGURAÇÕES
# ============================================================================
SCRIPT_DIR = Path(__file__).parent
PROJECT_ROOT = SCRIPT_DIR.parent

# Caminhos de entrada
MODEL_DIR = PROJECT_ROOT / 'modelos'
MODEL_PATH = MODEL_DIR / 'modelo_gestos.h5'
LABEL_PATH = MODEL_DIR / 'rotulador_gestos.pkl'

# Caminhos de saída (assets da aplicação web)
OUTPUT_DIR = PROJECT_ROOT / 'src' / 'assets' / 'models'

# Parâmetros do modelo
SEQUENCE_LENGTH = 30
FEATURES = 126
MIN_CONFIDENCE = 0.85
RESET_THRESHOLD = 10

# ============================================================================
# FUNÇÕES
# ============================================================================

def verificar_arquivos():
    """Verifica se os arquivos necessários existem."""
    erros = []

    if not MODEL_PATH.exists():
        erros.append(f"Modelo não encontrado: {MODEL_PATH}")

    if not LABEL_PATH.exists():
        erros.append(f"Labels não encontrados: {LABEL_PATH}")

    if erros:
        print("❌ ERROS:")
        for erro in erros:
            print(f"   • {erro}")
        print("\n💡 Execute primeiro: python treinar_modelo.py")
        return False

    return True


def carregar_classes():
    """Carrega as classes do rotulador."""
    import joblib
    le = joblib.load(LABEL_PATH)
    return list(le.classes_)


def converter_modelo():
    """Converte o modelo para TensorFlow.js."""
    print("🔄 Carregando dependências...")

    try:
        import tensorflow as tf
        import tensorflowjs as tfjs
    except ImportError:
        print("❌ Dependências não instaladas!")
        print("   Execute: pip install tensorflow tensorflowjs")
        return False

    print(f"   TensorFlow: {tf.__version__}")

    # Criar diretório de saída
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    # Carregar modelo
    print(f"\n📂 Carregando modelo: {MODEL_PATH}")
    model = tf.keras.models.load_model(MODEL_PATH)

    print(f"   Input shape: {model.input_shape}")
    print(f"   Output shape: {model.output_shape}")

    # Carregar classes
    print(f"\n🏷️  Carregando classes...")
    classes = carregar_classes()
    print(f"   Classes ({len(classes)}): {classes}")

    # Converter para TensorFlow.js
    print(f"\n🔄 Convertendo para TensorFlow.js...")
    print(f"   Destino: {OUTPUT_DIR}")

    tfjs.converters.save_keras_model(model, str(OUTPUT_DIR))

    print("   ✅ Modelo convertido!")

    # Criar metadata.json
    print(f"\n📝 Gerando metadata.json...")

    metadata = {
        "modelVersion": datetime.now().strftime("%Y.%m.%d"),
        "status": "ready",
        "note": "Modelo treinado localmente",
        "conversionDate": datetime.now().isoformat(),
        "inputShape": list(model.input_shape),
        "outputShape": list(model.output_shape),
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
    print(f"\n📝 Atualizando gesture-labels.ts...")
    atualizar_gesture_labels(classes)

    return True


def atualizar_gesture_labels(classes: list):
    """Atualiza o arquivo gesture-labels.ts com as novas classes."""
    labels_path = PROJECT_ROOT / 'src' / 'app' / 'core' / 'data' / 'gesture-labels.ts'

    # Formatar lista de classes
    classes_formatted = ',\n  '.join([f"'{c}'" for c in classes])

    content = f'''/**
 * Gesture Labels - Gerado automaticamente
 * Data: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}
 *
 * Total: {len(classes)} classes
 */
export const GESTURE_LABELS = [
  {classes_formatted}
] as const;

export type GestureLabel = typeof GESTURE_LABELS[number];

/**
 * Total number of gesture classes
 */
export const NUM_CLASSES = GESTURE_LABELS.length; // {len(classes)}
'''

    with open(labels_path, 'w', encoding='utf-8') as f:
        f.write(content)

    print(f"   ✅ Labels atualizados: {labels_path}")


# ============================================================================
# MAIN
# ============================================================================

def main():
    print("\n" + "=" * 60)
    print("    🔄 LIA - CONVERSÃO DO MODELO PARA WEB 🔄")
    print("=" * 60 + "\n")

    # Verificar arquivos
    print("📋 Verificando arquivos necessários...")
    if not verificar_arquivos():
        sys.exit(1)
    print("   ✅ Arquivos encontrados!")

    # Converter
    sucesso = converter_modelo()

    if sucesso:
        print("\n" + "=" * 60)
        print("✅ CONVERSÃO CONCLUÍDA!")
        print("=" * 60)
        print(f"\n📁 Arquivos gerados em: {OUTPUT_DIR}")
        print("   • model.json")
        print("   • group1-shard*.bin")
        print("   • metadata.json")
        print(f"\n📝 Labels atualizados em:")
        print("   • src/app/core/data/gesture-labels.ts")
        print("\n💡 Próximo passo:")
        print("   npm start (para testar na aplicação web)")
        print("=" * 60 + "\n")
    else:
        print("\n❌ Conversão falhou!")
        sys.exit(1)


if __name__ == "__main__":
    main()
