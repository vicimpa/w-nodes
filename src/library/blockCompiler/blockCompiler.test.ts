import { TCompiled, TGraph, TLink, blockProcessorSource, compileBlock, paramDefaults, templates } from ".";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createAdsrState, modulation } from "$library/modulation";

import { STOP_MESSAGE } from "$library/expression";
import { math } from "$library/math";

const SR = 48000;
const F = Math.fround;

// Глобальные объекты, которые сгенерированный код видеть не должен
const hidden = ['globalThis', 'window', 'self', 'global', 'process', 'eval', 'Function', 'require', 'fetch'];

type Kernel = (ins: (Float32Array | undefined)[], outs: Float32Array[], ps: Float32Array[], n: number, frame: number) => void;

// new Function — только в тестах: проверяем, что сгенерированный цикл считает как эталон
const factoryOf = (source: string): (sr: number) => Kernel => (
  new Function(...hidden, 'sampleRate', `return ${source};`)(...hidden.map(() => undefined), SR)
);

const compiled = (graph: TGraph) => {
  const result = compileBlock(graph);

  if (!result.ok)
    throw new Error(result.reason);

  return result;
};

// Прогоняет блоки по `n` сэмплов; входы — функции от номера сэмпла, параметры — значения из конфигов
const runner = (graph: TGraph, overrides: Record<number, (i: number) => number> = {}) => {
  const result = compiled(graph);
  const kernel = factoryOf(result.source)(SR);
  const defaults = paramDefaults(graph, result.params);
  var frame = 0;

  return {
    result,
    run(n: number, inputs: ((i: number) => number)[] = []) {
      const ins = result.inputs.map((_, k) => inputs[k] && Float32Array.from({ length: n }, (_, i) => inputs[k](frame + i)));
      const outs = result.outputs.map(() => new Float32Array(n));
      const ps = result.params.map((_, k) => (
        overrides[k] ? Float32Array.from({ length: n }, (_, i) => overrides[k](frame + i)) : new Float32Array([defaults[k]])
      ));

      kernel(ins, outs, ps, n, frame);
      frame += n;
      return outs.map(out => [...out]);
    },
  };
};

// Граф из списка нод [тип, конфиг] и связей
const graph = (nodes: [string, Record<string, unknown>?][], connect: TLink[]): TGraph => ({
  nodes: nodes.map(([type]) => type),
  configs: nodes.map(([, config]) => ({ x: 0, y: 0, ...config })),
  connect,
});

const IN = (slot = 'in1'): [string, Record<string, unknown>] => ['GroupInput', { slot, label: 'in' }];
const OUT = (slot = 'out1'): [string, Record<string, unknown>] => ['GroupOutput', { slot, label: 'out' }];
const MATH = (op: string, values: Record<string, number> = {}): [string, Record<string, unknown>] => (
  ['Math', { _p: op, _a: 0, _b: 0, _c: 0, _d: 0, _e: 0, ...values }]
);

// Номер выхода ноды Math в sortPorts: после её входов
const mathOut = (op: keyof typeof math) => math[op].length;

const ramp = (i: number) => Math.sin(i * 0.37) * 3;

afterEach(() => {
  vi.restoreAllMocks();
});

describe('block compiler: structure', () => {
  it('passes an input wired straight to an output around the processor', () => {
    const { result, run } = runner(graph([IN(), OUT()], [[[0, 0], [1, 0]]]));

    expect(result.passthrough).toEqual([['in1', 'out1']]);
    expect(result.inputs).toEqual(['in1']);
    expect(result.outputs).toEqual(['out1']);
    expect(run(4, [ramp])).toEqual([[0, 0, 0, 0]]);
  });

  it('computes a chain', () => {
    // in → times(·, 2) → plus(·, 1) → out
    const { run } = runner(graph(
      [IN(), MATH('times', { _b: 2 }), MATH('plus', { _b: 1 }), OUT()],
      [
        [[0, 0], [1, 0]],
        [[1, mathOut('times')], [2, 0]],
        [[2, mathOut('plus')], [3, 0]],
      ]
    ));

    const [out] = run(16, [ramp]);
    expect(out).toEqual(Array.from({ length: 16 }, (_, i) => F(F(F(ramp(i)) * 2) + 1)));
  });

  it('accepts links stored in either direction', () => {
    // так связи пишет сворачивание блока: [[выход блока, 0], [нода, порт выхода]]
    const { run } = runner(graph(
      [MATH('plus', { _a: 1, _b: 2 }), OUT()],
      [[[1, 0], [0, mathOut('plus')]]]
    ));

    expect(run(2)).toEqual([[3, 3]]);
  });

  it('fans out one node and sums wires into one input', () => {
    // in → sin → (times 2, times 3) → out (сумма двух проводов)
    const { run } = runner(graph(
      [IN(), MATH('sin'), MATH('times', { _b: 2 }), MATH('times', { _b: 3 }), OUT()],
      [
        [[0, 0], [1, 0]],
        [[1, mathOut('sin')], [2, 0]],
        [[1, mathOut('sin')], [3, 0]],
        [[2, mathOut('times')], [4, 0]],
        [[3, mathOut('times')], [4, 0]],
      ]
    ));

    const [out] = run(32, [ramp]);
    const expected = Array.from({ length: 32 }, (_, i) => {
      const s = F(Math.sin(F(ramp(i))));
      return F(F(s * 2) + F(s * 3));
    });

    expect(out).toEqual(expected);
  });

  it('sums several wires into a node input like an AudioParam', () => {
    const { run } = runner(graph(
      [MATH('plus', { _a: 0.25, _b: 0.5 }), MATH('PI'), MATH('abs'), OUT()],
      [
        [[0, mathOut('plus')], [2, 0]],
        [[1, mathOut('PI')], [2, 0]],
        [[2, mathOut('abs')], [3, 0]],
      ]
    ));

    expect(run(1)).toEqual([[F(F(0.75 + F(Math.PI)))]]);
  });

  it('turns unwired inputs into live parameters', () => {
    const g = graph([MATH('plus', { _a: 1, _b: Infinity }), OUT()], [[[0, 2], [1, 0]]]);
    const { result } = runner(g);

    expect(result.params).toEqual([{ node: 0, key: '_a' }, { node: 0, key: '_b' }]);
    expect(paramDefaults(g, result.params)).toEqual([1, 0]);
  });

  it('follows live parameter values sample by sample', () => {
    const { run } = runner(
      graph([MATH('times', { _a: 1, _b: 1 }), OUT()], [[[0, 2], [1, 0]]]),
      { 0: i => i, 1: () => 0.5 }
    );

    expect(run(4)).toEqual([[0, 0.5, 1, 1.5]]);
  });

  it('skips nodes that do not reach an output', () => {
    const { result } = runner(graph([MATH('random'), IN(), OUT()], [[[1, 0], [2, 0]]]));
    expect(result.source).not.toContain('$m');
  });

  it('keeps the slot order and ignores duplicate slots', () => {
    const { result } = runner(graph([IN('b'), IN('a'), IN('b'), OUT('y'), OUT('x')], []));

    expect(result.inputs).toEqual(['b', 'a']);
    expect(result.outputs).toEqual(['y', 'x']);
  });

  it('sums several Group Output nodes of one slot', () => {
    const { run } = runner(graph(
      [MATH('PI'), MATH('E'), OUT('o'), OUT('o')],
      [[[0, 0], [2, 0]], [[1, 0], [3, 0]]]
    ));

    expect(run(1)).toEqual([[F(F(Math.PI) + F(Math.E))]]);
  });

  it('emits Constant values and rejects bad ones', () => {
    const { result, run } = runner(graph(
      [['Constant', { _constant: 'TAU', _number: 1 }], ['Constant', { _constant: 'NUMBER', _number: -3 }], MATH('plus'), OUT()],
      [[[0, 0], [2, 0]], [[1, 0], [2, 1]], [[2, 2], [3, 0]]]
    ));

    expect(result.params).toEqual([]);
    expect(run(1)).toEqual([[F(F(Math.PI * 2) - 3)]]);

    const bad = compileBlock(graph([['Constant', { _constant: 'NUMBER', _number: 'x' }], OUT()], [[[0, 0], [1, 0]]]));
    expect(bad.ok).toBe(false);
  });

  it('passes Slider and Toggle values through, wired or not', () => {
    // Slider без провода — живой параметр; Toggle с проводом от Slider — его значение
    const { result, run } = runner(graph(
      [['Slider', { _value: 0.25 }], ['Toggle', { _toggle: 0 }], OUT()],
      [[[0, 1], [1, 0]], [[1, 1], [2, 0]]]
    ));

    expect(result.params).toEqual([{ node: 0, key: '_value' }]);
    expect(run(2)).toEqual([[0.25, 0.25]]);
  });
});

describe('block compiler: feedback', () => {
  it('breaks a cycle with a one-sample delay', () => {
    // Memory(value ← plus(memory, 1), write = 1) — счётчик сэмплов
    const { result, run } = runner(graph(
      [['Memory', { _value: 0, _write: 1 }], MATH('plus', { _b: 1 }), OUT()],
      [
        [[0, 2], [1, 0]],
        [[1, mathOut('plus')], [0, 0]],
        [[0, 2], [2, 0]],
      ]
    ));

    expect(result.delayed).toHaveLength(1);
    expect(run(4)).toEqual([[1, 2, 3, 4]]);
    // состояние живёт между блоками
    expect(run(3)).toEqual([[5, 6, 7]]);
  });

  it('computes a one-pole filter y[n] = x[n] + 0.5 * y[n-1]', () => {
    const { run } = runner(graph(
      [IN(), MATH('plus'), MATH('times', { _b: 0.5 }), OUT()],
      [
        [[0, 0], [1, 0]],
        [[1, mathOut('plus')], [2, 0]],
        [[2, mathOut('times')], [1, 1]],
        [[1, mathOut('plus')], [3, 0]],
      ]
    ));

    const input = (i: number) => i === 0 ? 1 : 0.125;
    const out = [...run(5, [input])[0], ...run(5, [input])[0]];
    var y = 0;
    const expected = Array.from({ length: 10 }, (_, i) => y = F(F(input(i)) + F(y * 0.5)));

    expect(out).toEqual(expected);
  });

  it('handles a node wired to itself', () => {
    const { run } = runner(graph(
      [MATH('plus', { _b: 1 }), OUT()],
      [[[0, 2], [0, 0]], [[0, 2], [1, 0]]]
    ));

    expect(run(3)).toEqual([[1, 2, 3]]);
  });

  it('orders a cycle deterministically', () => {
    const g = graph(
      [MATH('plus'), MATH('plus'), OUT()],
      [[[0, 2], [1, 0]], [[1, 2], [0, 0]], [[0, 2], [2, 0]]]
    );

    expect(compiled(g).source).toBe(compiled(g).source);
  });
});

describe('block compiler: Expression', () => {
  const EXPR = (expression: string, values: Record<string, number> = {}): [string, Record<string, unknown>] => (
    ['Expression', { expression, _a: 0, _b: 0, _c: 0, _d: 0, ...values }]
  );

  it('binds a–d to wires and live parameters', () => {
    const { result, run } = runner(graph(
      [IN(), EXPR('a * b + sin(c) + d', { _b: 2, _c: 0.5, _d: -1 }), OUT()],
      [[[0, 0], [1, 0]], [[1, 4], [2, 0]]]
    ));

    expect(result.params.map(p => p.key)).toEqual(['_b', '_c', '_d']);
    const [out] = run(8, [ramp]);
    expect(out).toEqual(Array.from({ length: 8 }, (_, i) => F(F(ramp(i)) * 2 + Math.sin(0.5) + -1)));
  });

  it('keeps its own y1 and the clock across blocks', () => {
    const { run } = runner(graph([EXPR('y1 + t * sr'), OUT()], [[[0, 4], [1, 0]]]));

    run(3);
    // y[n] = y[n-1] + n
    expect(run(3)).toEqual([[3 + 3, 6 + 4, 10 + 5]]);
  });

  it('replaces NaN and Infinity with 0 like the Expression processor', () => {
    const { run } = runner(graph([EXPR('a / 0 + sqrt(-1)'), OUT()], [[[0, 4], [1, 0]]]));
    expect(run(2)).toEqual([[0, 0]]);
  });

  it('reports a formula error', () => {
    const result = compileBlock(graph([EXPR('sin('), OUT()], [[[0, 4], [1, 0]]]));
    expect(result).toEqual({ ok: false, reason: expect.stringMatching(/^Expression: /) });
  });

  it.each([
    'constructor',
    'a.constructor',
    '"x"',
    'alert(1)',
    'a; b',
    '}); fetch("x"); ({',
  ])('rejects unsafe formula %j', expression => {
    expect(compileBlock(graph([EXPR(expression), OUT()], [[[0, 4], [1, 0]]])).ok).toBe(false);
  });

  it('rejects a non-string formula', () => {
    expect(compileBlock(graph([['Expression', { expression: { toString: () => '1' } }], OUT()], [[[0, 4], [1, 0]]])).ok).toBe(false);
  });
});

describe('block compiler: Math table', () => {
  const inputs = [0.75, -2.5, 3, 0.125, 9];
  const skip = new Set(['random', 'srandom', 'SAMPLE_RATE']);

  for (const op of Object.keys(math) as (keyof typeof math)[]) {
    if (skip.has(op)) continue;

    it(`${op} matches the Math node table`, () => {
      const values = Object.fromEntries(['_a', '_b', '_c', '_d', '_e'].map((key, i) => [key, inputs[i]]));
      const { run } = runner(graph([MATH(op, values), OUT()], [[[0, mathOut(op)], [1, 0]]]));
      const func = math[op] as (this: typeof math, ...args: number[]) => number;
      // Параметры AudioParam — float32
      const expected = F(func.apply(math, inputs.map(F)));

      expect(run(1)[0][0]).toBe(expected);
    });
  }

  it('reads sampleRate for SAMPLE_RATE', () => {
    const { run } = runner(graph([MATH('SAMPLE_RATE'), OUT()], [[[0, 0], [1, 0]]]));
    expect(run(1)).toEqual([[SR]]);
  });

  it('includes only used operations unless one needs the table', () => {
    const plus = compiled(graph([MATH('plus'), OUT()], [[[0, 2], [1, 0]]])).source;
    const remap = compiled(graph([MATH('remap'), OUT()], [[[0, 5], [1, 0]]])).source;

    expect(plus).not.toContain('minus');
    expect(remap).toContain('lerp');
  });

  it('rejects an unknown operation without putting it into code', () => {
    const op = 'plus(0); fetch("x"); //';
    const result = compileBlock(graph([MATH(op), OUT()], [[[0, 2], [1, 0]]]));

    expect(result).toEqual({ ok: false, reason: 'Math has an unknown operation' });
    expect(compileBlock(graph([MATH('constructor'), OUT()], [])).ok).toBe(false);
    expect(compileBlock(graph([MATH('__proto__'), OUT()], [])).ok).toBe(false);
  });
});

describe('block compiler: modulation nodes', () => {
  it('LFO follows the LFO processor math', () => {
    const rate = 1000;
    const { run } = runner(graph(
      [['LFO', { _shape: 'triangle', _rate: rate, _depth: 0.5, _offset: 0.25, _phase: 0.1, _sync: 0 }], OUT()],
      [[[0, 5], [1, 0]]]
    ));

    var phase = 0;
    const expected = Array.from({ length: 64 }, () => {
      const y = F(F(0.25) + F(0.5) * modulation.lfoShape('triangle', phase + F(0.1), 0));
      phase = modulation.wrap(phase + rate / SR);
      return y;
    });

    expect(run(64)[0]).toEqual(expected);
  });

  it('LFO with an unknown shape plays a sine and never puts the shape into code', () => {
    const shape = '"); fetch("x"); ("';
    const { result, run } = runner(graph([['LFO', { _shape: shape, _rate: 0, _depth: 1, _offset: 0, _phase: 0.25, _sync: 0 }], OUT()], [[[0, 5], [1, 0]]]));

    expect(result.source).not.toContain('fetch');
    expect(run(1)).toEqual([[1]]);
  });

  it('ADSR follows adsrStep', () => {
    const gate = (i: number) => i < 40 ? 1 : 0;
    const values = { _gate: 0, _attack: 0.0002, _decay: 0.0002, _sustain: 0.5, _release: 0.0004, _peak: 1 };
    const { run } = runner(graph([['ADSR', values], OUT()], [[[0, 6], [1, 0]]]), { 0: gate });
    const env = createAdsrState();
    const expected = Array.from({ length: 80 }, (_, i) => F(modulation.adsrStep(
      env, gate(i), F(values._attack), F(values._decay), F(values._sustain), F(values._release), 1, 1 / SR
    )));

    expect(run(80)[0]).toEqual(expected);
  });

  it('Counter counts rising edges and resets', () => {
    const trigger = (i: number) => i % 2;
    const reset = (i: number) => i === 7 ? 1 : 0;
    const { run } = runner(
      graph([['Counter', { _trigger: 0, _step: 1, _reset: 0, _modulo: 0 }], OUT()], [[[0, 4], [1, 0]]]),
      { 0: trigger, 2: reset }
    );

    expect(run(10)[0]).toEqual([0, 1, 1, 2, 2, 3, 3, 0, 0, 1]);
  });

  it('Random holds from until the first trigger, then a random value', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const { run } = runner(
      graph([['Random', { _trigger: 0, _from: 2, _to: 4, _step: 0 }], OUT()], [[[0, 4], [1, 0]]]),
      { 0: i => i >= 2 ? 1 : 0 }
    );

    expect(run(4)[0]).toEqual([2, 2, 3, 3]);
  });
});

describe('block compiler: rejects', () => {
  it('unknown node types', () => {
    expect(compileBlock(graph([['Oscillator'], OUT()], []))).toEqual({ ok: false, reason: 'Oscillator is not compilable' });
    expect(compileBlock(graph([['Group'], OUT()], []))).toEqual({ ok: false, reason: 'Group is not compilable' });
    expect(compileBlock(graph([['__proto__'], OUT()], [])).ok).toBe(false);
    expect(compileBlock(graph([['toString'], OUT()], [])).ok).toBe(false);
  });

  it('links to ports that do not exist', () => {
    expect(compileBlock(graph([MATH('plus'), OUT()], [[[0, 7], [1, 0]]])).ok).toBe(false);
    expect(compileBlock(graph([MATH('plus'), OUT()], [[[5, 0], [1, 0]]])).ok).toBe(false);
  });

  it('links between two inputs or two outputs', () => {
    expect(compileBlock(graph([MATH('plus'), MATH('plus')], [[[0, 0], [1, 0]]])).ok).toBe(false);
    expect(compileBlock(graph([MATH('plus'), MATH('plus')], [[[0, 2], [1, 2]]])).ok).toBe(false);
  });

  it('broken graphs', () => {
    expect(compileBlock({ nodes: null, connect: [], configs: [] } as unknown as TGraph).ok).toBe(false);
    expect(compileBlock({ nodes: [], connect: [null], configs: [] } as unknown as TGraph).ok).toBe(false);
  });

  it('never puts slot ids into code', () => {
    const slot = '"]; fetch("x"); //';
    const result = compiled(graph([IN(slot), OUT(slot)], []));

    expect(result.source).not.toContain('fetch');
    expect(result.inputs).toEqual([slot]);
  });
});

describe('block compiler: templates', () => {
  it('declare structural keys and ports for every type', () => {
    for (const [type, template] of Object.entries(templates)) {
      expect(Array.isArray(template.structural), type).toBe(true);
      expect(typeof template.ports({ _p: 'plus', slot: 'x' }), type).toBe('object');
    }
  });
});

describe('block processor', () => {
  type Processor = {
    port: { onmessage: ((event: { data: unknown; }) => void) | null; };
    process(inputs: Float32Array[][], outputs: Float32Array[][], parameters: Record<string, Float32Array>): boolean;
  };

  const load = (result: TCompiled) => {
    const registered: Record<string, { new(): Processor; parameterDescriptors: { name: string; }[]; }> = {};

    new Function(...hidden, 'registerProcessor', 'AudioWorkletProcessor', 'sampleRate', 'currentFrame', blockProcessorSource('BlockTest', result))(
      ...hidden.map(() => undefined),
      (name: string, ctor: never) => registered[name] = ctor,
      class { port = { onmessage: null }; },
      SR,
      0
    );

    return registered.BlockTest;
  };

  it('maps slots to inputs and outputs and params to k0…', () => {
    const result = compiled(graph(
      [IN('x'), MATH('times'), OUT('y'), MATH('plus', { _b: 1 }), OUT('z')],
      [
        [[0, 0], [1, 0]],
        [[1, 2], [2, 0]],
        [[3, 2], [4, 0]],
      ]
    ));
    const Processor = load(result);

    expect(Processor.parameterDescriptors.map(p => p.name)).toEqual(['k0', 'k1', 'k2']);

    const processor = new Processor();
    const y = [new Float32Array(3), new Float32Array(3)];
    const z = [new Float32Array(3)];

    processor.process([[new Float32Array([1, 2, 3])]], [y, z], {
      k0: new Float32Array([10]),
      k1: new Float32Array([5]),
      k2: new Float32Array([1, 2, 3]),
    });

    expect([...y[0]]).toEqual([10, 20, 30]);
    expect([...y[1]]).toEqual([10, 20, 30]);
    expect([...z[0]]).toEqual([6, 7, 8]);
  });

  it('reads silence from an unconnected input', () => {
    const Processor = load(compiled(graph([IN(), MATH('plus', { _b: 1 }), OUT()], [[[0, 0], [1, 0]], [[1, 2], [2, 0]]])));
    const out = [new Float32Array(2)];

    new Processor().process([[]], [out], { k0: new Float32Array([1]) });
    expect([...out[0]]).toEqual([1, 1]);
  });

  it('stops on the stop message', () => {
    const processor = new (load(compiled(graph([OUT()], []))))();

    processor.port.onmessage!({ data: STOP_MESSAGE });
    expect(processor.process([], [[new Float32Array(1)]], {})).toBe(false);
  });

  it('rejects unsafe processor names', () => {
    expect(() => blockProcessorSource('a"); fetch("x"); ("', compiled(graph([OUT()], [])))).toThrow();
  });
});
