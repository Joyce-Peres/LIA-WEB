import joblib
import numpy as np
from sklearn.preprocessing import LabelEncoder

# Carregar o LabelEncoder antigo (ignorando o aviso)
le = joblib.load("modelos/rotulador_gestos.pkl")

# Filtrar classes (removendo "ADOCANTE" e "ABAIXO")
classes_validas = [classe for classe in le.classes_ if classe not in ["ADOCANTE", "ABAIXO"]]

# Criar um NOVO LabelEncoder com as classes atualizadas
le_novo = LabelEncoder()
le_novo.classes_ = np.array(classes_validas)  # Força a atualização

# Salvar o novo rotulador
joblib.dump(le_novo, "modelos/rotulador_gestos_novo.pkl")
print("Novas classes:", list(le_novo.classes_))

#import joblib

## Carregar o arquivo
#le = joblib.load("modelos/rotulador_gestos.pkl")

## Verificar classes (rótulos) armazenados
#print("Classes do modelo:", list(le.classes_)) (retorna as classes treinadas)