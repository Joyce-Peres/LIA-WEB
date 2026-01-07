import numpy as np
from tensorflow.keras.models import load_model
import joblib
from pathlib import Path

def remover_gesto_adocante_simples():
    """Abordagem simplificada para remover o gesto"""
    
    MODEL_PATH = Path('modelos/modelo_gestos.h5')
    LABEL_PATH = Path('modelos/rotulador_gestos.pkl')
    MODELO_SAIDA = Path('modelos/modelo_gestos_sem_gesto.h5')
    ROTULADOR_SAIDA = Path('modelos/rotulador_gestos_sem_gesto.pkl')
    
    try:
        print("Carregando arquivos...")
        model = load_model(MODEL_PATH)
        le = joblib.load(LABEL_PATH)
        
        # Verificar e remover 'Adocante'
        classes_originais = list(le.classes_)
        print(f"Classes originais: {classes_originais}")
        
        if 'ABAIXO' not in classes_originais:
            print("❌ 'gesto' não encontrado")
            return
        
        # Criar novo mapeamento sem 'Adocante'
        indice_adocante = classes_originais.index('ABAIXO')
        classes_novas = [c for c in classes_originais if c != 'ABAIXO']
        
        print(f"Novas classes: {classes_novas}")
        
        # Atualizar LabelEncoder
        le_novo = joblib.load(LABEL_PATH)
        le_novo.classes_ = np.array(classes_novas)
        
        # Para a abordagem simplificada, vamos manter o modelo original
        # mas filtrar as predições durante o uso
        model.save(MODELO_SAIDA)
        joblib.dump(le_novo, ROTULADOR_SAIDA)
        
        print(f"✅ Arquivos salvos sem 'Adocante'")
        print(f"✅ O modelo ainda contém 'Adocante' internamente")
        print(f"✅ Mas o rotulador não o reconhecerá mais")
        
    except Exception as e:
        print(f"❌ Erro: {str(e)}")

if __name__ == "__main__":
    remover_gesto_adocante_simples()