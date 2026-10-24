// Чистая DSP-математика для LFO, ADSR, Random и Counter.
// Объект целиком передаётся в defineWorklet({ functions }): каждый метод
// сериализуется через toString(), поэтому методы не должны ссылаться
// ни на что, кроме своих аргументов, `this` (сам объект) и `Math`.

export const lfoShapes = ['sine', 'triangle', 'square', 'saw', 'ramp-down', 'random'] as const;

export type LfoShape = typeof lfoShapes[number];

// Стадии огибающей
export const ADSR_IDLE = 0;
export const ADSR_ATTACK = 1;
export const ADSR_DECAY = 2;
export const ADSR_SUSTAIN = 3;
export const ADSR_RELEASE = 4;

export type AdsrState = {
  gate: number;
  stage: number;
  level: number;
  from: number;
};

export const createAdsrState = (): AdsrState => ({ gate: 0, stage: 0, level: 0, from: 0 });

export const modulation = {
  // Фронт: предыдущий ≤ 0.5, текущий > 0.5
  rising(prev: number, value: number): boolean {
    return prev <= 0.5 && value > 0.5;
  },

  falling(prev: number, value: number): boolean {
    return prev > 0.5 && value <= 0.5;
  },

  // Дробная часть, всегда в [0, 1)
  wrap(x: number): number {
    var r = x - Math.floor(x);
    return r >= 1 ? 0 : r;
  },

  // Форма LFO на фазе 0..1, результат в −1..1; held — значение для S&H
  lfoShape(shape: string, phase: number, held: number): number {
    var p = this.wrap(phase);

    if (shape === 'triangle')
      return p < 0.25 ? 4 * p : p < 0.75 ? 2 - 4 * p : 4 * p - 4;
    if (shape === 'square')
      return p < 0.5 ? 1 : -1;
    if (shape === 'saw')
      return 2 * p - 1;
    if (shape === 'ramp-down')
      return 1 - 2 * p;
    if (shape === 'random')
      return held;

    return Math.sin(2 * Math.PI * p);
  },

  // Перешла ли фаза (со сдвигом offset) через целое на шаге от phase к phase + inc
  lfoWrapped(phase: number, inc: number, offset: number): boolean {
    return Math.floor(phase + offset) !== Math.floor(phase + inc + offset);
  },

  // Двигает value к target не больше чем на step; step ≤ 0 — прыжок
  approach(value: number, target: number, step: number): number {
    // Допуск: параметры приходят во float32, без него сегмент растягивается на лишний сэмпл
    if (!(step > 0) || Math.abs(target - value) <= step * (1 + 1e-6))
      return target;

    if (value < target)
      return Math.min(value + step, target);

    return Math.max(value - step, target);
  },

  // Один сэмпл огибающей. Сегменты линейные. Меняет env, возвращает уровень.
  adsrStep(
    env: AdsrState,
    gate: number,
    attack: number,
    decay: number,
    sustain: number,
    release: number,
    peak: number,
    dt: number
  ): number {
    var sus = Math.min(Math.max(sustain, 0), 1) * peak;

    if (this.rising(env.gate, gate)) {
      env.stage = 1;
    } else if (this.falling(env.gate, gate)) {
      env.stage = 4;
      env.from = env.level;
    }

    env.gate = gate;

    if (env.stage === 1) {
      // Атака с текущего уровня с тем же наклоном: 0 → peak за attack секунд
      env.level = this.approach(env.level, peak, attack > 0 ? Math.abs(peak) * dt / attack : 0);

      if (env.level === peak)
        env.stage = 2;
    } else if (env.stage === 2) {
      env.level = this.approach(env.level, sus, decay > 0 ? Math.abs(peak - sus) * dt / decay : 0);

      if (env.level === sus)
        env.stage = 3;
    } else if (env.stage === 3) {
      // Sustain следует за параметрами
      env.level = sus;
    } else if (env.stage === 4) {
      // Release всегда занимает release секунд, с какого бы уровня ни начался
      env.level = this.approach(env.level, 0, release > 0 ? Math.abs(env.from) * dt / release : 0);

      if (env.level === 0)
        env.stage = 0;
    } else {
      env.level = 0;
    }

    return env.level;
  },

  // Случайное значение в [from, to) по r ∈ [0, 1); step > 0 — только узлы from + k·step
  randomIn(r: number, from: number, to: number, step: number): number {
    var range = to - from;

    if (!(step > 0) || range === 0)
      return from + r * range;

    var count = Math.max(1, Math.ceil(Math.abs(range) / step - 1e-9));
    var k = Math.min(Math.floor(r * count), count - 1);

    return from + (range < 0 ? -k : k) * step;
  },

  // Остаток, всегда в [0, modulo); modulo ≤ 0 — без ограничения
  wrapModulo(value: number, modulo: number): number {
    if (!(modulo > 0))
      return value;

    var r = value % modulo;

    if (r < 0)
      r += modulo;

    // r === 0 ловит и −0
    return r >= modulo || r === 0 ? 0 : r;
  },

  counterStep(count: number, step: number, modulo: number): number {
    return this.wrapModulo(count + step, modulo);
  },
};

export type Modulation = typeof modulation;
