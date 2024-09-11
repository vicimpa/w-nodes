import { name } from "$library/function";
import { ctx } from "../ctx";
import { signal } from "@preact/signals-react";

declare global {
  var processorCount: number;
}

var processorCount = globalThis.processorCount ?? (
  globalThis.processorCount = 0
);

export type ParamDescriptor = {
  defaultValue: number;
  automationRate?: "a-rate" | "k-rate";
  minValue?: number,
  maxValue?: number,
};

export const using = signal(0);
export const created = signal(0);

type Primitive =
  | number
  | string
  | boolean
  | Primitive[]
  | { [_: string]: Primitive; };

type Prop =
  | number
  | string
  | boolean
  | Prop[]
  | { [key: string]: Prop; };

type Functions = {
  [key: string]: (...args: any[]) => Primitive;
};

type Props = {
  [key: string]: Prop;
};

type WorkletOptions<
  P extends string,
  C extends Primitive = {},
  F extends Functions = {},
  D extends Props = {},
> = {
  name?: string;
  params?: {
    [key in P]: ParamDescriptor
  };
  context?: C;
  functions?: F;
  props?: D;
  options?: AudioWorkletNodeOptions;
  loop(
    this: {
      context: C;
      functions: F;
      props: D;
      numFrames: number;
      sampleRate: number;
      inputs: Float32Array[][];
      outputs: Float32Array[][];
      parameters: Record<string, Float32Array>;
      param(name: P, index: number, defaultValue?: number): number;
    },
    outL: Float32Array,
    outR: Float32Array,
  ): void;
};

export async function defineWorklet<
  const P extends string,
  C extends Primitive,
  const F extends Functions,
  D extends Props
>(
  options: WorkletOptions<P, C, F, D>
) {
  const loop = options.loop.toString();

  if (!loop.startsWith('loop'))
    throw new Error('You need define loop as object method');

  const params = Object.entries<ParamDescriptor>(options.params ?? {})
    .map(([name, param]) => (
      `  ${JSON.stringify({
        name,
        automationRate: 'a-rate',
        ...param
      })}`
    ))
    .join(',\n');

  const processorName = `CustomWorklet${processorCount++}`;
  const functions = Object.entries<Function>(options.functions ?? {})
    .map(([name, func]) => {
      const code = func.toString();
      if (code.startsWith(name))
        return `  ${code}`;

      return `${JSON.stringify(name)}: ${code}`;
    })
    .join(',\n');

  const code = `
    const data = {
      params: [
        ${params} 
      ],
      functions: {
        ${functions}
      },
      props: ${JSON.stringify(options.props ?? {})},
      ${loop}
    }
    
    for(let key in data.functions) {
      data.functions[key] = data.functions[key].bind(data.functions);
    }

    const sampleRate = ${JSON.stringify(ctx.sampleRate)};

    registerProcessor(
      "${processorName}",
      class ${processorName} extends AudioWorkletProcessor {
        context = ${JSON.stringify(options.context ?? {})};
        props = {...data.props};

        static get parameterDescriptors() {
          return [...data.params];
        }

        running = true;

        constructor(...args) {
          super(...args);
          this.port.onmessage = (data) => {
            if(data.data === '[STOP]') {
              this.running = false;
              return;
            }

            var {data: {key, value}} = data;
            this.props[key] = value;
          };
        }

        process(inputs, outputs, parameters) {
          if(!this.running)
            return false;

          const outL = outputs[0][0];
          const outR = outputs[0][1];
          const numFrames = outL.length;

          data.loop.call(
            {
              context: this.context,
              functions: data.functions,
              props: this.props,
              numFrames, 
              sampleRate, 
              inputs,
              outputs,
              parameters,
              param(name, index, defaultValue = 0) {
                return (
                  parameters[name]?.[index] ??
                  parameters[name]?.[0] ??
                  defaultValue ?? 0
                );
              }
            },
            outL,
            outR
          );

          return true;
        }
      }
    )
  `.split(/\n+/).map(e => e.trim()).join('\n');

  const blob = new Blob([code], { type: "application/javascript" });
  const url = URL.createObjectURL(blob);

  await ctx.audioWorklet.addModule(url);

  const pool: InstanceType<CustomWorkletConstructor>[] = [];

  type CustomWorkletConstructor = new (params?: Record<P, number>) => (
    & CustomAudioWorkletNode
    & {
      [K in P]: AudioParam
    }
  );

  class CustomAudioWorkletNode extends AudioWorkletNode {
    destroy() {
      using.value--;
      pool.push(this as InstanceType<CustomWorkletConstructor>);

      for (let key in options.params ?? {}) {
        var param = this.parameters.get(key);

        if (!param)
          continue;

        param.value = param.defaultValue;
      }

      if (options.props) {
        for (let key in options.props) {
          this.props[key] = options.props[key];
        }
      }
    }

    props = new Proxy({ ...options.props ?? {} } as D, {
      get: (target, key) => {
        return target[key as keyof D];
      },
      set: (target, key, value) => {
        target[key as keyof D] = value;
        this.port.postMessage({ key, value });
        return true;
      }
    });

    constructor(_params?: Record<P, number>) {
      const instance = pool.shift();

      if (instance) {
        using.value++;
        return instance;
      }

      using.value++;
      created.value++;

      super(ctx, processorName, {
        ...options.options, ...(_params ? { parameterData: _params } : {})
      });

      Object.defineProperties(
        this,
        Object.keys(options.params ?? {})
          .reduce((acc, name) => {
            acc[name] = {
              value: this.parameters.get(name)
            };
            return acc;
          }, {} as { [key: string]: TypedPropertyDescriptor<AudioParam>; })
      );
    }
  }

  return name(options.name ?? 'unname')(CustomAudioWorkletNode) as CustomWorkletConstructor;
}