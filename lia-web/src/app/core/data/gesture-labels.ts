/**
 * Gesture Labels for LIA-WEB Model
 * Trained on 6 Libras gestures (vowels + consonants)
 * Updated: 2026-01-14
 *
 * Total: 6 classes (A, B, E, I, O, U)
 */
export const GESTURE_LABELS = [
  'A', 'B', 'E', 'I', 'O', 'U'
] as const;

export type GestureLabel = typeof GESTURE_LABELS[number];

/**
 * Total number of gesture classes
 */
export const NUM_CLASSES = GESTURE_LABELS.length; // 61
