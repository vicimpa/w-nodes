import { STOP_MESSAGE } from "$library/expression";
import type { TCompiled } from "./compile";

export const paramName = (index: number) => `k${index}`;

// Исходник модуля AudioWorklet для скомпилированного блока. Только доверенный код:
// фабрика из compileBlock, имя процессора из счётчика.
// Каждый слот — отдельный вход/выход процессора с одним каналом.
export const blockProcessorSource = (name: string, { source, inputs, outputs, params }: TCompiled) => {
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(name))
    throw new Error(`Invalid processor name '${name}'`);

  const descriptors = params.map((_, k) => ({ name: paramName(k), defaultValue: 0, automationRate: 'a-rate' }));

  return `
const factory = ${source};

registerProcessor(${JSON.stringify(name)}, class extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return ${JSON.stringify(descriptors)};
  }

  running = true;
  ins = new Array(${inputs.length}).fill(undefined);
  outs = new Array(${outputs.length}).fill(undefined);
  ps = new Array(${params.length}).fill(undefined);

  constructor(options) {
    super(options);
    this.run = factory(sampleRate);
    this.port.onmessage = (event) => {
      if (event.data === ${JSON.stringify(STOP_MESSAGE)})
        this.running = false;
    };
  }

  process(inputs, outputs, parameters) {
    if (!this.running)
      return false;

    const first = outputs[0] && outputs[0][0];

    if (!first)
      return true;

    for (let k = 0; k < ${inputs.length}; k++) {
      const input = inputs[k];
      this.ins[k] = input && input[0];
    }

    for (let k = 0; k < ${outputs.length}; k++)
      this.outs[k] = outputs[k][0];

    for (let k = 0; k < ${params.length}; k++)
      this.ps[k] = parameters["k" + k];

    this.run(this.ins, this.outs, this.ps, first.length, currentFrame);

    for (let k = 0; k < ${outputs.length}; k++)
      for (let ch = 1; ch < outputs[k].length; ch++)
        outputs[k][ch].set(outputs[k][0]);

    return true;
  }
});
`;
};
