#!/usr/bin/env python3
"""
Script de Treinamento do Modelo LSTM para LIA-WEB

Treina uma rede neural LSTM para reconhecimento de gestos em Libras
usando os dados coletados pelo script coletar_gestos.py.

Uso:
    python treinar_modelo.py [--epochs 30] [--min-amostras 15]

Saída:
    - modelos/modelo_gestos.h5       : Modelo Keras treinado
    - modelos/rotulador_gestos.pkl   : LabelEncoder para decodificar classes

Requisitos:
    pip install tensorflow pandas numpy scikit-learn joblib
"""

import argparse
import ast
import sys
from pathlib import Path
from datetime import datetime

import numpy as np
import pandas as pd
import joblib
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split

# ============================================================================
# CONFIGURAÇÕES
# ============================================================================
SCRIPT_DIR = Path(__file__).parent
PROJECT_ROOT = SCRIPT_DIR.parent

DATA_DIR = PROJECT_ROOT / 'dados'
MODEL_DIR = PROJECT_ROOT / 'modelos'
CSV_PATH = DATA_DIR / 'gestos_libras.csv'

SEQUENCE_LENGTH = 30   # Timesteps (frames por sequência)
FEATURES = 126         # 21 landmarks × 3 coords × 2 mãos

# ============================================================================
# FUNÇÕES
# ============================================================================

def carregar_dados(min_amostras: int = 30):
    """
    Carrega e prepara os dados do CSV para treinamento.

    Args:
        min_amostras: Mínimo de amostras por gesto para incluir no treinamento

    Returns:
        X: np.ndarray de shape (n_samples, SEQUENCE_LENGTH, FEATURES)
        y: np.ndarray de labels
    """
    if not CSV_PATH.exists():
        raise FileNotFoundError(
            f"Arquivo de dados não encontrado: {CSV_PATH}\n"
            "Execute primeiro: python coletar_gestos.py"
        )

    print(f"📂 Carregando dados de: {CSV_PATH}")
    df = pd.read_csv(CSV_PATH)

    print(f"   Total de registros: {len(df)}")

    # Converter string de lista para array
    df['frames'] = df['frames'].apply(ast.literal_eval)

    # Contar amostras por gesto
    contagens = df['nome'].value_counts()
    print(f"\n📊 Amostras por gesto:")
    for gesto, qtd in contagens.items():
        status = "✅" if qtd >= min_amostras else f"❌ (< {min_amostras})"
        print(f"   • {gesto}: {qtd} {status}")

    # Filtrar gestos com amostras suficientes
    gestos_validos = contagens[contagens >= min_amostras].index
    df_filtrado = df[df['nome'].isin(gestos_validos)]

    if len(df_filtrado) == 0:
        raise ValueError(
            f"Nenhum gesto com {min_amostras}+ amostras!\n"
            "Colete mais dados: python coletar_gestos.py"
        )

    print(f"\n✅ Gestos válidos para treinamento: {list(gestos_validos)}")
    print(f"   Total de amostras válidas: {len(df_filtrado)}")

    # Preparar arrays
    X = []
    for frames in df_filtrado['frames']:
        arr = np.array(frames)

        # Garantir shape correto (SEQUENCE_LENGTH, FEATURES)
        if arr.ndim == 1:
            # Se for 1D, reshape para 2D
            arr = arr.reshape(-1, FEATURES)

        # Padding se necessário
        if arr.shape[0] < SEQUENCE_LENGTH:
            padding = np.zeros((SEQUENCE_LENGTH - arr.shape[0], FEATURES))
            arr = np.vstack([arr, padding])
        elif arr.shape[0] > SEQUENCE_LENGTH:
            arr = arr[:SEQUENCE_LENGTH]

        X.append(arr)

    X = np.array(X)
    y = df_filtrado['nome'].values

    print(f"\n📐 Shape dos dados:")
    print(f"   X: {X.shape} (amostras, timesteps, features)")
    print(f"   y: {y.shape} (labels)")

    return X, y


def criar_modelo(num_classes: int):
    """
    Cria a arquitetura do modelo LSTM.

    Args:
        num_classes: Número de gestos diferentes

    Returns:
        Modelo Keras compilado
    """
    # Import aqui para evitar erro se TF não instalado
    from tensorflow.keras.models import Sequential
    from tensorflow.keras.layers import LSTM, Dense, Dropout, BatchNormalization
    from tensorflow.keras.optimizers import Adam

    model = Sequential([
        # Primeira camada LSTM
        LSTM(128, input_shape=(SEQUENCE_LENGTH, FEATURES), return_sequences=True),
        BatchNormalization(),
        Dropout(0.3),

        # Segunda camada LSTM
        LSTM(64, return_sequences=False),
        BatchNormalization(),
        Dropout(0.3),

        # Camadas densas
        Dense(64, activation='relu'),
        Dropout(0.2),

        # Camada de saída
        Dense(num_classes, activation='softmax')
    ])

    model.compile(
        optimizer=Adam(learning_rate=0.001),
        loss='sparse_categorical_crossentropy',
        metrics=['accuracy']
    )

    return model


def treinar(epochs: int = 30, min_amostras: int = 15, test_size: float = 0.2):
    """
    Executa o pipeline completo de treinamento.
    """
    print("\n" + "=" * 60)
    print("        🧠 LIA - TREINAMENTO DO MODELO LSTM 🧠")
    print("=" * 60 + "\n")

    # Criar diretório de modelos
    MODEL_DIR.mkdir(exist_ok=True)

    # Carregar dados
    X, y = carregar_dados(min_amostras)

    # Codificar labels
    print("\n🏷️  Codificando labels...")
    le = LabelEncoder()
    y_encoded = le.fit_transform(y)
    num_classes = len(le.classes_)
    print(f"   Classes: {list(le.classes_)}")
    print(f"   Total: {num_classes} gestos")

    # Dividir dados
    print(f"\n📊 Dividindo dados (teste: {test_size*100:.0f}%)...")
    X_train, X_test, y_train, y_test = train_test_split(
        X, y_encoded,
        test_size=test_size,
        random_state=42,
        stratify=y_encoded  # Manter proporção das classes
    )
    print(f"   Treino: {len(X_train)} amostras")
    print(f"   Teste: {len(X_test)} amostras")

    # Criar modelo
    print("\n🏗️  Criando modelo LSTM...")
    model = criar_modelo(num_classes)
    model.summary()

    # Treinar
    print(f"\n🚀 Iniciando treinamento ({epochs} épocas)...")
    print("-" * 60)

    from tensorflow.keras.callbacks import EarlyStopping, ReduceLROnPlateau

    callbacks = [
        EarlyStopping(
            monitor='val_loss',
            patience=5,
            restore_best_weights=True,
            verbose=1
        ),
        ReduceLROnPlateau(
            monitor='val_loss',
            factor=0.5,
            patience=3,
            min_lr=0.0001,
            verbose=1
        )
    ]

    history = model.fit(
        X_train, y_train,
        validation_data=(X_test, y_test),
        epochs=epochs,
        batch_size=32,
        callbacks=callbacks,
        verbose=1
    )

    # Avaliar
    print("\n" + "-" * 60)
    print("📈 AVALIAÇÃO DO MODELO:")
    print("-" * 60)

    loss, accuracy = model.evaluate(X_test, y_test, verbose=0)
    print(f"   Loss: {loss:.4f}")
    print(f"   Acurácia: {accuracy:.2%}")

    # Salvar modelo
    model_path = MODEL_DIR / 'modelo_gestos.h5'
    label_path = MODEL_DIR / 'rotulador_gestos.pkl'

    print(f"\n💾 Salvando modelo...")
    model.save(model_path)
    print(f"   ✅ Modelo: {model_path}")

    joblib.dump(le, label_path)
    print(f"   ✅ Labels: {label_path}")

    # Salvar histórico de treinamento
    history_path = MODEL_DIR / 'historico_treinamento.csv'
    pd.DataFrame(history.history).to_csv(history_path, index=False)
    print(f"   ✅ Histórico: {history_path}")

    # Resumo final
    print("\n" + "=" * 60)
    print("✅ TREINAMENTO CONCLUÍDO!")
    print("=" * 60)
    print(f"\n📊 Resultados:")
    print(f"   • Gestos reconhecíveis: {list(le.classes_)}")
    print(f"   • Acurácia de validação: {accuracy:.2%}")
    print(f"   • Melhor época: {np.argmin(history.history['val_loss']) + 1}")

    print(f"\n📁 Arquivos gerados:")
    print(f"   • {model_path}")
    print(f"   • {label_path}")
    print(f"   • {history_path}")

    print(f"\n💡 Próximos passos:")
    print(f"   1. Testar: python reconhecer_gestos.py")
    print(f"   2. Converter para web: python converter_para_web.py")
    print("=" * 60 + "\n")

    return model, le, history


# ============================================================================
# MAIN
# ============================================================================

def main():
    parser = argparse.ArgumentParser(
        description='Treinar modelo LSTM para reconhecimento de gestos em Libras'
    )
    parser.add_argument(
        '--epochs',
        type=int,
        default=30,
        help='Número de épocas de treinamento (padrão: 30)'
    )
    parser.add_argument(
        '--min-amostras',
        type=int,
        default=30,
        help='Mínimo de amostras por gesto (padrão: 30, recomendado: 50+)'
    )
    parser.add_argument(
        '--test-size',
        type=float,
        default=0.2,
        help='Proporção dos dados para teste (padrão: 0.2)'
    )

    args = parser.parse_args()

    try:
        treinar(
            epochs=args.epochs,
            min_amostras=args.min_amostras,
            test_size=args.test_size
        )
    except FileNotFoundError as e:
        print(f"\n❌ ERRO: {e}")
        sys.exit(1)
    except ValueError as e:
        print(f"\n❌ ERRO: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ ERRO durante o treinamento: {e}")
        print("\nVerifique:")
        print("  • Se coletou dados suficientes (python coletar_gestos.py)")
        print("  • Se o CSV está no formato correto")
        print("  • Se as dependências estão instaladas (pip install -r requirements.txt)")
        sys.exit(1)


if __name__ == "__main__":
    main()
