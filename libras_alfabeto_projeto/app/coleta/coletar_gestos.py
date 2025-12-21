import cv2
import mediapipe as mp
import pandas as pd
import numpy as np
import os
from datetime import datetime
from pathlib import Path

# Configurações
CSV_PATH = Path('dados/gestos_libras.csv')
CSV_PATH.parent.mkdir(exist_ok=True)
SEQUENCE_LENGTH = 30  # Número fixo de frames
MIN_FRAMES = 10       # Mínimo para salvar

# Inicialização do MediaPipe
mp_hands = mp.solutions.hands
hands = mp_hands.Hands(
    static_image_mode=False,
    max_num_hands=2,
    min_detection_confidence=0.7,
    min_tracking_confidence=0.5
)
mp_drawing = mp.solutions.drawing_utils

def padronizar_frames(frames):
    """Garante SEQUENCE_LENGTH frames com preenchimento/corte"""
    if len(frames) > SEQUENCE_LENGTH:
        return frames[:SEQUENCE_LENGTH]
    elif len(frames) < SEQUENCE_LENGTH:
        return np.pad(frames, ((0, SEQUENCE_LENGTH - len(frames)), (0, 0)), 
                      mode='constant')
    return frames

def salvar_gesto(nome_gesto, frames):
    """Salva no CSV com formatação consistente"""
    frames_padrao = padronizar_frames(frames)
    pd.DataFrame({
        'nome': [nome_gesto],
        'frames': [frames_padrao.tolist()],
        'timestamp': [datetime.now().strftime('%Y-%m-%d %H:%M:%S')]
    }).to_csv(
        CSV_PATH,
        mode='a',
        header=not CSV_PATH.exists(),
        index=False
    )

# Captura de vídeo
cap = cv2.VideoCapture(0)
if not cap.isOpened():
    print("❌ Câmera não disponível")
    exit()

print("=== COLETOR DE GESTOS ===")
print("Instruções:\n1. Digite o nome do gesto\n2. Mostre as mãos\n3. Espaço: Gravar\n4. ESC: Cancelar")

while True:
    gesto_nome = input("\nNome do gesto (ou 'sair'): ").strip().upper()
    if gesto_nome.lower() == 'sair':
        break

    buffer = []
    gravando = False
    print(f"Pronto para: {gesto_nome} - Mostre as mãos...")

    while True:
        ret, frame = cap.read()
        if not ret:
            continue

        frame = cv2.flip(frame, 1)
        results = hands.process(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))

        # Detecção e visualização
        if results.multi_hand_landmarks:
            landmarks = []
            for hand_landmarks in results.multi_hand_landmarks:
                mp_drawing.draw_landmarks(
                    frame,
                    hand_landmarks,
                    mp_hands.HAND_CONNECTIONS,
                    mp_drawing.DrawingSpec(color=(121, 22, 76), thickness=2, circle_radius=2),
                    mp_drawing.DrawingSpec(color=(121, 44, 250), thickness=2, circle_radius=2)
                )
                landmarks.extend([[lm.x, lm.y, lm.z] for lm in hand_landmarks.landmark])

            # Padroniza para 2 mãos (126 valores)
            landmarks = landmarks[:42]  # Pega no máximo 2 mãos
            if len(landmarks) < 42:
                landmarks.extend([[0,0,0]] * (42 - len(landmarks)))

            if gravando:
                buffer.append(np.array(landmarks).flatten())

        # Interface
        status = f"{'GRAVANDO' if gravando else 'Aguardando'} | Frames: {len(buffer)}/{SEQUENCE_LENGTH}"
        cv2.putText(frame, status, (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
        cv2.imshow("Coletor de Gestos", frame)

        # Controles
        key = cv2.waitKey(1)
        if key == 32:  # Espaço
            if not gravando:
                gravando = True
                buffer = []
                print("▶️ Gravação iniciada")
            elif len(buffer) >= MIN_FRAMES:
                salvar_gesto(gesto_nome, np.array(buffer))
                print(f"✅ {gesto_nome} salvo ({len(buffer)} frames)")
                break
            else:
                print(f"⚠️ Mínimo {MIN_FRAMES} frames necessários")
                break
        
        elif key == 27:  # ESC
            print("❌ Gravação cancelada")
            break

cap.release()
cv2.destroyAllWindows()
print(f"\nDados salvos em: {CSV_PATH}")