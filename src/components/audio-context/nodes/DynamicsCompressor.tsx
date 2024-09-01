import { ctx, empty } from "../ctx";
import { effect, signal } from "@preact/signals-react";

import { AudioPort } from "../ports/AudioPort";
import { BaseNode } from "../lib/BaseNode";
import { Range } from "../lib/Range";
import { Vec2 } from "$library/vec2";
import { dispose } from "$library/dispose";
import { line } from "../lib/line";
import { name } from "$library/function";
import { signalRef } from "$library/signals";
import { store } from "$library/store";

@name('DynamicsCompressor')
export default class extends BaseNode {
  #effect = ctx.createDynamicsCompressor();

  canvas = signalRef<HTMLCanvasElement>();

  @store _threshold = signal(this.#effect.threshold.value);
  @store _ratio = signal(this.#effect.ratio.value);
  @store _attack = signal(this.#effect.attack.value);
  @store _release = signal(this.#effect.release.value);
  @store _knee = signal(this.#effect.knee.value);
  @store _reduction = signal(this.#effect.reduction);

  outputLevel?: number;

  drawCompressorSettings(threshold: number, knee: number, ratio: number, _attack: number, _release: number) {
    const { value: canvas } = this.canvas;
    const ctx = canvas?.getContext('2d');

    if (!canvas || !ctx) return;
    const empty = new Vec2();
    const size = Vec2.fromSize(canvas);

    ctx.resetTransform();
    ctx.clearRect(empty, size);
    ctx.setTransform(1, 0, 0, -1, 0, size.y);

    // Определяем точки для графика
    const tPoint = new Vec2(1 + threshold / 100).times(size);
    const rPoint = new Vec2(1, 1 / ratio);

    const kPoint = new Vec2(knee / 100)
      .times(size)
      .times(rPoint)
      .plus(tPoint);

    const lPoint = size.ctimes(rPoint)
      .plus(kPoint);

    // Рисуем линии
    line(ctx, (move) => {
      move(tPoint.x, 0);
      move(tPoint.x, size.y);
    }, { dash: [5], size: 0.5 });

    line(ctx, (move) => {
      move(kPoint.x, 0);
      move(kPoint.x, size.y);
    }, { dash: [5], size: 0.5 });

    line(ctx, () => {
      const path = new Path2D();
      path.moveTo(empty);
      path.quadraticCurveTo(tPoint, kPoint);
      path.lineTo(lPoint);
      return path;
    }, { size: 4 });
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
          this._knee.value,
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
        height={150} />

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