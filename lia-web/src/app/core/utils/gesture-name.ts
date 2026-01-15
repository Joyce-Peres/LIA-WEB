const ALIASES: Record<string, string> = {
  // O modelo foi treinado/rotulado como OBRIGADA; o conteúdo do site usa OBRIGADO.
  OBRIGADO: 'OBRIGADA',
};

export function canonicalizeGestureName(name: string | null | undefined): string {
  if (!name) return '';

  let value = name.trim().toUpperCase();

  // Ignorar sufixos de mão (quando existirem em datasets/nomes)
  value = value.replace(/_(DIR|ESQ)\b/g, '');

  // Normalizar hífens diferentes
  value = value.replace(/[–—]/g, '-');

  // Colapsar espaços
  value = value.replace(/\s+/g, ' ');

  // Aplicar aliases ANTES de remover diacríticos
  value = ALIASES[value] ?? value;

  // Remover diacríticos SOMENTE após aliases (para evitar mismatch TERÇA vs TERCA, MÃE vs MAE etc.)
  // IMPORTANTE: Apenas letras que REALMENTE têm acentos são tratadas aqui
  // Exemplos: Á→A, É→E, Í→I, Ó→O, Ú→U, Ã→A, Õ→O, Ç→C
  value = value.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  return value;
}

export function gestureNamesMatch(a: string | null | undefined, b: string | null | undefined): boolean {
  const ca = canonicalizeGestureName(a);
  if (!ca) return false;
  return ca === canonicalizeGestureName(b);
}
