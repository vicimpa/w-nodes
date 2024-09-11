import { ParamDescriptor, defineWorklet } from "../lib/defineWorklet";
declare var sampleRate: number;

export const operators = {
  'plus': (a: number, b: number) => a + b,
  'minus': (a: number, b: number) => a - b,
  'times': (a: number, b: number) => a * b,
  'div': (a: number, b: number) => a / b,
  'rem': (a: number, b: number) => a % b,
  'pow': (a: number, b: number) => a ** b,
  'greater': (a: number, b: number) => +(a > b),
  'less': (a: number, b: number) => +(a < b),
  'equal': (a: number, b: number) => +(a === b),
  'inequal': (a: number, b: number) => +(a !== b),
  'land': (a: number, b: number) => a && b,
  'lor': (a: number, b: number) => a || b,
  'and': (a: number, b: number) => a & b,
  'or': (a: number, b: number) => a | b,
  'xor': (a: number, b: number) => a ^ b,
  'not': (a: number) => ~a,
  'right': (a: number, b: number) => a >> b,
  'left': (a: number, b: number) => a << b,
  'uright': (a: number, b: number) => a >>> b,
} as const;


export const constants = {
  'E': () => Math.E,
  'PI': () => Math.PI,
  'PI1_2': () => Math.PI / 2,
  'PI2': () => Math.PI * 2,
  'SQRT2': () => Math.SQRT2,
  'SQRT1_2': () => Math.SQRT1_2,
  'LN10': () => Math.LN10,
  'LN2': () => Math.LN2,
  'LOG10E': () => Math.LOG10E,
  'LOG2E': () => Math.LOG2E,
  'SAMPLE_RATE': () => sampleRate,
} as const;

export const functions = {
  'abs': (a: number) => Math.abs(a),
  'acos': (a: number) => Math.acos(a),
  'asin': (a: number) => Math.asin(a),
  'asinh': (a: number) => Math.asinh(a),
  'atan': (a: number) => Math.atan(a),
  'atan2': (a: number, b: number) => Math.atan2(a, b),
  'atanh': (a: number) => Math.atanh(a),
  'cbrt': (a: number) => Math.cbrt(a),
  'ceil': (a: number) => Math.ceil(a),
  'clz32': (a: number) => Math.clz32(a),
  'cos': (a: number) => Math.cos(a),
  'cosh': (a: number) => Math.cosh(a),
  'exp': (a: number) => Math.exp(a),
  'expm1': (a: number) => Math.expm1(a),
  'floor': (a: number) => Math.floor(a),
  'fround': (a: number) => Math.fround(a),
  'hypot': (a: number, b: number) => Math.hypot(a, b),
  'imul': (a: number, b: number) => Math.imul(a, b),
  'log': (a: number) => Math.log(a),
  'log10': (a: number) => Math.log10(a),
  'log1p': (a: number) => Math.log1p(a),
  'log2': (a: number) => Math.log2(a),
  'max': (a: number, b: number) => Math.max(a, b),
  'min': (a: number, b: number) => Math.min(a, b),
  'random': () => Math.random(),
  'round': (a: number) => Math.round(a),
  'sign': (a: number) => Math.sign(a),
  'sin': (a: number) => Math.sin(a),
  'sinh': (a: number) => Math.sinh(a),
  'sqrt': (a: number) => Math.sqrt(a),
  'tan': (a: number) => Math.tan(a),
  'tanh': (a: number) => Math.tanh(a),
  'trunc': (a: number) => Math.trunc(a)
};

export const custom = {
  lerp: (a: number, b: number, c: number) => (c - b) * a + b,
  normalize: (a: number, b: number, c: number) => (a - b) / (c - b),
  remap(a: number, b: number, c: number, d: number, e: number) { return this.lerp(this.normalize(a, b, c), d, e); },
  clamp: (a: number, b: number, c: number) => Math.min(Math.max(a, Math.min(b, c)), Math.max(b, c)),
  getNote: (a: number) => (2 ** (1 / 12)) ** a * 440
} as const;

export const renamePorts: { op: MathOperation[], ports: { [key in keyof typeof params]?: string }; }[] = [
  {
    op: ['lerp', 'normalize', 'clamp'],
    ports: {
      a: 'value',
      b: 'min',
      c: 'max'
    }
  },
  {
    op: Object.keys(functions) as MathOperation[],
    ports: {
      a: 'x',
      b: 'y',
      c: 'z'
    }
  },
  {
    op: ['remap'],
    ports: {
      a: 'value',
      b: 'minSrc',
      c: 'maxSrc',
      d: 'minDist',
      e: 'maxDist'
    }
  },
  {
    op: ['note'],
    ports: {
      a: 'note',
    }
  }
];

export const math = {
  ...operators,
  ...constants,
  ...functions,
  ...custom,
} as const;

export type MathOperation = keyof typeof math;

export const params = {
  a: {
    defaultValue: 0,
  } as ParamDescriptor,
  b: {
    defaultValue: 0,
  } as ParamDescriptor,
  c: {
    defaultValue: 0,
  } as ParamDescriptor,
  d: {
    defaultValue: 0,
  } as ParamDescriptor,
  e: {
    defaultValue: 0,
  } as ParamDescriptor,
} as const;

export default await defineWorklet({
  params: params,
  functions: math,
  options: {
    numberOfInputs: 0,
    numberOfOutputs: 1
  },
  props: {
    type: 'plus',
  } as { type: MathOperation; },
  loop(outL) {
    var func = this.functions[this.props.type];

    for (var i = 0; i < this.numFrames; i++) {
      var a = this.param('a', i);
      var b = this.param('b', i);
      var c = this.param('c', i);
      var d = this.param('d', i);
      var e = this.param('e', i);
      outL[i] = func(a, b, c, d, e);
    }
  }
});