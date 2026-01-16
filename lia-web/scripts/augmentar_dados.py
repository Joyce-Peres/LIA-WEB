#!/usr/bin/env python3
"""
Script de Data Augmentation para LIA-WEB

Gera variações realistas de sequências de landmarks para aumentar
o dataset de treinamento e melhorar a generalização do modelo.

Uso:
    python augmentar_dados.py [--input gestos_libras.csv] [--augments 5]

Transformações aplicadas:
- Rotação (-15° a +15°)
- Escala (90% a 110%)
- Translação (-10% a +10%)
- Ruído gaussiano (σ = 0.005)
- Espelhamento horizontal (50% chance)

Requisitos:
    pip install pandas numpy
"""

import argparse
import ast
import sys
from pathlib import Path
from datetime import datetime

import numpy as np
import pandas as pd

# ============================================================================
# CONFIGURAÇÕES
# ============================================================================
SCRIPT_DIR = Path(__file__).parent
PROJECT_ROOT = SCRIPT_DIR.parent
DATA_DIR = PROJECT_ROOT / 'dados'

# ============================================================================
# FUNÇÕES DE AUGMENTATION
# ============================================================================

def augment_sequence(landmarks: np.ndarray, seed: int = None) -> np.ndarray:
    """
    Aplica transformações realistas a uma sequência de landmarks.

    Args:
        landmarks: Array de shape (timesteps, 126) ou (timesteps, 42, 3)
        seed: Semente aleatória para reprodutibilidade

    Returns:
        Array augmentado com mesmo shape
    """
    if seed is not None:
        np.random.seed(seed)

    # Garantir shape (timesteps, 42, 3)
    original_shape = landmarks.shape
    if landmarks.ndim == 2:
        landmarks = landmarks.reshape(-1, 42, 3)

    aug = landmarks.copy()
    timesteps = aug.shape[0]

    # 1. ROTAÇÃO (simula diferentes ângulos de câmera)
    angle = np.random.uniform(-15, 15) * np.pi / 180
    cos_a, sin_a = np.cos(angle), np.sin(angle)

    for t in range(timesteps):
        for hand_start in [0, 21]:  # cada mão
            # Calcular centro da mão
            hand_lms = aug[t, hand_start:hand_start+21, :]
            center_x = hand_lms[:, 0].mean()
            center_y = hand_lms[:, 1].mean()

            # Rotacionar em torno do centro
            for i in range(21):
                idx = hand_start + i
                x = aug[t, idx, 0] - center_x
                y = aug[t, idx, 1] - center_y

                aug[t, idx, 0] = x * cos_a - y * sin_a + center_x
                aug[t, idx, 1] = x * sin_a + y * cos_a + center_y

    # 2. ESCALA (simula diferentes distâncias)
    scale = np.random.uniform(0.9, 1.1)

    for t in range(timesteps):
        for hand_start in [0, 21]:
            hand_lms = aug[t, hand_start:hand_start+21, :]
            center_x = hand_lms[:, 0].mean()
            center_y = hand_lms[:, 1].mean()

            # Escalar em relação ao centro
            aug[t, hand_start:hand_start+21, 0] = \
                (aug[t, hand_start:hand_start+21, 0] - center_x) * scale + center_x
            aug[t, hand_start:hand_start+21, 1] = \
                (aug[t, hand_start:hand_start+21, 1] - center_y) * scale + center_y

    # 3. TRANSLAÇÃO (simula posição na tela)
    shift_x = np.random.uniform(-0.1, 0.1)
    shift_y = np.random.uniform(-0.1, 0.1)
    aug[:, :, 0] += shift_x
    aug[:, :, 1] += shift_y

    # 4. RUÍDO GAUSSIANO (simula imprecisão do MediaPipe)
    noise = np.random.normal(0, 0.005, aug.shape)
    aug += noise

    # 5. ESPELHAMENTO HORIZONTAL (50% chance)
    if np.random.rand() > 0.5:
        aug[:, :, 0] = 1 - aug[:, :, 0]
        # Trocar ordem das mãos (esquerda <-> direita)
        aug[:, :21, :], aug[:, 21:, :] = aug[:, 21:, :].copy(), aug[:, :21, :].copy()

    # Garantir que landmarks permanecem no range [0, 1] para x, y
    aug[:, :, 0] = np.clip(aug[:, :, 0], 0, 1)
    aug[:, :, 1] = np.clip(aug[:, :, 1], 0, 1)

    # Retornar no shape original
    if len(original_shape) == 2:
        aug = aug.reshape(timesteps, -1)

    return aug


def augmentar_dataset(
    input_path: Path,
    output_path: Path,
    augments_per_sample: int = 5,
    verbose: bool = True
):
    """
    Lê CSV original e gera versão aumentada com augmentations.

    Args:
        input_path: Caminho para o CSV original
        output_path: Caminho para salvar CSV aumentado
        augments_per_sample: Número de variações por amostra original
        verbose: Se True, mostra progresso
    """
    if not input_path.exists():
        raise FileNotFoundError(f"Arquivo não encontrado: {input_path}")

    print(f"📂 Carregando dados de: {input_path}")
    df = pd.read_csv(input_path)
    print(f"   Total de registros originais: {len(df)}")

    # Converter strings de lista para arrays
    print("🔄 Processando frames...")
    df['frames'] = df['frames'].apply(ast.literal_eval)

    # Lista para armazenar todos os registros (originais + augmentados)
    registros_aumentados = []

    # Estatísticas
    gestos_count = df['nome'].value_counts()

    if verbose:
        print(f"\n📊 Amostras por gesto (original):")
        for gesto, qtd in gestos_count.items():
            print(f"   • {gesto}: {qtd}")

    print(f"\n🔧 Gerando {augments_per_sample} variações por amostra...")

    # Processar cada registro
    for idx, row in df.iterrows():
        # Adicionar original
        registros_aumentados.append({
            'nome': row['nome'],
            'frames': row['frames'],
            'timestamp': row['timestamp']
        })

        # Gerar augmentations
        frames_original = np.array(row['frames'])

        for aug_idx in range(augments_per_sample):
            aug_frames = augment_sequence(frames_original, seed=idx*100 + aug_idx)

            registros_aumentados.append({
                'nome': row['nome'],
                'frames': aug_frames.tolist(),
                'timestamp': f"{row['timestamp']}_aug{aug_idx+1}"
            })

        # Progresso
        if verbose and (idx + 1) % 10 == 0:
            print(f"   Processados: {idx + 1}/{len(df)} registros")

    # Criar DataFrame aumentado
    df_aug = pd.DataFrame(registros_aumentados)

    # Salvar
    print(f"\n💾 Salvando dataset aumentado em: {output_path}")
    df_aug.to_csv(output_path, index=False)

    # Estatísticas finais
    print("\n" + "=" * 60)
    print("✅ AUGMENTATION CONCLUÍDO!")
    print("=" * 60)
    print(f"\n📈 Estatísticas:")
    print(f"   • Registros originais: {len(df)}")
    print(f"   • Registros aumentados: {len(df_aug)}")
    print(f"   • Fator de aumento: {len(df_aug) / len(df):.1f}x")
    print(f"   • Variações por amostra: {augments_per_sample}")

    if verbose:
        gestos_count_aug = df_aug['nome'].value_counts()
        print(f"\n📊 Amostras por gesto (após augmentation):")
        for gesto, qtd in gestos_count_aug.items():
            original = gestos_count.get(gesto, 0)
            print(f"   • {gesto}: {qtd} ({original} → {qtd}, +{qtd-original})")

    print(f"\n💡 Próximo passo: python treinar_modelo.py")
    print("=" * 60 + "\n")


# ============================================================================
# MAIN
# ============================================================================

def main():
    parser = argparse.ArgumentParser(
        description='Aumentar dataset com data augmentation'
    )
    parser.add_argument(
        '--input',
        type=str,
        default=str(DATA_DIR / 'gestos_libras.csv'),
        help='Caminho para o CSV original'
    )
    parser.add_argument(
        '--output',
        type=str,
        default=str(DATA_DIR / 'gestos_libras_augmented.csv'),
        help='Caminho para salvar CSV aumentado'
    )
    parser.add_argument(
        '--augments',
        type=int,
        default=5,
        help='Número de variações por amostra (padrão: 5)'
    )
    parser.add_argument(
        '--quiet',
        action='store_true',
        help='Modo silencioso (menos output)'
    )

    args = parser.parse_args()

    input_path = Path(args.input)
    output_path = Path(args.output)

    try:
        print("\n" + "=" * 60)
        print("        🔧 LIA - DATA AUGMENTATION 🔧")
        print("=" * 60 + "\n")

        augmentar_dataset(
            input_path=input_path,
            output_path=output_path,
            augments_per_sample=args.augments,
            verbose=not args.quiet
        )

    except FileNotFoundError as e:
        print(f"\n❌ ERRO: {e}")
        print("   Execute primeiro: python coletar_gestos.py")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ ERRO durante augmentation: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
