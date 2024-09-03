import { Signal, effect } from "@preact/signals-react";
import { prop, reactive } from "$library/signals";

import { ctx } from "../ctx";
import { dispose } from "$library/dispose";
import { frames } from "$library/frames";
import { pipe } from "./pipe";
import { start } from "./start";

const value = (v: number | AudioParam) => (
  typeof v === 'number' ? v : v.value
);

export type SignalNodeParams = {
  min?: number;
  max?: number;
  default?: number;
};

@reactive()
export class SignalNode extends Signal<number> {
  node = new ConstantSourceNode(ctx);
  param?: AudioParam;

  #analyze = new AnalyserNode(ctx, { fftSize: 32 });
  #analyzeData = new Float32Array(this.#analyze.frequencyBinCount);

  min: number;
  max: number;
  default: number;

  @prop
  private _input: (SignalNode | AudioNode)[] = [];

  get connected() {
    return this._input.length > 0;
  };

  addInput(_input: SignalNode | AudioNode) {
    const index = this._input.indexOf(_input);
    if (index !== -1) return;
    this._input = [...this._input, _input];
  }

  deleteInput(_input: SignalNode | AudioNode) {
    const index = this._input.indexOf(_input);
    if (index === -1) return;
    this._input = this._input.toSpliced(index, 1);
  }

  connect(to: SignalNode | AudioNode | AudioParam) {
    if (to instanceof AudioNode) {
      this.node.connect(to);
      return;
    }

    if (to instanceof AudioParam) {
      this.node.connect(to);
      return;
    }

    if (to instanceof SignalNode) {
      this.node.connect(to.node.offset);
      to.addInput(to);
      return;
    }

    throw new Error('Cant connect');
  }

  disconnect(to: SignalNode | AudioNode | AudioParam) {
    if (to instanceof AudioNode) {
      this.node.disconnect(to);
      return;
    }

    if (to instanceof AudioParam) {
      this.node.disconnect(to);
      return;
    }

    if (to instanceof SignalNode) {
      this.node.disconnect(to.node.offset);
      to.deleteInput(to);
      return;
    }
  }

  start() {
    return dispose(
      start(this.node),
      this.param ? pipe(this.node, this.param) : undefined,
      effect(() => {
        if (this.connected) {
          this.node.offset.value = 0;
          return;
        } else {
          this.value = this.default;
        }
      }),
      effect(() => {
        if (this.connected)
          return;

        this.node.offset.value = this.value;
      }),
      effect(() => {
        if (!this.connected)
          return;

        return dispose(
          pipe(this.node, this.#analyze),
          frames(() => {
            this.#analyze.getFloatTimeDomainData(this.#analyzeData);

            if (this.value !== this.#analyzeData[0])
              this.value = this.#analyzeData[0];
          })
        );
      })
    );
  }

  constructor(param: number | AudioParam, params?: SignalNodeParams) {
    super(value(param));

    if (param instanceof AudioParam) {
      this.param = param;
      this.min = params?.min ?? param.minValue;
      this.max = params?.max ?? param.maxValue;
      this.default = params?.default ?? param.defaultValue;
      param.value = 0;
    } else {
      this.min = params?.min ?? this.node.offset.minValue;
      this.max = params?.max ?? this.node.offset.maxValue;
      this.default = params?.default ?? this.node.offset.defaultValue;
    }
  }
}