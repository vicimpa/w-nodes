import { ctx, empty } from "../ctx";
import { effect, signal } from "@preact/signals-react";

import { AudioPort } from "../ports/AudioPort";
import { BaseNode } from "../lib/BaseNode";
import { Range } from "../lib/Range";
import { dispose } from "$library/dispose";
import { signalRef } from "$library/signals";
import { store } from "$library/store";

export class DynamicsCompressor extends BaseNode {
  title = 'DynamicsCompressor';
  color = '#3498DB';

  #effect = ctx.createDynamicsCompressor();

  canvas = signalRef<HTMLCanvasElement>();

  @store _threshold = signal(this.#effect.threshold.value);
  @store _ratio = signal(this.#effect.ratio.value);
  @store _attack = signal(this.#effect.attack.value);
  @store _release = signal(this.#effect.release.value);
  @store _knee = signal(this.#effect.knee.value);
  @store _reduction = signal(this.#effect.reduction);

  drawCompressorSettings(threshold: number, ratio: number, _attack: number, _release: number) {
    const { value: canvas } = this.canvas;
    const ctx = canvas?.getContext('2d');

    if (!canvas || !ctx) return;
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    const xScale = width / 100;
    const yScale = height * .2;

    ctx.beginPath();
    ctx.moveTo(0, height * .2);
    ctx.lineTo(width, height * .2);
    ctx.moveTo(width / 2, 0);
    ctx.lineTo(width / 2, height);
    ctx.strokeStyle = '#CCCCCC';
    ctx.stroke();

    ctx.beginPath();
    for (let x = 0; x <= width; x++) {
      const inputLevel = (x / xScale) - 50;
      let outputLevel;

      if (inputLevel < threshold) {
        outputLevel = inputLevel;
      } else {
        outputLevel = threshold + (inputLevel - threshold) / ratio;
      }

      ctx.lineTo(x, yScale - outputLevel);
    }

    ctx.strokeStyle = '#FF5733';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  _connect = () => {
    this.#effect.connect(empty);

    return dispose(
      () => {
        this.#effect.disconnect(empty);
      },
      effect(() => {
        this.drawCompressorSettings(
          this._threshold.value,
          this._ratio.value,
          this._attack.value,
          this._release.value
        );
      })
    );
  };

  input = (
    <AudioPort value={this.#effect} />
  );

  output = (
    <AudioPort value={this.#effect} output />
  );

  _view = () => (
    <>
      <canvas
        ref={this.canvas}
        width={150}
        height={100} />

      <Range
        label="Threshold"
        value={this._threshold}
        min={this.#effect.threshold.minValue}
        max={this.#effect.threshold.maxValue}
        change={this.#effect.threshold}
        accuracy={2}
      />

      <Range
        label="KNEE"
        value={this._knee}
        min={this.#effect.knee.minValue}
        max={this.#effect.knee.maxValue}
        accuracy={2}
        change={this.#effect.knee}
      />

      <Range
        label="Ratio"
        value={this._ratio}
        min={this.#effect.ratio.minValue}
        max={this.#effect.ratio.maxValue}
        accuracy={2}
        change={this.#effect.ratio}
      />

      <Range
        label="Attack"
        value={this._attack}
        min={this.#effect.attack.minValue}
        max={this.#effect.attack.maxValue}
        accuracy={2}
        change={this.#effect.attack}
      />

      <Range
        label="Release"
        value={this._release}
        min={this.#effect.release.minValue}
        max={this.#effect.release.maxValue}
        accuracy={2}
        change={this.#effect.release}
      />
    </>
  );
}