import { TCompiled, blockProcessorSource, paramName } from "$library/blockCompiler";

import { STOP_MESSAGE } from "$library/expression";
import { SignalNode } from "../lib/signalNode";
import type { TPair } from "./routing";
import { ctx } from "../ctx";
import { defineRuntimeWorklet } from "../lib/runtimeWorklet";
import { dispose } from "$library/dispose";
import { pipe } from "../lib/pipe";

// Скомпилированный блок, который сейчас звучит
export type TProgram = {
  key: string;
  signals: unknown[];
  // Соединения «вход блока → выход блока» мимо процессора
  passthrough: TPair<AudioNode>[];
  stop(): void;
};

type TBuildOptions = {
  key: string;
  result: TCompiled;
  signals: unknown[];
  defaults: number[];
  outer(id: string): AudioNode;
  onError(): void;
};

// Один AudioWorkletNode на весь блок: вход процессора на каждый входной слот, выход — на выходной.
// Каждый вход и выход — один канал: внутри блока всё моно, как и у параметров нод.
export async function buildProgram({ key, result, signals, defaults, outer, onError }: TBuildOptions): Promise<TProgram> {
  const passthrough = result.passthrough.map(([a, b]): TPair<AudioNode> => [outer(a), outer(b)]);

  if (!result.outputs.length)
    return { key, signals, passthrough, stop() { } };

  const processor = await defineRuntimeWorklet(`block:${result.source}`, name => blockProcessorSource(name, result));
  const node = new AudioWorkletNode(ctx, processor, {
    numberOfInputs: result.inputs.length,
    numberOfOutputs: result.outputs.length,
    outputChannelCount: result.outputs.map(() => 1),
    channelCount: 1,
    channelCountMode: 'explicit',
    channelInterpretation: 'speakers',
  });

  node.onprocessorerror = onError;

  const unwire = dispose(
    ...result.inputs.map((id, k) => {
      const gain = outer(id);
      gain.connect(node, 0, k);
      return () => gain.disconnect(node, 0, k);
    }),
    ...result.outputs.map((id, k) => {
      const gain = outer(id);
      node.connect(gain, k, 0);
      return () => node.disconnect(gain, k, 0);
    }),
    ...result.params.map((_, k) => {
      const param = node.parameters.get(paramName(k))!;
      const signal = signals[k];

      // Значение без провода идёт из ConstantSourceNode самой ноды: ручки работают без перекомпиляции
      if (signal instanceof SignalNode) {
        param.value = 0;
        return pipe(signal.node, param);
      }

      param.value = defaults[k];
    }),
  );

  return {
    key,
    signals,
    passthrough,
    stop() {
      node.onprocessorerror = null;
      unwire();
      node.port.postMessage(STOP_MESSAGE);
    },
  };
}
