// Исходник модуля AudioWorklet для ядра из buildKernel. Только доверенный код: ядро из генератора,
// имя процессора из счётчика.

export const PROCESSOR_INPUTS = ['a', 'b', 'c', 'd'] as const;
export const STOP_MESSAGE = '[STOP]';

export const processorSource = (name: string, kernel: string) => {
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(name))
    throw new Error(`Invalid processor name '${name}'`);

  const descriptors = PROCESSOR_INPUTS.map(name => ({ name, defaultValue: 0, automationRate: 'a-rate' }));
  const reads = PROCESSOR_INPUTS
    .map(key => `p_${key}.length > 1 ? p_${key}[i] : p_${key}[0]`)
    .join(',\n        ');

  return `
const kernel = ${kernel};

registerProcessor(${JSON.stringify(name)}, class extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return ${JSON.stringify(descriptors)};
  }

  running = true;
  y1 = 0;

  constructor(options) {
    super(options);
    this.port.onmessage = (event) => {
      if (event.data === ${JSON.stringify(STOP_MESSAGE)})
        this.running = false;
    };
  }

  process(inputs, outputs, parameters) {
    if (!this.running)
      return false;

    const output = outputs[0];
    const out = output && output[0];

    if (!out)
      return true;

    ${PROCESSOR_INPUTS.map(key => `const p_${key} = parameters[${JSON.stringify(key)}];`).join('\n    ')}
    const sr = sampleRate;
    const frame = currentFrame;
    let y1 = this.y1;

    for (let i = 0; i < out.length; i++) {
      let y = kernel(
        ${reads},
        (frame + i) / sr,
        sr,
        y1
      );

      // NaN и бесконечность ломают фильтры дальше по цепочке
      if (!Number.isFinite(y))
        y = 0;

      out[i] = y;
      y1 = y;
    }

    this.y1 = y1;

    for (let ch = 1; ch < output.length; ch++)
      output[ch].set(out);

    return true;
  }
});
`;
};
