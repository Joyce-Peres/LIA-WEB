import cv2
import numpy as np
from tensorflow.keras.models import load_model
import joblib
from collections import deque, defaultdict
import mediapipe as mp
from pathlib import Path

# Configurações
MODEL_PATH = Path('modelos/modelo_gestos.h5')
LABEL_PATH = Path('modelos/rotulador_gestos.pkl')
SEQUENCE_LENGTH = 30
MIN_CONFIDENCE = 0.7
RESET_THRESHOLD = 10  # Frames sem mãos para resetar

# Inicialização
model = load_model(MODEL_PATH)
le = joblib.load(LABEL_PATH)
mp_hands = mp.solutions.hands
hands = mp_hands.Hands(
    static_image_mode=False,
    max_num_hands=2,
    min_detection_confidence=0.7,
    min_tracking_confidence=0.5
)

# Variáveis de estado
buffer = deque(maxlen=SEQUENCE_LENGTH)
frames_sem_maos = 0
historico_predicoes = deque(maxlen=15)  # Suavização
ultimo_gesto = None

cap = cv2.VideoCapture(0)

def processar_landmarks(results):
    """Processa landmarks e retorna array padronizado"""
    landmarks = []
    if results.multi_hand_landmarks:
        for hand in results.multi_hand_landmarks:
            landmarks.extend([[lm.x, lm.y, lm.z] for lm in hand.landmark])
    
    # Padroniza para 2 mãos (42 landmarks)
    landmarks = landmarks[:42]
    if len(landmarks) < 42:
        landmarks.extend([[0,0,0]] * (42 - len(landmarks)))
    
    return np.array(landmarks).flatten()

print("\n=== RECONHECIMENTO DE GESTOS ===")
print(f"Gestos carregados: {', '.join(le.classes_)}")
print("Pressione ESC para sair\n")

while cap.isOpened():
    ret, frame = cap.read()
    if not ret:
        continue

    frame = cv2.flip(frame, 1)
    results = hands.process(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))

    # Reset se não detectar mãos por muitos frames
    if not results.multi_hand_landmarks:
        frames_sem_maos += 1
        if frames_sem_maos > RESET_THRESHOLD and buffer:
            buffer.clear()
            print("▶️ Buffer resetado (mãos não detectadas)")
    else:
        frames_sem_maos = 0
        landmarks = processar_landmarks(results)
        buffer.append(landmarks)

        # Desenha landmarks
        for hand_landmarks in results.multi_hand_landmarks:
            mp.solutions.drawing_utils.draw_landmarks(
                frame, hand_landmarks, mp_hands.HAND_CONNECTIONS,
                mp.solutions.drawing_utils.DrawingSpec(color=(121, 22, 76), thickness=2, circle_radius=2),
                mp.solutions.drawing_utils.DrawingSpec(color=(121, 44, 250), thickness=2, circle_radius=2)
            )

    # Reconhecimento quando buffer cheio
    if len(buffer) == SEQUENCE_LENGTH:
        entrada = np.array(buffer).reshape(1, SEQUENCE_LENGTH, 126)
        preds = model.predict(entrada, verbose=0)[0]
        classe_idx = np.argmax(preds)
        confianca = preds[classe_idx]

        if confianca >= MIN_CONFIDENCE:
            gesto_atual = le.classes_[classe_idx]
            historico_predicoes.append(gesto_atual)

            # Suavização por votação majoritária
            contagem = defaultdict(int)
            for g in historico_predicoes:
                contagem[g] += 1
            gesto_final = max(contagem.items(), key=lambda x: x[1])[0]

            # Só atualiza se for um gesto novo
            if gesto_final != ultimo_gesto:
                ultimo_gesto = gesto_final
                print(f"Gesto reconhecido: {gesto_final} ({confianca:.0%})")
                buffer.clear()  # Reset após reconhecimento

    # Exibe informações
    cv2.putText(frame, f"Buffer: {len(buffer)}/{SEQUENCE_LENGTH}", (10, 30), 
               cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
    if ultimo_gesto:
        cv2.putText(frame, f"Ultimo: {ultimo_gesto}", (10, 60), 
                   cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)

    cv2.imshow("Reconhecimento de Gestos", frame)
    if cv2.waitKey(1) == 27:
        break

cap.release()
cv2.destroyAllWindows()