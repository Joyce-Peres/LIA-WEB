# Diretório de Modelos

Este diretório armazena os modelos treinados.

## Arquivos gerados

Após executar `treinar_modelo.py`:

- `modelo_gestos.h5` - Modelo Keras LSTM treinado
- `rotulador_gestos.pkl` - LabelEncoder com as classes de gestos
- `historico_treinamento.csv` - Histórico de loss/accuracy por época

## Fluxo de uso

1. **Coletar dados**: `python coletar_gestos.py`
2. **Treinar modelo**: `python treinar_modelo.py`
3. **Testar reconhecimento**: `python reconhecer_gestos.py`
4. **Converter para web**: `python converter_para_web.py`

## Arquitetura do modelo

```
LSTM(128) → BatchNorm → Dropout(0.3)
    ↓
LSTM(64) → BatchNorm → Dropout(0.3)
    ↓
Dense(64, relu) → Dropout(0.2)
    ↓
Dense(num_classes, softmax)
```

Input shape: `(30, 126)` = 30 frames × 126 features (21 landmarks × 3 coords × 2 mãos)
