import { ADSR_ATTACK, ADSR_DECAY, ADSR_IDLE, ADSR_RELEASE, ADSR_SUSTAIN, createAdsrState, lfoShapes, modulation as m } from "./index";
import { describe, expect, it } from "vitest";

// Собирает объект функций так же, как defineWorklet: toString() каждого метода
// и bind на сам объект. Ловит ссылки на замыкания и импорты.
const serialize = (functions: Record<string, Function>) => {
  const body = Object.entries(functions)
    .map(([name, func]) => {
      const code = func.toString();
      return code.startsWith(name) ? code : `${JSON.stringify(name)}: ${code}`;
    })
    .join(',\n');

  const data = new Function(`return {${body}};`)() as Record<string, Function>;

  for (const key in data)
    data[key] = data[key].bind(data);

  return data as unknown as typeof m;
};

const runAdsr = (
  api: typeof m,
  gates: number[],
  params = { attack: 0.004, decay: 0.004, sustain: 0.5, release: 0.004, peak: 1 },
  dt = 0.001
) => {
  const env = createAdsrState();
  const out: number[] = [];

  for (const gate of gates)
    out.push(api.adsrStep(env, gate, params.attack, params.decay, params.sustain, params.release, params.peak, dt));

  return { env, out };
};

describe('edges', () => {
  it('detects rising edge across 0.5', () => {
    expect(m.rising(0, 1)).toBe(true);
    expect(m.rising(0.5, 0.51)).toBe(true);
    expect(m.rising(0.5, 0.5)).toBe(false);
    expect(m.rising(0.6, 1)).toBe(false);
    expect(m.rising(1, 0)).toBe(false);
  });

  it('detects falling edge across 0.5', () => {
    expect(m.falling(1, 0)).toBe(true);
    expect(m.falling(0.51, 0.5)).toBe(true);
    expect(m.falling(0.5, 0)).toBe(false);
    expect(m.falling(0, 1)).toBe(false);
  });
});

describe('lfoShape', () => {
  const at = (shape: string, p: number) => m.lfoShape(shape, p, 0.25);

  it('draws sine', () => {
    expect(at('sine', 0)).toBeCloseTo(0);
    expect(at('sine', 0.25)).toBeCloseTo(1);
    expect(at('sine', 0.75)).toBeCloseTo(-1);
  });

  it('draws triangle in phase with sine', () => {
    expect(at('triangle', 0)).toBe(0);
    expect(at('triangle', 0.25)).toBe(1);
    expect(at('triangle', 0.5)).toBe(0);
    expect(at('triangle', 0.75)).toBe(-1);
    expect(at('triangle', 0.125)).toBe(0.5);
  });

  it('draws square, saw and ramp down', () => {
    expect(at('square', 0.1)).toBe(1);
    expect(at('square', 0.6)).toBe(-1);
    expect(at('saw', 0)).toBe(-1);
    expect(at('saw', 0.5)).toBe(0);
    expect(at('ramp-down', 0)).toBe(1);
    expect(at('ramp-down', 0.75)).toBe(-0.5);
  });

  it('holds the given value for random', () => {
    expect(at('random', 0.3)).toBe(0.25);
  });

  it('wraps phase outside 0..1', () => {
    for (const shape of lfoShapes) {
      expect(m.lfoShape(shape, 1.3, 0)).toBeCloseTo(m.lfoShape(shape, 0.3, 0));
      expect(m.lfoShape(shape, -0.7, 0)).toBeCloseTo(m.lfoShape(shape, 0.3, 0));
    }
  });

  it('stays within -1..1', () => {
    for (const shape of lfoShapes)
      for (let p = 0; p < 1; p += 0.01) {
        const v = m.lfoShape(shape, p, 1);
        expect(v).toBeGreaterThanOrEqual(-1);
        expect(v).toBeLessThanOrEqual(1);
      }
  });

  it('falls back to sine for unknown shape', () => {
    expect(at('nope', 0.25)).toBeCloseTo(1);
  });
});

describe('wrap / lfoWrapped', () => {
  it('wraps into [0, 1)', () => {
    expect(m.wrap(1)).toBe(0);
    expect(m.wrap(2.25)).toBe(0.25);
    expect(m.wrap(-0.25)).toBe(0.75);
    expect(m.wrap(-1e-20)).toBe(0);
  });

  it('reports a cycle boundary with offset', () => {
    expect(m.lfoWrapped(0.95, 0.1, 0)).toBe(true);
    expect(m.lfoWrapped(0.5, 0.1, 0)).toBe(false);
    expect(m.lfoWrapped(0.45, 0.1, 0.5)).toBe(true);
    expect(m.lfoWrapped(0.05, -0.1, 0)).toBe(true);
  });
});

describe('adsrStep', () => {
  it('walks through attack, decay, sustain and release', () => {
    const { out, env } = runAdsr(m, [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0]);

    expect(out.slice(0, 4)).toEqual([0.25, 0.5, 0.75, 1]);
    expect(out.slice(4, 8)).toEqual([0.875, 0.75, 0.625, 0.5]);
    expect(out[9]).toBe(0.5);
    expect(out.slice(10, 14)).toEqual([0.375, 0.25, 0.125, 0]);
    expect(out[15]).toBe(0);
    expect(env.stage).toBe(ADSR_IDLE);
  });

  it('reports stages', () => {
    const env = createAdsrState();
    const step = (gate: number) => m.adsrStep(env, gate, 0.002, 0.002, 0.5, 0.002, 1, 0.001);

    step(1);
    expect(env.stage).toBe(ADSR_ATTACK);
    step(1);
    expect(env.stage).toBe(ADSR_DECAY);
    step(1);
    step(1);
    expect(env.stage).toBe(ADSR_SUSTAIN);
    step(0);
    expect(env.stage).toBe(ADSR_RELEASE);
  });

  it('retriggers from the current level without a jump', () => {
    const { out } = runAdsr(m, [1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 1, 1]);

    // release: 0.5 → 0.375 → 0.25, затем атака с 0.25 тем же наклоном
    expect(out[9]).toBe(0.25);
    expect(out[10]).toBe(0.5);
    expect(out[11]).toBe(0.75);
  });

  it('releases from mid-attack over the release time', () => {
    const { out } = runAdsr(m, [1, 1, 0, 0, 0, 0]);

    expect(out[1]).toBe(0.5);
    expect(out.slice(2)).toEqual([0.375, 0.25, 0.125, 0]);
  });

  it('jumps on zero times', () => {
    const params = { attack: 0, decay: 0, sustain: 0.3, release: 0, peak: 2 };
    const { out } = runAdsr(m, [1, 1, 1, 0], params);

    expect(out).toEqual([2, 0.6, 0.6, 0]);
  });

  it('clamps sustain and follows it while held', () => {
    const env = createAdsrState();
    const step = (sustain: number) => m.adsrStep(env, 1, 0, 0, sustain, 0, 1, 0.001);

    step(0.5);
    expect(step(0.5)).toBe(0.5);
    expect(step(0.8)).toBe(0.8);
    expect(step(2)).toBe(1);
  });

  it('stays idle without gate', () => {
    const { out } = runAdsr(m, [0, 0.5, 0.2]);
    expect(out).toEqual([0, 0, 0]);
  });
});

describe('randomIn', () => {
  it('maps r into [from, to)', () => {
    expect(m.randomIn(0, 2, 4, 0)).toBe(2);
    expect(m.randomIn(0.5, 2, 4, 0)).toBe(3);
    expect(m.randomIn(0.999, 2, 4, 0)).toBeLessThan(4);
  });

  it('quantizes to from + k·step and stays below to', () => {
    expect(m.randomIn(0, 0, 1, 0.25)).toBe(0);
    expect(m.randomIn(0.3, 0, 1, 0.25)).toBe(0.25);
    expect(m.randomIn(0.9999, 0, 1, 0.25)).toBe(0.75);
    expect(m.randomIn(0.9999, 1, 2.1, 0.1)).toBeLessThan(2.1);
    expect(m.randomIn(0.9999, 0, 1, 0.3)).toBeCloseTo(0.9);
  });

  it('covers every grid value', () => {
    const seen = new Set<number>();
    for (let r = 0; r < 1; r += 0.001)
      seen.add(m.randomIn(r, 10, 20, 2));
    expect([...seen].sort((a, b) => a - b)).toEqual([10, 12, 14, 16, 18]);
  });

  it('handles reversed and empty ranges', () => {
    expect(m.randomIn(0.5, 4, 2, 0)).toBe(3);
    expect(m.randomIn(0.9, 4, 2, 1)).toBe(3);
    expect(m.randomIn(0.7, 3, 3, 1)).toBe(3);
  });

  it('uses one value when step exceeds the range', () => {
    expect(m.randomIn(0.9, 0, 1, 5)).toBe(0);
  });
});

describe('counter', () => {
  it('counts without modulo', () => {
    expect(m.counterStep(0, 1, 0)).toBe(1);
    expect(m.counterStep(5, -2, 0)).toBe(3);
  });

  it('wraps with modulo', () => {
    expect(m.counterStep(3, 1, 4)).toBe(0);
    expect(m.counterStep(0, -1, 4)).toBe(3);
    expect(m.counterStep(9, 1, 4)).toBe(2);
    expect(m.counterStep(0.5, 0.25, 1)).toBe(0.75);
  });

  it('wrapModulo stays in [0, modulo)', () => {
    expect(m.wrapModulo(-4, 4)).toBe(0);
    expect(m.wrapModulo(-1e-20, 4)).toBe(0);
    expect(m.wrapModulo(7, -1)).toBe(7);
  });
});

describe('worklet serialization', () => {
  const copy = serialize(m);

  it('keeps every function self-contained', () => {
    expect(Object.keys(copy).sort()).toEqual(Object.keys(m).sort());
  });

  it('matches the library for lfo shapes', () => {
    for (const shape of lfoShapes)
      for (let p = -1; p < 2; p += 0.037)
        expect(copy.lfoShape(shape, p, 0.3)).toBe(m.lfoShape(shape, p, 0.3));
  });

  it('matches the library for the envelope', () => {
    const gates = [1, 1, 1, 1, 1, 1, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0];
    expect(runAdsr(copy, gates).out).toEqual(runAdsr(m, gates).out);
  });

  it('matches the library for random and counter', () => {
    for (let r = 0; r < 1; r += 0.07) {
      expect(copy.randomIn(r, -1, 3, 0.5)).toBe(m.randomIn(r, -1, 3, 0.5));
      expect(copy.counterStep(r * 10, 1, 4)).toBe(m.counterStep(r * 10, 1, 4));
    }
  });
});
