"""
Script para extrair classes do rotulador (label encoder) sem converter o modelo completo.
Útil para criar metadata.json sem depender de TensorFlow.js converter.
"""

import sys
from pathlib import Path

try:
    import joblib
    import json
except ImportError as e:
    print(f"[ERRO] Dependencia faltando: {e}")
    print("Instale: pip install joblib")
    sys.exit(1)

PROJECT_ROOT = Path(__file__).parent.parent
LABEL_ENCODER_PATH = PROJECT_ROOT / "modelos" / "rotulador_gestos.pkl"
OUTPUT_PATH = PROJECT_ROOT / "public" / "models" / "metadata.json"

def main():
    if not LABEL_ENCODER_PATH.exists():
        print(f"[ERRO] Label encoder nao encontrado: {LABEL_ENCODER_PATH}")
        sys.exit(1)
    
    print(f"[INFO] Carregando label encoder...")
    le = joblib.load(LABEL_ENCODER_PATH)
    classes = le.classes_.tolist()
    
    print(f"[OK] {len(classes)} gestos encontrados")
    print(f"[INFO] Primeiros 10: {classes[:10]}")
    
    # Criar metadata
    metadata = {
        "modelVersion": "1.0.0-mock",
        "status": "mock",
        "note": "Model weights not yet converted. Run conversion with Python 3.10 environment.",
        "inputShape": [1, 30, 126],
        "outputShape": [1, len(classes)],
        "timesteps": 30,
        "features": 126,
        "featureDescription": "21 landmarks × 3 coords (x,y,z) × 2 hands",
        "classes": classes,
        "numClasses": len(classes),
        "minConfidenceThreshold": 0.7,
        "bufferSize": 30,
        "resetThreshold": 10,
        "conversionPending": True
    }
    
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2, ensure_ascii=False)
    
    print(f"[OK] Metadata criado: {OUTPUT_PATH}")
    print(f"[INFO] Proximos passos:")
    print(f"  1. Converter modelo com Python 3.10 (ver docs/model-conversion.md)")
    print(f"  2. Continuar desenvolvimento com modelo mock para Stories 2.2-2.7")

if __name__ == "__main__":
    main()

