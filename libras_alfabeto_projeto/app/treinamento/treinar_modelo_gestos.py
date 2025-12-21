import pandas as pd
import numpy as np
from sklearn.preprocessing import LabelEncoder
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense, Dropout
from sklearn.model_selection import train_test_split
import joblib
from pathlib import Path
import ast

# Configurações
CSV_PATH = Path('dados/gestos_libras.csv')
MODEL_DIR = Path('modelos')
MODEL_DIR.mkdir(exist_ok=True)
SEQUENCE_LENGTH = 30
MIN_AMOSTRAS = 15

def carregar_dados():
    """Carrega e valida os dados garantindo shape consistente"""
    df = pd.read_csv(CSV_PATH)
    df['frames'] = df['frames'].apply(ast.literal_eval)
    
    # Filtra gestos com poucas amostras
    contagens = df['nome'].value_counts()
    gestos_validos = contagens[contagens >= MIN_AMOSTRAS].index
    df = df[df['nome'].isin(gestos_validos)]
    
    # Garante shape (30, 126)
    X = []
    for frames in df['frames']:
        arr = np.array(frames)
        if arr.shape != (SEQUENCE_LENGTH, 126):
            arr = np.pad(arr, ((0, SEQUENCE_LENGTH - arr.shape[0]), (0, 0)), 
                        mode='constant')
        X.append(arr)
    
    return np.array(X), df['nome'].values

# Main
print("=== TREINAMENTO DE MODELO ===")
try:
    X, y = carregar_dados()
    
    # Codificação
    le = LabelEncoder()
    y_encoded = le.fit_transform(y)

    # Modelo LSTM
    model = Sequential([
        LSTM(128, input_shape=(SEQUENCE_LENGTH, 126), return_sequences=True),
        Dropout(0.3),
        LSTM(64),
        Dense(64, activation='relu'),
        Dense(len(le.classes_), activation='softmax')
    ])

    model.compile(
        optimizer='adam',
        loss='sparse_categorical_crossentropy',
        metrics=['accuracy']
    )

    # Treinamento
    X_train, X_test, y_train, y_test = train_test_split(X, y_encoded, test_size=0.2)
    history = model.fit(
        X_train, y_train,
        validation_data=(X_test, y_test),
        epochs=30,
        batch_size=32,
        verbose=1
    )

    # Salva modelo
    model.save(MODEL_DIR / 'modelo_gestos.h5')
    joblib.dump(le, MODEL_DIR / 'rotulador_gestos.pkl')

    print(f"\n✅ Treinamento concluído!")
    print(f"Gestos reconhecíveis: {list(le.classes_)}")
    print(f"Acurácia de validação: {history.history['val_accuracy'][-1]:.2%}")

except Exception as e:
    print(f"\n❌ Erro durante o treinamento: {str(e)}")
    print("Verifique:")
    print("- Se coletou dados suficientes (python coletar_gestos.py)")
    print("- Se o CSV está no formato correto")