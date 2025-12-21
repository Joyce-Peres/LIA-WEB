"""
Script para converter o modelo LSTM Keras (.h5) para TensorFlow.js
Parte da Story 2.1: Conversão do Modelo LSTM para TensorFlow.js
Epic 2: Motor de Reconhecimento de Gestos (Core)

Uso:
    python scripts/convert_model.py
"""

import json
import sys
from pathlib import Path
from datetime import datetime

try:
    import tensorflowjs as tfjs
    from tensorflow.keras.models import load_model
    import joblib
    import numpy as np
except ImportError as e:
    print(f"[ERRO] Dependencia faltando: {e}")
    print("\nInstale as dependencias:")
    print("  pip install tensorflowjs tensorflow joblib")
    sys.exit(1)

# Caminhos
PROJECT_ROOT = Path(__file__).parent.parent
MODEL_H5_PATH = PROJECT_ROOT / "modelos" / "modelo_gestos.h5"
LABEL_ENCODER_PATH = PROJECT_ROOT / "modelos" / "rotulador_gestos.pkl"
OUTPUT_DIR = PROJECT_ROOT / "public" / "models"

def validate_inputs():
    """Valida que os arquivos de entrada existem"""
    if not MODEL_H5_PATH.exists():
        print(f"❌ Modelo não encontrado: {MODEL_H5_PATH}")
        print("\nExecute o treinamento primeiro:")
        print("  python libras_alfabeto_projeto/app/treinamento/treinar_modelo_gestos.py")
        sys.exit(1)
    
    if not LABEL_ENCODER_PATH.exists():
        print(f"❌ Label encoder não encontrado: {LABEL_ENCODER_PATH}")
        print("\nO arquivo rotulador_gestos.pkl deve estar na pasta modelos/")
        sys.exit(1)
    
    print(f"✅ Modelo encontrado: {MODEL_H5_PATH}")
    print(f"✅ Label encoder encontrado: {LABEL_ENCODER_PATH}")

def load_gesture_classes():
    """Carrega as classes de gestos do label encoder"""
    try:
        le = joblib.load(LABEL_ENCODER_PATH)
        classes = le.classes_.tolist()
        print(f"\n📋 Classes carregadas: {len(classes)} gestos")
        print(f"   Primeiros 5: {classes[:5]}")
        return classes
    except Exception as e:
        print(f"❌ Erro ao carregar label encoder: {e}")
        sys.exit(1)

def convert_model():
    """Converte o modelo Keras para TensorFlow.js"""
    try:
        print("\n🔄 Carregando modelo Keras...")
        model = load_model(MODEL_H5_PATH)
        
        # Info do modelo
        print(f"\n📊 Informações do modelo:")
        print(f"   Input shape: {model.input_shape}")
        print(f"   Output shape: {model.output_shape}")
        print(f"   Total params: {model.count_params():,}")
        
        # Cria diretório de saída
        OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
        
        # Conversão
        print(f"\n🔄 Convertendo para TensorFlow.js...")
        print(f"   Destino: {OUTPUT_DIR}")
        
        tfjs.converters.save_keras_model(model, str(OUTPUT_DIR))
        
        print(f"✅ Conversão concluída!")
        
        # Lista arquivos gerados
        generated_files = list(OUTPUT_DIR.glob("*"))
        print(f"\n📦 Arquivos gerados ({len(generated_files)}):")
        for file in sorted(generated_files):
            size_kb = file.stat().st_size / 1024
            print(f"   - {file.name} ({size_kb:.1f} KB)")
        
        return model
        
    except Exception as e:
        print(f"❌ Erro na conversão: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

def create_metadata(classes, model):
    """Cria arquivo metadata.json com informações do modelo"""
    try:
        # Tenta estimar a acurácia (não disponível sem validation set)
        # Para MVP, usamos a acurácia reportada no treinamento
        metadata = {
            "modelVersion": "1.0.0",
            "inputShape": list(model.input_shape),
            "outputShape": list(model.output_shape),
            "timesteps": 30,
            "features": 126,
            "featureDescription": "21 landmarks × 3 coords (x,y,z) × 2 hands",
            "classes": classes,
            "numClasses": len(classes),
            "conversionDate": datetime.now().isoformat(),
            "framework": "TensorFlow.js",
            "sourceFramework": "Keras",
            "accuracy": ">0.93 (from training)",
            "minConfidenceThreshold": 0.7,
            "bufferSize": 30,
            "resetThreshold": 10
        }
        
        metadata_path = OUTPUT_DIR / "metadata.json"
        with open(metadata_path, "w", encoding="utf-8") as f:
            json.dump(metadata, f, indent=2, ensure_ascii=False)
        
        print(f"\n✅ Metadata criado: {metadata_path}")
        print(f"   Classes: {metadata['numClasses']}")
        print(f"   Input shape: {metadata['inputShape']}")
        
    except Exception as e:
        print(f"❌ Erro ao criar metadata: {e}")
        sys.exit(1)

def main():
    print("=" * 60)
    print("  Conversão Modelo LSTM → TensorFlow.js")
    print("  Story 2.1 | Epic 2: Motor de Reconhecimento de Gestos")
    print("=" * 60)
    
    # 1. Validar entradas
    validate_inputs()
    
    # 2. Carregar classes
    classes = load_gesture_classes()
    
    # 3. Converter modelo
    model = convert_model()
    
    # 4. Criar metadata
    create_metadata(classes, model)
    
    print("\n" + "=" * 60)
    print("🎉 Conversão concluída com sucesso!")
    print("=" * 60)
    print(f"\nPróximos passos:")
    print(f"  1. Verifique os arquivos em: {OUTPUT_DIR}")
    print(f"  2. O modelo pode ser carregado no browser com:")
    print(f"     tf.loadLayersModel('/models/model.json')")
    print(f"  3. Continue para Story 2.2 (useCamera hook)")
    print()

if __name__ == "__main__":
    main()

