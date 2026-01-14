#!/usr/bin/env python3
"""
Script de Coleta de Gestos para LIA-WEB

Captura sequências de landmarks de mãos via webcam para treinar o modelo LSTM.
Os dados são salvos em CSV no formato esperado pelo script de treinamento.

Uso:
    python coletar_gestos.py

Controles:
    - Digite o nome do gesto (ex: A, B, OI, TCHAU)
    - ESPAÇO: Iniciar/Parar gravação
    - ESC: Cancelar gravação atual
    - Digite 'sair' para encerrar

Requisitos:
    pip install opencv-python mediapipe pandas numpy
"""

import cv2
import mediapipe as mp
import pandas as pd
import numpy as np
from datetime import datetime
from pathlib import Path

# ============================================================================
# CONFIGURAÇÕES
# ============================================================================
SCRIPT_DIR = Path(__file__).parent
PROJECT_ROOT = SCRIPT_DIR.parent

# Diretório de dados (relativo ao projeto)
DATA_DIR = PROJECT_ROOT / 'dados'
DATA_DIR.mkdir(exist_ok=True)

CSV_PATH = DATA_DIR / 'gestos_libras.csv'
SEQUENCE_LENGTH = 30  # Número fixo de frames por sequência
MIN_FRAMES = 10       # Mínimo de frames para salvar uma gravação

# Configurações do MediaPipe
DETECTION_CONFIDENCE = 0.7
TRACKING_CONFIDENCE = 0.5
MAX_HANDS = 2

# ============================================================================
# INICIALIZAÇÃO DO MEDIAPIPE
# ============================================================================
mp_hands = mp.solutions.hands
hands = mp_hands.Hands(
    static_image_mode=False,
    max_num_hands=MAX_HANDS,
    min_detection_confidence=DETECTION_CONFIDENCE,
    min_tracking_confidence=TRACKING_CONFIDENCE
)
mp_drawing = mp.solutions.drawing_utils
mp_drawing_styles = mp.solutions.drawing_styles

# ============================================================================
# FUNÇÕES AUXILIARES
# ============================================================================

def padronizar_frames(frames: np.ndarray) -> np.ndarray:
    """
    Garante que a sequência tenha exatamente SEQUENCE_LENGTH frames.

    - Se tiver mais frames: corta os excedentes
    - Se tiver menos frames: preenche com zeros (padding)
    """
    if len(frames) > SEQUENCE_LENGTH:
        return frames[:SEQUENCE_LENGTH]
    elif len(frames) < SEQUENCE_LENGTH:
        padding = ((0, SEQUENCE_LENGTH - len(frames)), (0, 0))
        return np.pad(frames, padding, mode='constant', constant_values=0)
    return frames


def extrair_landmarks(results) -> list:
    """
    Extrai landmarks das mãos detectadas e padroniza para 2 mãos (126 valores).

    Formato: 21 landmarks × 3 coordenadas (x, y, z) × 2 mãos = 126 valores
    """
    landmarks = []

    if results.multi_hand_landmarks:
        for hand_landmarks in results.multi_hand_landmarks:
            for lm in hand_landmarks.landmark:
                landmarks.append([lm.x, lm.y, lm.z])

    # Padroniza para máximo de 2 mãos (42 landmarks = 21 × 2)
    landmarks = landmarks[:42]

    # Preenche com zeros se tiver menos de 2 mãos
    while len(landmarks) < 42:
        landmarks.append([0.0, 0.0, 0.0])

    return landmarks


def salvar_gesto(nome_gesto: str, frames: np.ndarray) -> None:
    """
    Salva a sequência de frames no CSV com formatação consistente.
    """
    frames_padronizados = padronizar_frames(frames)

    registro = pd.DataFrame({
        'nome': [nome_gesto],
        'frames': [frames_padronizados.tolist()],
        'timestamp': [datetime.now().strftime('%Y-%m-%d %H:%M:%S')]
    })

    # Append ao CSV (cria header se arquivo não existir)
    registro.to_csv(
        CSV_PATH,
        mode='a',
        header=not CSV_PATH.exists(),
        index=False
    )


def desenhar_landmarks(frame, results):
    """
    Desenha os landmarks das mãos no frame com estilo personalizado.
    """
    if results.multi_hand_landmarks:
        for hand_landmarks in results.multi_hand_landmarks:
            mp_drawing.draw_landmarks(
                frame,
                hand_landmarks,
                mp_hands.HAND_CONNECTIONS,
                mp_drawing.DrawingSpec(
                    color=(121, 22, 76),   # Roxo (cor primária LIA)
                    thickness=2,
                    circle_radius=3
                ),
                mp_drawing.DrawingSpec(
                    color=(121, 44, 250),  # Roxo claro
                    thickness=2,
                    circle_radius=2
                )
            )


def desenhar_interface(frame, gravando: bool, buffer_len: int, gesto_nome: str):
    """
    Desenha informações na tela (status, contador de frames, etc.)
    """
    h, w = frame.shape[:2]

    # Fundo semi-transparente para texto
    overlay = frame.copy()
    cv2.rectangle(overlay, (0, 0), (w, 80), (0, 0, 0), -1)
    cv2.addWeighted(overlay, 0.5, frame, 0.5, 0, frame)

    # Status de gravação
    status_color = (0, 255, 0) if gravando else (200, 200, 200)
    status_text = "🔴 GRAVANDO" if gravando else "⏸️ Aguardando"
    cv2.putText(frame, status_text, (10, 30),
                cv2.FONT_HERSHEY_SIMPLEX, 0.8, status_color, 2)

    # Contador de frames
    progress = f"Frames: {buffer_len}/{SEQUENCE_LENGTH}"
    cv2.putText(frame, progress, (10, 60),
                cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)

    # Barra de progresso
    bar_width = int((buffer_len / SEQUENCE_LENGTH) * 200)
    cv2.rectangle(frame, (200, 45), (400, 65), (100, 100, 100), -1)
    cv2.rectangle(frame, (200, 45), (200 + bar_width, 65), status_color, -1)

    # Nome do gesto atual
    cv2.putText(frame, f"Gesto: {gesto_nome}", (w - 250, 30),
                cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 0), 2)

    # Instruções
    cv2.putText(frame, "ESPACO: Gravar | ESC: Cancelar", (10, h - 10),
                cv2.FONT_HERSHEY_SIMPLEX, 0.5, (200, 200, 200), 1)


def contar_amostras_existentes() -> dict:
    """
    Conta quantas amostras já existem para cada gesto no CSV.
    """
    if not CSV_PATH.exists():
        return {}

    try:
        df = pd.read_csv(CSV_PATH)
        return df['nome'].value_counts().to_dict()
    except Exception:
        return {}


# ============================================================================
# MAIN
# ============================================================================

def main():
    print("\n" + "=" * 60)
    print("        🤟 LIA - COLETOR DE GESTOS EM LIBRAS 🤟")
    print("=" * 60)
    print(f"\n📁 Dados serão salvos em: {CSV_PATH}")
    print(f"📊 Frames por sequência: {SEQUENCE_LENGTH}")
    print(f"✋ Mínimo de frames para salvar: {MIN_FRAMES}")

    # Mostrar amostras existentes
    amostras = contar_amostras_existentes()
    if amostras:
        print(f"\n📈 Amostras já coletadas:")
        for gesto, qtd in sorted(amostras.items()):
            print(f"   • {gesto}: {qtd} amostras")

    print("\n" + "-" * 60)
    print("INSTRUÇÕES:")
    print("1. Digite o nome do gesto (ex: A, B, OI, TCHAU)")
    print("2. Posicione suas mãos na câmera")
    print("3. Pressione ESPAÇO para iniciar gravação")
    print("4. Faça o gesto mantendo por ~1 segundo")
    print("5. Pressione ESPAÇO novamente para salvar")
    print("6. Digite 'sair' para encerrar")
    print("-" * 60 + "\n")

    # Inicializar câmera
    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        print("❌ ERRO: Câmera não disponível!")
        print("   Verifique se a webcam está conectada e não está sendo usada.")
        return

    # Configurar resolução
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
    cap.set(cv2.CAP_PROP_FPS, 30)

    print("✅ Câmera inicializada com sucesso!\n")

    try:
        while True:
            # Solicitar nome do gesto
            gesto_nome = input("🎯 Nome do gesto (ou 'sair'): ").strip().upper()

            if gesto_nome.lower() == 'sair' or gesto_nome == '':
                break

            # Mostrar quantas amostras já tem deste gesto
            qtd_atual = amostras.get(gesto_nome, 0)
            print(f"   📊 Amostras existentes de '{gesto_nome}': {qtd_atual}")
            print(f"   👀 Mostre as mãos e pressione ESPAÇO para gravar...")

            buffer = []
            gravando = False

            while True:
                ret, frame = cap.read()
                if not ret:
                    continue

                # Espelhar frame (mais intuitivo para o usuário)
                frame = cv2.flip(frame, 1)

                # Processar com MediaPipe
                frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                results = hands.process(frame_rgb)

                # Extrair e armazenar landmarks se estiver gravando
                if results.multi_hand_landmarks:
                    landmarks = extrair_landmarks(results)

                    if gravando:
                        buffer.append(np.array(landmarks).flatten())

                    # Desenhar landmarks
                    desenhar_landmarks(frame, results)

                # Desenhar interface
                desenhar_interface(frame, gravando, len(buffer), gesto_nome)

                # Mostrar frame
                cv2.imshow("LIA - Coletor de Gestos", frame)

                # Processar teclas
                key = cv2.waitKey(1) & 0xFF

                if key == 32:  # ESPAÇO
                    if not gravando:
                        # Iniciar gravação
                        gravando = True
                        buffer = []
                        print("   ▶️  Gravação iniciada! Faça o gesto...")
                    else:
                        # Parar gravação e salvar
                        if len(buffer) >= MIN_FRAMES:
                            salvar_gesto(gesto_nome, np.array(buffer))
                            amostras[gesto_nome] = amostras.get(gesto_nome, 0) + 1
                            print(f"   ✅ '{gesto_nome}' salvo! ({len(buffer)} frames)")
                            print(f"      Total de amostras: {amostras[gesto_nome]}")
                        else:
                            print(f"   ⚠️  Poucos frames ({len(buffer)}). Mínimo: {MIN_FRAMES}")
                        break

                elif key == 27:  # ESC
                    print("   ❌ Gravação cancelada")
                    break

                # Auto-parar se buffer cheio
                if gravando and len(buffer) >= SEQUENCE_LENGTH:
                    salvar_gesto(gesto_nome, np.array(buffer))
                    amostras[gesto_nome] = amostras.get(gesto_nome, 0) + 1
                    print(f"   ✅ '{gesto_nome}' salvo automaticamente! ({len(buffer)} frames)")
                    print(f"      Total de amostras: {amostras[gesto_nome]}")
                    break

            print()  # Linha em branco

    except KeyboardInterrupt:
        print("\n\n⚠️  Interrompido pelo usuário")

    finally:
        cap.release()
        cv2.destroyAllWindows()

        print("\n" + "=" * 60)
        print("📊 RESUMO DA COLETA:")
        print("=" * 60)

        amostras_final = contar_amostras_existentes()
        if amostras_final:
            total = sum(amostras_final.values())
            print(f"Total de amostras: {total}")
            for gesto, qtd in sorted(amostras_final.items()):
                suficiente = "✅" if qtd >= 15 else "⚠️ (mínimo: 15)"
                print(f"   • {gesto}: {qtd} {suficiente}")
        else:
            print("Nenhuma amostra coletada ainda.")

        print(f"\n📁 Dados salvos em: {CSV_PATH}")
        print("💡 Próximo passo: python treinar_modelo.py")
        print("=" * 60 + "\n")


if __name__ == "__main__":
    main()
