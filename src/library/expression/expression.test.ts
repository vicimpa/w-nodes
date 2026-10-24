import { MAX_LENGTH, PROCESSOR_INPUTS, STOP_MESSAGE, compile, expressionScope, processorSource } from ".";
import { describe, expect, it } from "vitest";

type Env = { a: number; b: number; c: number; d: number; t: number; sr: number; y1: number; };
type Kernel = (a: number, b: number, c: number, d: number, t: number, sr: number, y1: number) => number;

// Глобальные объекты, которые сгенерированный код видеть не должен
const hidden = ['globalThis', 'window', 'self', 'global', 'process', 'eval', 'Function', 'require', 'fetch'];

// new Function — только в тестах: проверяем, что сгенерированный код считает то же, что и JS
const run = <T,>(source: string, names: string[] = [], values: unknown[] = []): T => (
  new Function(...hidden, ...names, `return ${source};`)(
    ...hidden.map(() => undefined), ...values
  )
);

const kernelOf = (src: string): Kernel => {
  const result = compile(src);
  if (!result.ok) throw new Error(`${src}: ${result.error}`);
  return run<Kernel>(result.kernel);
};

const call = (kernel: Kernel, { a, b, c, d, t, sr, y1 }: Env) => kernel(a, b, c, d, t, sr, y1);

const envs: Env[] = [
  { a: 0.3, b: -1.7, c: 2, d: 0, t: 0.25, sr: 48000, y1: 0.1 },
  { a: 0, b: 0, c: 0, d: 0, t: 0, sr: 44100, y1: 0 },
  { a: 440, b: 0.5, c: -3, d: 7.25, t: 1.5, sr: 48000, y1: -0.9 },
  { a: -2, b: 3, c: 0.5, d: -0.125, t: 10, sr: 96000, y1: 1 },
];

const { PI, E } = Math;
const TAU = PI * 2;
const mod = (x: number, y: number) => x - y * Math.floor(x / y);

const valid: [string, (env: Env) => number][] = [
  ['1 + 2 * 3', () => 1 + 2 * 3],
  ['(1 + 2) * 3', () => (1 + 2) * 3],
  ['a - b - c', ({ a, b, c }) => a - b - c],
  ['a / b / 4', ({ a, b }) => a / b / 4],
  ['a % 2', ({ a }) => a % 2],
  ['2 ** 3 ** 2', () => 2 ** (3 ** 2)],
  ['-2 ** 2', () => -(2 ** 2)],
  ['2 ** -1', () => 2 ** -1],
  ['-a * b', ({ a, b }) => -a * b],
  ['- -a', ({ a }) => -(-a)],
  ['!a', ({ a }) => +!a],
  ['!0 + !1', () => 1],
  ['a < b', ({ a, b }) => +(a < b)],
  ['a <= b', ({ a, b }) => +(a <= b)],
  ['a > b', ({ a, b }) => +(a > b)],
  ['a >= b', ({ a, b }) => +(a >= b)],
  ['a == a', () => 1],
  ['a != b', ({ a, b }) => +(a !== b)],
  ['a < b == c < d', ({ a, b, c, d }) => +((a < b) === (c < d))],
  ['a && b', ({ a, b }) => a && b],
  ['a || b', ({ a, b }) => a || b],
  ['d && a || c', ({ a, c, d }) => d && a || c],
  ['a > 0 ? b : c', ({ a, b, c }) => a > 0 ? b : c],
  ['a ? b : c ? d : 1', ({ a, b, c, d }) => a ? b : c ? d : 1],
  ['sin(2*PI*a*t) * b + y1*0.5', ({ a, b, t, y1 }) => Math.sin(2 * PI * a * t) * b + y1 * 0.5],
  ['sin(a) + cos(b) + tan(c)', ({ a, b, c }) => Math.sin(a) + Math.cos(b) + Math.tan(c)],
  ['asin(0.5) + acos(-0.25) + atan(b)', ({ b }) => Math.asin(0.5) + Math.acos(-0.25) + Math.atan(b)],
  ['atan2(a, b)', ({ a, b }) => Math.atan2(a, b)],
  ['sinh(c) + cosh(c) + tanh(a)', ({ a, c }) => Math.sinh(c) + Math.cosh(c) + Math.tanh(a)],
  ['exp(b) + log(3) + log2(8) + log10(1000)', ({ b }) => Math.exp(b) + Math.log(3) + Math.log2(8) + Math.log10(1000)],
  ['pow(c, 3) + sqrt(abs(b))', ({ b, c }) => Math.pow(c, 3) + Math.sqrt(Math.abs(b))],
  ['sign(b) + floor(b) + ceil(b) + round(b) + trunc(b)', ({ b }) => Math.sign(b) + Math.floor(b) + Math.ceil(b) + Math.round(b) + Math.trunc(b)],
  ['min(a, b) + max(a, b, c, d)', ({ a, b, c, d }) => Math.min(a, b) + Math.max(a, b, c, d)],
  ['clamp(a, -1, 1)', ({ a }) => Math.min(Math.max(a, -1), 1)],
  ['mix(a, b, 0.25)', ({ a, b }) => a + (b - a) * 0.25],
  ['fract(b)', ({ b }) => b - Math.floor(b)],
  ['mod(b, 0.7) + mod(-3, 2)', ({ b }) => mod(b, 0.7) + mod(-3, 2)],
  ['PI + E + TAU', () => PI + E + TAU],
  ['1e3 + .5 + 1. + 1.5e-2 + 2E+2', () => 1e3 + .5 + 1 + 1.5e-2 + 2e2],
  ['sr / 2 + t * sr', ({ sr, t }) => sr / 2 + t * sr],
  ['  a\n *\tb  ', ({ a, b }) => a * b],
  ['y1 * 0.99 + a * 0.01', ({ a, y1 }) => y1 * 0.99 + a * 0.01],
  ['1e999 > a', () => 1],
];

describe('expression compiler', () => {
  for (const [src, reference] of valid) {
    it(`computes ${JSON.stringify(src)} like JS`, () => {
      const kernel = kernelOf(src);

      for (const env of envs)
        expect(call(kernel, env)).toBe(reference(env));
    });
  }

  it('produces noise in [-1, 1)', () => {
    const kernel = kernelOf('noise()');
    const values = Array.from({ length: 1000 }, () => call(kernel, envs[0]));

    expect(values.every(v => v >= -1 && v < 1)).toBe(true);
    expect(new Set(values).size).toBeGreaterThan(900);
  });

  it('emits identical code for identical expressions', () => {
    const a = compile('sin(a)*b');
    const b = compile(' sin( a ) * b ');

    expect(a.ok && b.ok && a.kernel === b.kernel).toBe(true);
  });
});

const invalid: [string, RegExp, number?][] = [
  ['constructor', /Unknown identifier 'constructor'/, 0],
  ['a.constructor', /Member access/, 1],
  ['this', /Unknown identifier 'this'/, 0],
  ['globalThis', /Unknown identifier 'globalThis'/, 0],
  ['__proto__', /Unknown identifier/, 0],
  ['toString()', /Unknown function 'toString'/, 0],
  ['hasOwnProperty(a)', /Unknown function/, 0],
  ['valueOf', /Unknown identifier/],
  ['Math.sin(a)', /Member access/, 4],
  ['Function', /Unknown identifier/],
  ['"x"', /Strings are not allowed/, 0],
  ["'x'", /Strings are not allowed/, 0],
  ['`x`', /Strings are not allowed/, 0],
  ['eval("1")', /Strings are not allowed/, 5],
  ['a[0]', /Brackets/, 1],
  ['[1]', /Brackets/, 0],
  ['{}', /Braces/, 0],
  ['a=1', /Assignment/, 1],
  ['a += 1', /Assignment/, 3],
  ['a === b', /Unknown operator '==='/, 2],
  ['a ^ b', /use \*\*/, 2],
  ['a & b', /Bitwise/, 2],
  ['a; b', /single expression/, 1],
  ['alert(1)', /Unknown function 'alert'/, 0],
  ['sin()', /sin\(\) expects 1 argument, got 0/, 0],
  ['sin(1, 2)', /expects 1 argument, got 2/],
  ['clamp(1, 2)', /expects 3 arguments, got 2/],
  ['noise(1)', /expects 0 arguments/],
  ['min(a)', /expects 2\.\.8 arguments/],
  ['sin', /'sin' is a function/],
  ['a(1)', /'a' is not a function/],
  ['PI()', /'PI' is not a function/],
  ['', /empty/],
  ['   ', /empty/],
  ['a b', /Unexpected 'b'/, 2],
  ['(a', /Expected '\)'/, 2],
  ['a)', /Unexpected '\)'/, 1],
  ['a ? b', /Expected ':'/],
  ['a +', /Unexpected end/, 3],
  ['min(a,)', /Unexpected '\)'/],
  ['1a', /after number/, 1],
  ['0x10', /after number/, 1],
  ['1..2', /after number/, 2],
  ['1e', /exponent/],
  ['$', /Unexpected character/],
  ['a\\u0061', /Unexpected character/],
  ['=> 1', /Assignment/],
  [`${'('.repeat(200)}1${')'.repeat(200)}`, /too deeply nested/],
  [`${'-'.repeat(200)}1`, /too deeply nested/],
  [`${'1+'.repeat(150)}1`, /too deeply nested/],
  [`${'a+'.repeat(300)}a`, /too long/, MAX_LENGTH],
];

describe('expression compiler rejects', () => {
  for (const [src, message, pos] of invalid) {
    it(JSON.stringify(src.length > 40 ? `${src.slice(0, 40)}…` : src), () => {
      const result = compile(src);

      expect(result.ok).toBe(false);
      if (result.ok) return;

      expect(result.error.message).toMatch(message);
      if (pos !== undefined)
        expect(result.error.pos).toBe(pos);
    });
  }

  it('non-string input', () => {
    expect(compile(42 as unknown as string).ok).toBe(false);
  });
});

// Все имена, которые может содержать сгенерированный код
const allowedNames = new Set([
  'Infinity',
  ...expressionScope.variables.values(),
  ...[...expressionScope.functions.values()].map(func => func.emit([]).split('(')[0]),
]);

// Имена вместе с цепочками через точку: Math.sin целиком, а не только Math
const namesIn = (code: string) => code.match(/(?<![\w$.])[A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)*/g) ?? [];

const leaves = ['a', 'b', 'c', 'd', 't', 'sr', 'y1', 'PI', 'E', 'TAU', '0', '1.5', '2e-3', '1e999'];
const unary = ['-', '!'];
const binary = ['+', '-', '*', '/', '%', '**', '<', '<=', '>', '>=', '==', '!=', '&&', '||'];
const calls = [...expressionScope.functions].map(([name, { min }]) => [name, min] as const);

// Простой детерминированный ГПСЧ, чтобы тесты были воспроизводимы
const random = (seed: number) => () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;

const randomExpression = (rnd: () => number, depth: number): string => {
  const pick = <T,>(list: readonly T[]) => list[Math.floor(rnd() * list.length)];
  const r = rnd();

  if (depth <= 0 || r < 0.25) return pick(leaves);
  if (r < 0.35) return `${pick(unary)}${randomExpression(rnd, depth - 1)}`;
  if (r < 0.45) return `(${randomExpression(rnd, depth - 1)})`;
  if (r < 0.55) return `${randomExpression(rnd, depth - 1)} ? ${randomExpression(rnd, depth - 1)} : ${randomExpression(rnd, depth - 1)}`;
  if (r < 0.7) {
    const [name, arity] = pick(calls);
    return `${name}(${Array.from({ length: arity }, () => randomExpression(rnd, depth - 1)).join(', ')})`;
  }
  return `${randomExpression(rnd, depth - 1)} ${pick(binary)} ${randomExpression(rnd, depth - 1)}`;
};

describe('generated code', () => {
  it('contains only whitelisted names for random valid expressions', () => {
    const rnd = random(1);
    var compiled = 0;

    for (let i = 0; i < 2000; i++) {
      const src = randomExpression(rnd, 5);
      const result = compile(src);

      if (src.length > MAX_LENGTH) continue;
      expect(result.ok, src).toBe(true);
      if (!result.ok) continue;

      compiled++;
      for (const name of namesIn(result.code))
        expect(allowedNames.has(name), `${name} in ${result.code}`).toBe(true);

      // код синтаксически корректен и возвращает число
      const kernel = run<Kernel>(result.kernel);
      expect(typeof call(kernel, envs[0])).toBe('number');
    }

    expect(compiled).toBeGreaterThan(1000);
  });

  it('never accepts random junk with names outside the whitelist', () => {
    const rnd = random(7);
    const alphabet = 'abcdty1srPIETAUsin(),.[]{}=+-*/%!<>?:&|^;"\'` \n0123456789$\\_constructorthisMath';

    for (let i = 0; i < 5000; i++) {
      const length = 1 + Math.floor(rnd() * 30);
      const src = Array.from({ length }, () => alphabet[Math.floor(rnd() * alphabet.length)]).join('');
      const result = compile(src);

      if (!result.ok) continue;

      for (const name of namesIn(result.code))
        expect(allowedNames.has(name), `${name} from ${JSON.stringify(src)}`).toBe(true);
    }
  });
});

describe('expression processor', () => {
  type Processor = {
    port: { onmessage: ((event: { data: unknown; }) => void) | null; };
    process(inputs: unknown[], outputs: Float32Array[][], parameters: Record<string, Float32Array>): boolean;
  };

  const load = (src: string, currentFrame = 0, sampleRate = 48000) => {
    const result = compile(src);
    if (!result.ok) throw result.error;

    const registered: Record<string, new (options?: unknown) => Processor> = {};

    class AudioWorkletProcessor {
      port = { onmessage: null };
    }

    run(
      `(() => { ${processorSource('ExpressionTest', result.kernel)} })()`,
      ['registerProcessor', 'AudioWorkletProcessor', 'sampleRate', 'currentFrame'],
      [(name: string, ctor: never) => registered[name] = ctor, AudioWorkletProcessor, sampleRate, currentFrame]
    );

    expect(Object.keys(registered)).toEqual(['ExpressionTest']);
    return new registered.ExpressionTest();
  };

  const params = (values: Partial<Record<typeof PROCESSOR_INPUTS[number], Float32Array>> = {}) => (
    Object.fromEntries(PROCESSOR_INPUTS.map(key => [key, values[key] ?? new Float32Array([0])]))
  );

  it('feeds back the previous sample through y1 across blocks', () => {
    const processor = load('y1 + 1');
    const out = [new Float32Array(4), new Float32Array(4)];

    expect(processor.process([], [out], params())).toBe(true);
    expect([...out[0]]).toEqual([1, 2, 3, 4]);
    expect([...out[1]]).toEqual([1, 2, 3, 4]);

    processor.process([], [out], params());
    expect([...out[0]]).toEqual([5, 6, 7, 8]);
  });

  it('reads a-rate and k-rate params and the clock', () => {
    const processor = load('a + b * 1000 + t * sr', 100, 1000);
    const out = [new Float32Array(3)];

    processor.process([], [out], params({ a: new Float32Array([1, 2, 3]), b: new Float32Array([5]) }));
    expect([...out[0]]).toEqual([5101, 5103, 5105]);
  });

  it('replaces NaN and Infinity with 0', () => {
    const processor = load('a / 0 + sqrt(-1)');
    const out = [new Float32Array(2)];

    processor.process([], [out], params());
    expect([...out[0]]).toEqual([0, 0]);
  });

  it('stops on the stop message', () => {
    const processor = load('1');
    processor.port.onmessage!({ data: STOP_MESSAGE });

    expect(processor.process([], [[new Float32Array(2)]], params())).toBe(false);
  });

  it('rejects unsafe processor names', () => {
    expect(() => processorSource('a"); alert(1); ("', '0')).toThrow();
  });
});
