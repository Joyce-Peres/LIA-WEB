#!/usr/bin/env python3
"""
Script para converter modelo Keras (.h5) para TensorFlow.js

Uso:
    python convert-model.py --input modelo.h5 --output ./models/ --labels gestos.csv
"""

import argparse
import json
import os
import sys
from pathlib import Path

def main():
    parser = argparse.ArgumentParser(description='Converter modelo Keras para TensorFlow.js')
    parser.add_argument('--input', required=True, help='Caminho para o arquivo .h5')
    parser.add_argument('--output', required=True, help='Diretório de saída')
    parser.add_argument('--labels', required=True, help='Caminho para o CSV de labels')

    args = parser.parse_args()

    # Verificar se arquivos existem
    if not os.path.exists(args.input):
        print(f"Erro: Arquivo {args.input} não encontrado", file=sys.stderr)
        sys.exit(1)

    if not os.path.exists(args.labels):
        print(f"Erro: Arquivo {args.labels} não encontrado", file=sys.stderr)
        sys.exit(1)

    # Criar diretório de saída
    Path(args.output).mkdir(parents=True, exist_ok=True)

    print("Carregando dependências...")
    try:
        import tensorflow as tf
        import tensorflowjs as tfjs
        import pandas as pd
    except ImportError as e:
        print(f"Erro: Dependências não instaladas. Execute:", file=sys.stderr)
        print("  pip install tensorflow tensorflowjs pandas", file=sys.stderr)
        sys.exit(1)

    print(f"TensorFlow version: {tf.__version__}")
    print(f"Loading model from: {args.input}")

    # Carregar modelo
    model = tf.keras.models.load_model(args.input)
    print(f"Model loaded successfully!")
    print(f"Input shape: {model.input_shape}")
    print(f"Output shape: {model.output_shape}")

    # Carregar labels
    print(f"Loading labels from: {args.labels}")
    df = pd.read_csv(args.labels)
    classes = sorted(df['Gesto'].unique().tolist())
    print(f"Found {len(classes)} classes: {classes}")

    # Converter para TensorFlow.js
    print(f"Converting to TensorFlow.js format...")
    tfjs.converters.save_keras_model(model, args.output)
    print(f"Model converted and saved to: {args.output}")

    # Criar metadata.json
    metadata = {
        "modelVersion": "1.0.0",
        "status": "converted",
        "conversionDate": pd.Timestamp.now().isoformat(),
        "inputShape": list(model.input_shape),
        "outputShape": list(model.output_shape),
        "timesteps": model.input_shape[1] if len(model.input_shape) > 1 else 30,
        "features": model.input_shape[2] if len(model.input_shape) > 2 else 126,
        "featureDescription": "21 landmarks × 3 coords (x,y,z) × 2 hands",
        "classes": classes,
        "numClasses": len(classes),
        "minConfidenceThreshold": 0.85,
        "bufferSize": 30,
        "resetThreshold": 10,
        "conversionPending": False
    }

    metadata_path = os.path.join(args.output, 'metadata.json')
    with open(metadata_path, 'w', encoding='utf-8') as f:
        json.dump(metadata, f, indent=2, ensure_ascii=False)

    print(f"Metadata saved to: {metadata_path}")
    print("\nConversion complete! ✓")
    print(f"\nFiles generated:")
    print(f"  - {args.output}/model.json")
    print(f"  - {args.output}/group1-shard1of1.bin")
    print(f"  - {args.output}/metadata.json")

if __name__ == '__main__':
    main()
