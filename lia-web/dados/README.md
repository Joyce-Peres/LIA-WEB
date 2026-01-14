# Diretório de Dados

Este diretório armazena os dados coletados para treinamento do modelo.

## Arquivo principal

- `gestos_libras.csv` - Dados de gestos coletados pelo script `coletar_gestos.py`

## Formato do CSV

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| nome | string | Nome do gesto (ex: A, B, OI, TCHAU) |
| frames | list | Lista de 30 frames, cada um com 126 valores (landmarks) |
| timestamp | datetime | Data/hora da coleta |

## Como coletar dados

```bash
cd lia-web/scripts
python coletar_gestos.py
```

Recomendação: colete pelo menos **15 amostras** de cada gesto para bons resultados.
