import { defineWorklet } from "../lib/defineWorklet";

export const math = {
  'a + b': (a: number, b: number) => a + b,
  'a - b': (a: number, b: number) => a - b,
  'a * b': (a: number, b: number) => a * b,
  'a / b': (a: number, b: number) => a / b,
  'a % b': (a: number, b: number) => a % b,
  'a ** b': (a: number, b: number) => a ** b,
  'a & b': (a: number, b: number) => a & b,
  'a | b': (a: number, b: number) => a | b,
  'a ^ b': (a: number, b: number) => a ^ b,
  'a >> b': (a: number, b: number) => a >> b,
  'a << b': (a: number, b: number) => a << b,
  'a > b': (a: number, b: number) => +(a > b),
  'a < b': (a: number, b: number) => +(a < b),
  'a === b': (a: number, b: number) => +(a === b),
  'a !== b': (a: number, b: number) => +(a !== b),
  'a && b': (a: number, b: number) => a && b,
  'a || b': (a: number, b: number) => a || b,
  'min(a, b)': (a: number, b: number) => Math.min(a, b),
  'max(a, b)': (a: number, b: number) => Math.max(a, b),
} as const;

export type MathOperation = keyof typeof math;

export default await defineWorklet({
  params: {
    a: {
      defaultValue: 0,
    },
    b: {
      defaultValue: 0,
    }
  },
  functions: math,
  options: {
    numberOfInputs: 0,
    numberOfOutputs: 1,
    outputChannelCount: [2]
  },
  props: {
    type: 'a + b' as MathOperation,
  },
  loop(outL, outR) {
    var func = this.functions[this.props.type];

    for (var i = 0; i < this.numFrames; i++) {
      var a = this.param('a', i);
      var b = this.param('b', i);
      var result = func(a, b);

      outL[i] = result;
      outR[i] = result;
    }
  }
});