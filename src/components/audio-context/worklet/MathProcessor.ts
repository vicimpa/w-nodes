import { MathOperation, functions, math } from "$library/math";
import { ParamDescriptor, defineWorklet } from "../lib/defineWorklet";

export * from "$library/math";

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
  },
  {
    op: ['normify', 'signify'],
    ports: {
      a: 'x',
    }
  }
];

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