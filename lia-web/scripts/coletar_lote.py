#!/usr/bin/env python3
"""
Script de Coleta em Lote para LIA-WEB

Facilita a coleta sistemática de múltiplos gestos com acompanhamento de progresso.
Ideal para completar o dataset de forma organizada.

Uso:
    python coletar_lote.py [--categoria alfabeto|numeros|palavras|todos]

Controles:
    - ESPAÇO: Gravar amostra do gesto atual
    - ENTER: Próximo gesto
    - S: Pular gesto atual
    - ESC: Sair

Requisitos:
    pip install opencv-python mediapipe pandas numpy
"""

import cv2
import mediapipe as mp
import pandas as pd
import numpy as np
from datetime import datetime
from pathlib import Path
from collections import deque
import sys

# ============================================================================
# CONFIGURAÇÕES
# ============================================================================
SCRIPT_DIR = Path(__file__).parent
PROJECT_ROOT = SCRIPT_DIR.parent
DATA_DIR = PROJECT_ROOT / 'dados'
DATA_DIR.mkdir(exist_ok=True)

CSV_PATH = DATA_DIR / 'gestos_libras.csv'
SEQUENCE_LENGTH = 30
MIN_FRAMES = 10

# Metas de coleta
META_MINIMA = 30  # Mínimo aceitável
META_IDEAL = 50   # Ideal para bom treinamento

# Configurações do MediaPipe
mp_hands = mp.solutions.hands
hands = mp_hands.Hands(
    static_image_mode=False,
    max_num_hands=2,
    min_detection_confidence=0.7,
    min_tracking_confidence=0.5
)
mp_drawing = mp.solutions.drawing_utils

# ============================================================================
# CATEGORIAS DE GESTOS
# ============================================================================

CATEGORIAS = {
    'alfabeto': list('ABCDEFGHIJKLMNOPQRSTUVWXYZ'),
    'numeros': ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
    'palavras': [
        'TCHAU', 'OBRIGADA', 'DESCULPA', 'POR FAVOR', 'TUDO BEM',
        'AGORA', 'ONTEM', 'AMANHA',
        'SEGUNDA', 'TERCA', 'QUARTA', 'QUINTA', 'SEXTA', 'SABADO', 'DOMINGO',
        'ANO', 'MES', 'HORAS', 'MINUTOS',
        'ONDE', 'QUANDO', 'POR QUE',
        'PAI', 'ADOCANTE', 'ABAIXO'
    ]
}

CATEGORIAS['todos'] = CATEGORIAS['alfabeto'] + CATEGORIAS['numeros'] + CATEGORIAS['palavras']

# ============================================================================
# FUNÇÕES AUXILIARES (reutilizadas do coletar_gestos.py)
# ============================================================================

def padronizar_frames(frames: np.ndarray) -> np.ndarray:
    if len(frames) > SEQUENCE_LENGTH:
        return frames[:SEQUENCE_LENGTH]
    elif len(frames) < SEQUENCE_LENGTH:
        padding = ((0, SEQUENCE_LENGTH - len(frames)), (0, 0))
        return np.pad(frames, padding, mode='constant', constant_values=0)
    return frames


def extrair_landmarks(results) -> list:
    landmarks = []
    if results.multi_hand_landmarks:
        for hand_landmarks in results.multi_hand_landmarks:
            for lm in hand_landmarks.landmark:
                landmarks.append([lm.x, lm.y, lm.z])

    landmarks = landmarks[:42]
    while len(landmarks) < 42:
        landmarks.append([0.0, 0.0, 0.0])

    return landmarks


def validar_qualidade_frame(results, frame) -> tuple[bool, str]:
    if not results.multi_hand_landmarks:
        return False, "Nenhuma mão detectada"

    for hand_landmarks in results.multi_hand_landmarks:
        xs = [lm.x for lm in hand_landmarks.landmark]
        ys = [lm.y for lm in hand_landmarks.landmark]

        hand_width = max(xs) - min(xs)
        hand_height = max(ys) - min(ys)
        if hand_width < 0.15 or hand_height < 0.15:
            return False, "Mão muito pequena"

        if min(xs) < 0.05 or max(xs) > 0.95:
            return False, "Mão cortada (lados)"
        if min(ys) < 0.05 or max(ys) > 0.95:
            return False, "Mão cortada (cima/baixo)"

    return True, "OK"


def salvar_gesto(nome_gesto: str, frames: np.ndarray) -> None:
    frames_padronizados = padronizar_frames(frames)
    registro = pd.DataFrame({
        'nome': [nome_gesto],
        'frames': [frames_padronizados.tolist()],
        'timestamp': [datetime.now().strftime('%Y-%m-%d %H:%M:%S')]
    })
    registro.to_csv(CSV_PATH, mode='a', header=not CSV_PATH.exists(), index=False)


def desenhar_landmarks(frame, results):
    if results.multi_hand_landmarks:
        for hand_landmarks in results.multi_hand_landmarks:
            mp_drawing.draw_landmarks(
                frame, hand_landmarks, mp_hands.HAND_CONNECTIONS,
                mp_drawing.DrawingSpec(color=(121, 22, 76), thickness=2, circle_radius=3),
                mp_drawing.DrawingSpec(color=(121, 44, 250), thickness=2, circle_radius=2)
            )


def contar_amostras() -> dict:
    if not CSV_PATH.exists():
        return {}
    try:
        df = pd.read_csv(CSV_PATH)
        return df['nome'].value_counts().to_dict()
    except:
        return {}


# ============================================================================
# INTERFACE DE COLETA EM LOTE
# ============================================================================

def desenhar_interface_lote(frame, gesto_atual, buffer, gravando, qualidade_msg,
                            progresso_atual, total_gestos, amostras_gesto):
    """Desenha interface completa para coleta em lote."""
    h, w = frame.shape[:2]

    # Fundo para cabeçalho
    overlay = frame.copy()
    cv2.rectangle(overlay, (0, 0), (w, 120), (0, 0, 0), -1)
    cv2.addWeighted(overlay, 0.6, frame, 0.4, 0, frame)

    # Gesto atual (grande e destacado)
    cv2.putText(frame, f"GESTO: {gesto_atual}", (20, 50),
                cv2.FONT_HERSHEY_SIMPLEX, 1.5, (0, 255, 255), 3)

    # Progresso geral
    cv2.putText(frame, f"Progresso: {progresso_atual}/{total_gestos}", (20, 85),
                cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)

    # Amostras deste gesto
    cor_meta = (0, 255, 0) if amostras_gesto >= META_IDEAL else \
               (0, 165, 255) if amostras_gesto >= META_MINIMA else (0, 0, 255)
    cv2.putText(frame, f"Amostras: {amostras_gesto}/{META_IDEAL}", (20, 110),
                cv2.FONT_HERSHEY_SIMPLEX, 0.6, cor_meta, 2)

    # Barra de progresso das amostras
    barra_w = 300
    barra_x = w - barra_w - 20
    progress_pct = min(1.0, amostras_gesto / META_IDEAL)
    cv2.rectangle(frame, (barra_x, 15), (barra_x + barra_w, 35), (100, 100, 100), -1)
    cv2.rectangle(frame, (barra_x, 15), (barra_x + int(barra_w * progress_pct), 35), cor_meta, -1)

    # Status de gravação
    status_y = 70
    if gravando:
        cv2.putText(frame, "🔴 GRAVANDO", (barra_x, status_y),
                   cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 0, 255), 2)
        # Barra de frames
        frames_pct = len(buffer) / SEQUENCE_LENGTH
        cv2.rectangle(frame, (barra_x, status_y + 10),
                     (barra_x + int(barra_w * frames_pct), status_y + 25),
                     (0, 255, 0), -1)

    # Mensagem de qualidade
    if qualidade_msg and qualidade_msg != "OK":
        cv2.rectangle(frame, (0, h - 60), (w, h - 30), (0, 0, 0), -1)
        cv2.putText(frame, f"⚠️ {qualidade_msg}", (20, h - 38),
                   cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 165, 255), 2)

    # Instruções
    overlay = frame.copy()
    cv2.rectangle(overlay, (0, h - 30), (w, h), (0, 0, 0), -1)
    cv2.addWeighted(overlay, 0.7, frame, 0.3, 0, frame)

    instrucoes = "ESPAÇO: Gravar | ENTER: Próximo | S: Pular | ESC: Sair"
    cv2.putText(frame, instrucoes, (20, h - 8),
                cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)


# ============================================================================
# MAIN - COLETA EM LOTE
# ============================================================================

def main():
    import argparse
    parser = argparse.ArgumentParser(description='Coleta em lote de gestos')
    parser.add_argument('--categoria', type=str, default='alfabeto',
                       choices=['alfabeto', 'numeros', 'palavras', 'todos'],
                       help='Categoria de gestos para coletar')
    parser.add_argument('--meta', type=int, default=META_IDEAL,
                       help=f'Meta de amostras por gesto (padrão: {META_IDEAL})')

    args = parser.parse_args()

    gestos_lista = CATEGORIAS[args.categoria]
    meta = args.meta

    print("\n" + "=" * 60)
    print("        🤟 LIA - COLETA EM LOTE DE GESTOS 🤟")
    print("=" * 60)
    print(f"\n📋 Categoria: {args.categoria}")
    print(f"📝 Total de gestos: {len(gestos_lista)}")
    print(f"🎯 Meta por gesto: {meta} amostras")
    print(f"📁 Salvando em: {CSV_PATH}")

    # Carregar progresso existente
    amostras_existentes = contar_amostras()

    # Filtrar gestos que já atingiram a meta
    gestos_pendentes = [g for g in gestos_lista
                       if amostras_existentes.get(g, 0) < meta]

    if not gestos_pendentes:
        print(f"\n✅ Todos os gestos da categoria '{args.categoria}' já foram coletados!")
        print("💡 Use --categoria para escolher outra categoria")
        sys.exit(0)

    print(f"\n📊 Gestos pendentes: {len(gestos_pendentes)}")
    for gesto in gestos_pendentes[:5]:  # Mostrar apenas primeiros 5
        qtd = amostras_existentes.get(gesto, 0)
        print(f"   • {gesto}: {qtd}/{meta}")
    if len(gestos_pendentes) > 5:
        print(f"   ... e mais {len(gestos_pendentes) - 5} gestos")

    print("\n" + "-" * 60)
    input("Pressione ENTER para iniciar a coleta...")

    # Inicializar câmera
    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        print("❌ ERRO: Câmera não disponível!")
        sys.exit(1)

    cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
    cap.set(cv2.CAP_PROP_FPS, 30)

    # Loop principal
    idx_gesto = 0
    buffer = []
    gravando = False
    qualidade_msg = ""

    try:
        while idx_gesto < len(gestos_pendentes):
            gesto_atual = gestos_pendentes[idx_gesto]
            amostras_gesto = amostras_existentes.get(gesto_atual, 0)

            ret, frame = cap.read()
            if not ret:
                continue

            frame = cv2.flip(frame, 1)
            frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            results = hands.process(frame_rgb)

            # Validar qualidade
            is_valid, qualidade_msg = validar_qualidade_frame(results, frame)

            # Extrair landmarks
            if results.multi_hand_landmarks:
                landmarks = extrair_landmarks(results)
                if gravando and is_valid:
                    buffer.append(np.array(landmarks).flatten())
                desenhar_landmarks(frame, results)

            # Desenhar interface
            desenhar_interface_lote(
                frame, gesto_atual, buffer, gravando, qualidade_msg,
                idx_gesto + 1, len(gestos_pendentes), amostras_gesto
            )

            cv2.imshow("LIA - Coleta em Lote", frame)

            # Processar teclas
            key = cv2.waitKey(1) & 0xFF

            if key == 32:  # ESPAÇO - gravar
                if not gravando:
                    gravando = True
                    buffer = []
                else:
                    if len(buffer) >= MIN_FRAMES:
                        salvar_gesto(gesto_atual, np.array(buffer))
                        amostras_existentes[gesto_atual] = amostras_gesto + 1
                        print(f"✅ {gesto_atual} salvo! ({len(buffer)} frames) - Total: {amostras_gesto + 1}/{meta}")

                        # Se atingiu a meta, próximo gesto automaticamente
                        if amostras_gesto + 1 >= meta:
                            print(f"🎉 Meta atingida para '{gesto_atual}'!")
                            idx_gesto += 1
                    else:
                        print(f"⚠️ Poucos frames: {len(buffer)} < {MIN_FRAMES}")

                    gravando = False
                    buffer = []

            elif key == 13:  # ENTER - próximo gesto
                idx_gesto += 1
                buffer = []
                gravando = False

            elif key == ord('s') or key == ord('S'):  # PULAR
                print(f"⏭️ Pulando '{gesto_atual}' ({amostras_gesto}/{meta})")
                idx_gesto += 1
                buffer = []
                gravando = False

            elif key == 27:  # ESC - sair
                break

            # Auto-salvar se buffer cheio
            if gravando and len(buffer) >= SEQUENCE_LENGTH:
                salvar_gesto(gesto_atual, np.array(buffer))
                amostras_existentes[gesto_atual] = amostras_gesto + 1
                print(f"✅ {gesto_atual} auto-salvo! - Total: {amostras_gesto + 1}/{meta}")

                if amostras_gesto + 1 >= meta:
                    print(f"🎉 Meta atingida para '{gesto_atual}'!")
                    idx_gesto += 1

                gravando = False
                buffer = []

    except KeyboardInterrupt:
        print("\n\n⚠️ Interrompido pelo usuário")

    finally:
        cap.release()
        cv2.destroyAllWindows()

        # Relatório final
        print("\n" + "=" * 60)
        print("📊 RESUMO DA COLETA EM LOTE:")
        print("=" * 60)

        amostras_final = contar_amostras()
        total_amostras = sum(amostras_final.values())

        print(f"\nTotal de amostras no dataset: {total_amostras}")
        print(f"\nGestos da categoria '{args.categoria}':")

        completos = 0
        for gesto in gestos_lista:
            qtd = amostras_final.get(gesto, 0)
            status = "✅" if qtd >= meta else "⚠️" if qtd >= META_MINIMA else "❌"
            print(f"   {status} {gesto}: {qtd}/{meta}")
            if qtd >= meta:
                completos += 1

        print(f"\n📈 Progresso: {completos}/{len(gestos_lista)} gestos completos")
        print(f"📁 Dados em: {CSV_PATH}")
        print("\n💡 Próximos passos:")
        print("   1. python augmentar_dados.py  (recomendado)")
        print("   2. python treinar_modelo.py")
        print("=" * 60 + "\n")


if __name__ == "__main__":
    main()
