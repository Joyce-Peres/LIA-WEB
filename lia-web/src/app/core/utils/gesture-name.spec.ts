import { canonicalizeGestureName, gestureNamesMatch } from './gesture-name';

describe('gesture-name utils', () => {
  test('canonicalize removes diacritics and collapses whitespace', () => {
    expect(canonicalizeGestureName('  Terça-feira  ')).toBe('TERCA-FEIRA');
    expect(canonicalizeGestureName('TUDO   BEM')).toBe('TUDO BEM');
  });

  test('canonicalize strips _DIR/_ESQ suffixes', () => {
    expect(canonicalizeGestureName('A_DIR')).toBe('A');
    expect(canonicalizeGestureName('A_ESQ')).toBe('A');
  });

  test('gestureNamesMatch applies aliases (OBRIGADO vs OBRIGADA)', () => {
    expect(gestureNamesMatch('OBRIGADO', 'OBRIGADA')).toBe(true);
    expect(gestureNamesMatch('Obrigado', 'OBRIGADA')).toBe(true);
  });
});
