// Белые списки имён. Генератор кода берёт текст только отсюда, никогда из исходника.

export type FunctionDef = {
  min: number;
  max: number;
  emit: (args: string[]) => string;
};

export type Scope = {
  // имя в выражении → имя локальной переменной в сгенерированном коде
  variables: ReadonlyMap<string, string>;
  constants: ReadonlyMap<string, number>;
  functions: ReadonlyMap<string, FunctionDef>;
};

const math = (name: string, arity: number): [string, FunctionDef] => [
  name,
  { min: arity, max: arity, emit: args => `Math.${name}(${args.join(', ')})` },
];

const helper = (name: string, arity: number): [string, FunctionDef] => [
  name,
  { min: arity, max: arity, emit: args => `$${name}(${args.join(', ')})` },
];

const variadic = (name: string, min: number, max: number): [string, FunctionDef] => [
  name,
  { min, max, emit: args => `Math.${name}(${args.join(', ')})` },
];

// Вспомогательные функции, которые доступны сгенерированному коду под именем `$name`
export const helpers = `
const $clamp = (x, lo, hi) => Math.min(Math.max(x, lo), hi);
const $mix = (a, b, t) => a + (b - a) * t;
const $fract = (x) => x - Math.floor(x);
const $mod = (x, y) => x - y * Math.floor(x / y);
const $noise = () => Math.random() * 2 - 1;
`.trim();

export const expressionScope: Scope = {
  variables: new Map([
    ['a', 'a'],
    ['b', 'b'],
    ['c', 'c'],
    ['d', 'd'],
    ['t', 't'],
    ['sr', 'sr'],
    ['y1', 'y1'],
  ]),
  constants: new Map([
    ['PI', Math.PI],
    ['E', Math.E],
    ['TAU', Math.PI * 2],
  ]),
  functions: new Map([
    ...[
      'sin', 'cos', 'tan', 'asin', 'acos', 'atan',
      'sinh', 'cosh', 'tanh', 'exp', 'log', 'log2', 'log10',
      'sqrt', 'abs', 'sign', 'floor', 'ceil', 'round', 'trunc',
    ].map(name => math(name, 1)),
    math('atan2', 2),
    math('pow', 2),
    variadic('min', 2, 8),
    variadic('max', 2, 8),
    helper('clamp', 3),
    helper('mix', 3),
    helper('fract', 1),
    helper('mod', 2),
    helper('noise', 0),
  ]),
};

export const arityText = ({ min, max }: FunctionDef) => (
  min === max ? `${min}` : `${min}..${max}`
);
