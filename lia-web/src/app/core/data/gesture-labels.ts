/**
 * Gesture Labels from the original libras_alfabeto_projeto
 * Extracted from modelos/rotulador_gestos.pkl
 *
 * Total: 61 classes (numbers, letters, and common phrases)
 */
export const GESTURE_LABELS = [
  '1', '10', '2', '3', '4', '5', '6', '7', '8', '9',
  'A', 'ABAIXO', 'ADOCANTE', 'AGORA', 'AMANHA', 'ANO',
  'B', 'C', 'D', 'DESCULPA', 'DOMINGO',
  'E', 'F', 'G', 'H', 'HORAS',
  'I', 'J', 'K', 'L', 'M', 'MES', 'MINUTOS',
  'N', 'O', 'OBRIGADA', 'ONDE', 'ONTEM',
  'P', 'PAI', 'POR FAVOR', 'POR QUE',
  'Q', 'QUANDO', 'QUARTA-FEIRA', 'QUINTA-FEIRA',
  'R', 'S', 'SABADO', 'SEGUNDA-FEIRA', 'SEXTA-FEIRA',
  'T', 'TCHAU', 'TERÇA-FEIRA', 'TUDO BEM',
  'U', 'V', 'W', 'X', 'Y', 'Z'
] as const;

export type GestureLabel = typeof GESTURE_LABELS[number];

/**
 * Total number of gesture classes
 */
export const NUM_CLASSES = GESTURE_LABELS.length; // 61
