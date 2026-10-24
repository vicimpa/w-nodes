export type TConstant = {
  id: string;
  symbol: string;
  label: string;
  group: 'Math' | 'Audio' | 'Custom';
  value(sampleRate: number): number;
  // Выражение для скомпилированного блока: только Math.* и sr (частота дискретизации в worklet)
  code: string;
};

// Константы ноды Constant. id сохраняется в проект — не переименовывать.
export const constants: TConstant[] = [
  { id: 'PI', symbol: 'π', label: 'Pi', group: 'Math', value: () => Math.PI, code: 'Math.PI' },
  { id: 'TAU', symbol: 'τ', label: 'Tau (2π)', group: 'Math', value: () => Math.PI * 2, code: '(2 * Math.PI)' },
  { id: 'HALF_PI', symbol: 'π/2', label: 'Half pi', group: 'Math', value: () => Math.PI / 2, code: '(Math.PI / 2)' },
  { id: 'E', symbol: 'e', label: 'Euler number', group: 'Math', value: () => Math.E, code: 'Math.E' },
  { id: 'PHI', symbol: 'φ', label: 'Golden ratio', group: 'Math', value: () => (1 + Math.sqrt(5)) / 2, code: '((1 + Math.sqrt(5)) / 2)' },
  { id: 'SQRT2', symbol: '√2', label: 'Square root of 2', group: 'Math', value: () => Math.SQRT2, code: 'Math.SQRT2' },
  { id: 'SQRT1_2', symbol: '√½', label: 'Square root of 1/2', group: 'Math', value: () => Math.SQRT1_2, code: 'Math.SQRT1_2' },
  { id: 'LN2', symbol: 'ln 2', label: 'Natural log of 2', group: 'Math', value: () => Math.LN2, code: 'Math.LN2' },
  { id: 'LN10', symbol: 'ln 10', label: 'Natural log of 10', group: 'Math', value: () => Math.LN10, code: 'Math.LN10' },
  { id: 'SAMPLE_RATE', symbol: 'sr', label: 'Sample rate', group: 'Audio', value: sr => sr, code: 'sr' },
  { id: 'NYQUIST', symbol: 'sr/2', label: 'Nyquist frequency', group: 'Audio', value: sr => sr / 2, code: '(sr / 2)' },
  { id: 'A4', symbol: 'A4', label: 'A4 pitch, 440 Hz', group: 'Audio', value: () => 440, code: '440' },
  { id: 'SEMITONE', symbol: '¹²√2', label: 'Semitone ratio', group: 'Audio', value: () => 2 ** (1 / 12), code: '(2 ** (1 / 12))' },
];

export const NUMBER = 'NUMBER';

export const findConstant = (id: unknown) => constants.find(item => item.id === id);

// Значение константы или своего числа (id = NUMBER); null — неизвестная константа или не число
export function constantValue(id: unknown, number: unknown, sampleRate: number) {
  if (id === NUMBER)
    return typeof number === 'number' && Number.isFinite(number) ? number : null;

  return findConstant(id)?.value(sampleRate) ?? null;
}

// Выражение для сгенерированного кода; своё число проверено на конечность, поэтому String() безопасен
export function constantCode(id: unknown, number: unknown) {
  if (id === NUMBER)
    return typeof number === 'number' && Number.isFinite(number) ? `(${String(number)})` : null;

  return findConstant(id)?.code ?? null;
}
