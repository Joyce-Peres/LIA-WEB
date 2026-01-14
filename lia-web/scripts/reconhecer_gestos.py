#!/usr/bin/env python3
"""
Script de Reconhecimento de Gestos para LIA-WEB

Usa o modelo LSTM treinado para reconhecer gestos em tempo real via webcam.
Implementa a mesma lógica usada na aplicação web (buffer, suavização, reset).

Uso:
    python reconhecer_gestos.py [--modelo modelo.h5] [--confianca 0.7]

Controles:
    - ESC: Sair
    - R: Resetar buffer manualmente
    - V: Alternar modo verbose

Requisitos:
    pip install tensorflow opencv-python mediapipe joblib numpy
"""

import argparse
import sys
from pathlib import Path
from collections import deque, defaultdict

import cv2
import numpy as np
import mediapipe as mp
import joblib

# ============================================================================
# CONFIGURAÇÕES
# ============================================================================
SCRIPT_DIR = Path(__file__).parent
PROJECT_ROOT = SCRIPT_DIR.parent

MODEL_DIR = PROJECT_ROOT / 'modelos'
MODEL_PATH = MODEL_DIR / 'modelo_gestos.h5'
LABEL_PATH = MODEL_DIR / 'rotulador_gestos.pkl'

# Parâmetros do pipeline (mesmos usados na web)
SEQUENCE_LENGTH = 30        # Frames no buffer
MIN_CONFIDENCE = 0.7        # Confiança mínima para aceitar predição
RESET_THRESHOLD = 10        # Frames sem mãos para resetar buffer
HISTORY_SIZE = 15           # Tamanho do histórico para suavização

# ============================================================================
# CLASSE PRINCIPAL
# ============================================================================

class GestureRecognizer:
    """
    Reconhecedor de gestos em tempo real usando modelo LSTM.

    Implementa o mesmo pipeline da aplicação web:
    1. Captura landmarks das mãos (MediaPipe)
    2. Buffer circular de 30 frames
    3. Inferência quando buffer cheio
    4. Suavização por votação majoritária
    5. Reset automático quando não detecta mãos
    """

    def __init__(self, model_path: Path, label_path: Path, min_confidence: float = 0.7):
        self.min_confidence = min_confidence
        self.verbose = False

        # Carregar modelo
        print("🔄 Carregando modelo...")
        from tensorflow.keras.models import load_model
        self.model = load_model(model_path)
        print(f"   ✅ Modelo carregado: {model_path.name}")

        # Carregar labels
        self.le = joblib.load(label_path)
        self.classes = list(self.le.classes_)
        print(f"   ✅ Classes: {self.classes}")

        # Inicializar MediaPipe
        self.mp_hands = mp.solutions.hands
        self.hands = self.mp_hands.Hands(
            static_image_mode=False,
            max_num_hands=2,
            min_detection_confidence=0.7,
            min_tracking_confidence=0.5
        )
        self.mp_drawing = mp.solutions.drawing_utils

        # Estado do pipeline
        self.buffer = deque(maxlen=SEQUENCE_LENGTH)
        self.prediction_history = deque(maxlen=HISTORY_SIZE)
        self.frames_sem_maos = 0
        self.ultimo_gesto = None
        self.ultima_confianca = 0.0

    def processar_landmarks(self, results) -> np.ndarray:
        """
        Extrai e padroniza landmarks das mãos.
        Retorna array de 126 valores (21 landmarks × 3 coords × 2 mãos).
        """
        landmarks = []

        if results.multi_hand_landmarks:
            for hand in results.multi_hand_landmarks:
                for lm in hand.landmark:
                    landmarks.append([lm.x, lm.y, lm.z])

        # Padronizar para 2 mãos (42 landmarks)
        landmarks = landmarks[:42]
        while len(landmarks) < 42:
            landmarks.append([0.0, 0.0, 0.0])

        return np.array(landmarks).flatten()

    def reconhecer(self) -> tuple[str | None, float]:
        """
        Executa inferência e retorna (gesto, confiança).
        Usa suavização por votação majoritária.
        """
        if len(self.buffer) < SEQUENCE_LENGTH:
            return None, 0.0

        # Preparar entrada para o modelo
        entrada = np.array(self.buffer).reshape(1, SEQUENCE_LENGTH, 126)

        # Inferência
        predicoes = self.model.predict(entrada, verbose=0)[0]
        classe_idx = np.argmax(predicoes)
        confianca = predicoes[classe_idx]

        if confianca < self.min_confidence:
            return None, confianca

        gesto = self.classes[classe_idx]

        # Adicionar ao histórico para suavização
        self.prediction_history.append(gesto)

        # Votação majoritária
        contagem = defaultdict(int)
        for g in self.prediction_history:
            contagem[g] += 1

        gesto_final = max(contagem.items(), key=lambda x: x[1])[0]

        return gesto_final, confianca

    def processar_frame(self, frame) -> tuple[np.ndarray, str | None, float, bool]:
        """
        Processa um frame e retorna:
        - frame anotado
        - gesto reconhecido (ou None)
        - confiança
        - se houve novo reconhecimento
        """
        frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = self.hands.process(frame_rgb)

        novo_reconhecimento = False
        gesto = None
        confianca = 0.0

        # Verificar detecção de mãos
        if not results.multi_hand_landmarks:
            self.frames_sem_maos += 1

            # Reset se muitos frames sem mãos
            if self.frames_sem_maos > RESET_THRESHOLD and len(self.buffer) > 0:
                self.buffer.clear()
                self.prediction_history.clear()
                if self.verbose:
                    print("   🔄 Buffer resetado (mãos não detectadas)")
        else:
            self.frames_sem_maos = 0

            # Extrair landmarks
            landmarks = self.processar_landmarks(results)
            self.buffer.append(landmarks)

            # Desenhar landmarks
            for hand_landmarks in results.multi_hand_landmarks:
                self.mp_drawing.draw_landmarks(
                    frame,
                    hand_landmarks,
                    self.mp_hands.HAND_CONNECTIONS,
                    self.mp_drawing.DrawingSpec(color=(121, 22, 76), thickness=2, circle_radius=3),
                    self.mp_drawing.DrawingSpec(color=(121, 44, 250), thickness=2, circle_radius=2)
                )

            # Reconhecer quando buffer cheio
            if len(self.buffer) == SEQUENCE_LENGTH:
                gesto, confianca = self.reconhecer()

                if gesto and gesto != self.ultimo_gesto:
                    self.ultimo_gesto = gesto
                    self.ultima_confianca = confianca
                    novo_reconhecimento = True

                    # Limpar buffer após reconhecimento (como no script original)
                    self.buffer.clear()

        return frame, self.ultimo_gesto, self.ultima_confianca, novo_reconhecimento

    def reset(self):
        """Reseta o estado do reconhecedor."""
        self.buffer.clear()
        self.prediction_history.clear()
        self.frames_sem_maos = 0
        self.ultimo_gesto = None
        self.ultima_confianca = 0.0


def desenhar_interface(frame, reconhecedor: GestureRecognizer, gesto_alvo: str | None = None):
    """
    Desenha a interface na tela.
    """
    h, w = frame.shape[:2]

    # Fundo semi-transparente para informações
    overlay = frame.copy()
    cv2.rectangle(overlay, (0, 0), (w, 100), (0, 0, 0), -1)
    cv2.rectangle(overlay, (0, h - 50), (w, h), (0, 0, 0), -1)
    cv2.addWeighted(overlay, 0.6, frame, 0.4, 0, frame)

    # Buffer progress
    buffer_len = len(reconhecedor.buffer)
    progress_text = f"Buffer: {buffer_len}/{SEQUENCE_LENGTH}"
    cv2.putText(frame, progress_text, (10, 30),
                cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)

    # Barra de progresso do buffer
    bar_width = int((buffer_len / SEQUENCE_LENGTH) * 200)
    cv2.rectangle(frame, (150, 15), (350, 35), (100, 100, 100), -1)
    cv2.rectangle(frame, (150, 15), (150 + bar_width, 35), (0, 255, 0), -1)

    # Último gesto reconhecido
    if reconhecedor.ultimo_gesto:
        gesto_text = f"Gesto: {reconhecedor.ultimo_gesto}"
        conf_text = f"({reconhecedor.ultima_confianca:.0%})"

        # Cor baseada em se é o gesto alvo
        if gesto_alvo:
            cor = (0, 255, 0) if reconhecedor.ultimo_gesto.upper() == gesto_alvo.upper() else (0, 0, 255)
        else:
            cor = (0, 255, 0)

        cv2.putText(frame, gesto_text, (10, 70),
                    cv2.FONT_HERSHEY_SIMPLEX, 1.0, cor, 2)
        cv2.putText(frame, conf_text, (200, 70),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.7, (200, 200, 200), 2)

    # Gesto alvo (se definido)
    if gesto_alvo:
        cv2.putText(frame, f"Alvo: {gesto_alvo}", (w - 200, 30),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 0), 2)

    # Instruções
    cv2.putText(frame, "ESC: Sair | R: Reset | V: Verbose | T: Definir alvo",
                (10, h - 15), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (200, 200, 200), 1)

    # Frames sem mãos
    if reconhecedor.frames_sem_maos > 0:
        cor_aviso = (0, 165, 255) if reconhecedor.frames_sem_maos < RESET_THRESHOLD else (0, 0, 255)
        cv2.putText(frame, f"Sem maos: {reconhecedor.frames_sem_maos}/{RESET_THRESHOLD}",
                    (w - 200, 70), cv2.FONT_HERSHEY_SIMPLEX, 0.5, cor_aviso, 1)

    return frame


# ============================================================================
# MAIN
# ============================================================================

def main():
    parser = argparse.ArgumentParser(
        description='Reconhecimento de gestos em tempo real'
    )
    parser.add_argument(
        '--modelo',
        type=str,
        default=str(MODEL_PATH),
        help=f'Caminho para o modelo .h5 (padrão: {MODEL_PATH})'
    )
    parser.add_argument(
        '--labels',
        type=str,
        default=str(LABEL_PATH),
        help=f'Caminho para o rotulador .pkl (padrão: {LABEL_PATH})'
    )
    parser.add_argument(
        '--confianca',
        type=float,
        default=MIN_CONFIDENCE,
        help=f'Confiança mínima (padrão: {MIN_CONFIDENCE})'
    )
    parser.add_argument(
        '--alvo',
        type=str,
        default=None,
        help='Gesto alvo para validação (ex: A, OI, TCHAU)'
    )

    args = parser.parse_args()

    model_path = Path(args.modelo)
    label_path = Path(args.labels)

    # Verificar arquivos
    if not model_path.exists():
        print(f"❌ Modelo não encontrado: {model_path}")
        print("   Execute primeiro: python treinar_modelo.py")
        sys.exit(1)

    if not label_path.exists():
        print(f"❌ Labels não encontrados: {label_path}")
        print("   Execute primeiro: python treinar_modelo.py")
        sys.exit(1)

    print("\n" + "=" * 60)
    print("      🤟 LIA - RECONHECIMENTO DE GESTOS EM TEMPO REAL 🤟")
    print("=" * 60)

    # Inicializar reconhecedor
    recognizer = GestureRecognizer(
        model_path=model_path,
        label_path=label_path,
        min_confidence=args.confianca
    )

    gesto_alvo = args.alvo.upper() if args.alvo else None

    print(f"\n📊 Configurações:")
    print(f"   • Confiança mínima: {args.confianca:.0%}")
    print(f"   • Buffer: {SEQUENCE_LENGTH} frames")
    print(f"   • Reset após: {RESET_THRESHOLD} frames sem mãos")
    if gesto_alvo:
        print(f"   • Gesto alvo: {gesto_alvo}")

    print(f"\n🎮 Controles:")
    print(f"   • ESC: Sair")
    print(f"   • R: Resetar buffer")
    print(f"   • V: Alternar verbose")
    print(f"   • T: Definir gesto alvo")
    print("-" * 60 + "\n")

    # Inicializar câmera
    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        print("❌ Câmera não disponível!")
        sys.exit(1)

    cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
    cap.set(cv2.CAP_PROP_FPS, 30)

    print("✅ Câmera inicializada!")
    print("   Mostre suas mãos para a câmera...\n")

    acertos = 0
    tentativas = 0

    try:
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                continue

            # Espelhar frame
            frame = cv2.flip(frame, 1)

            # Processar
            frame, gesto, confianca, novo = recognizer.processar_frame(frame)

            if novo:
                if gesto_alvo:
                    tentativas += 1
                    correto = gesto.upper() == gesto_alvo
                    if correto:
                        acertos += 1
                        print(f"✅ CORRETO! {gesto} ({confianca:.0%}) - {acertos}/{tentativas}")
                    else:
                        print(f"❌ Errado: {gesto} (esperado: {gesto_alvo}) - {acertos}/{tentativas}")
                else:
                    print(f"🤟 Reconhecido: {gesto} ({confianca:.0%})")

            # Desenhar interface
            frame = desenhar_interface(frame, recognizer, gesto_alvo)

            cv2.imshow("LIA - Reconhecimento de Gestos", frame)

            # Processar teclas
            key = cv2.waitKey(1) & 0xFF

            if key == 27:  # ESC
                break
            elif key == ord('r') or key == ord('R'):
                recognizer.reset()
                print("🔄 Buffer resetado manualmente")
            elif key == ord('v') or key == ord('V'):
                recognizer.verbose = not recognizer.verbose
                print(f"📢 Verbose: {'ON' if recognizer.verbose else 'OFF'}")
            elif key == ord('t') or key == ord('T'):
                # Definir gesto alvo via terminal
                cv2.setWindowProperty("LIA - Reconhecimento de Gestos",
                                     cv2.WND_PROP_TOPMOST, 0)
                novo_alvo = input("🎯 Digite o gesto alvo (ou ENTER para limpar): ").strip().upper()
                gesto_alvo = novo_alvo if novo_alvo else None
                acertos = 0
                tentativas = 0
                if gesto_alvo:
                    print(f"   Novo alvo: {gesto_alvo}")
                else:
                    print("   Alvo removido")

    except KeyboardInterrupt:
        print("\n⚠️ Interrompido pelo usuário")

    finally:
        cap.release()
        cv2.destroyAllWindows()

        print("\n" + "=" * 60)
        print("📊 RESUMO DA SESSÃO:")
        print("=" * 60)
        if gesto_alvo and tentativas > 0:
            taxa = acertos / tentativas * 100
            print(f"   • Gesto alvo: {gesto_alvo}")
            print(f"   • Tentativas: {tentativas}")
            print(f"   • Acertos: {acertos}")
            print(f"   • Taxa de acerto: {taxa:.1f}%")
        else:
            print("   (sem estatísticas de alvo)")
        print("=" * 60 + "\n")


if __name__ == "__main__":
    main()
