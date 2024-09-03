import { ctx, empty } from "../ctx";

import { AudioPort } from "../ports/AudioPort";
import { BaseNode } from "../lib/BaseNode";
import { Canvas } from "../lib/Canvas";
import { Range } from "../lib/Range";
import { SignalNode } from "../lib/signalNode";
import { Vec2 } from "$library/vec2";
import { dispose } from "$library/dispose";
import { line } from "../lib/line";
import { name } from "$library/function";
import { pipe } from "../lib/pipe";
import { store } from "$library/store";

@name('DynamicsCompressor')
export default class extends BaseNode {
  #effect = ctx.createDynamicsCompressor();

  @store _threshold = new SignalNode(this.#effect.threshold);
  @store _ratio = new SignalNode(this.#effect.ratio);
  @store _attack = new SignalNode(this.#effect.attack);
  @store _release = new SignalNode(this.#effect.release);
  @store _knee = new SignalNode(this.#effect.knee);

  _connect = () => (
    dispose(
      pipe(this.#effect, empty)
    )
  );

  input = (
    <AudioPort value={this.#effect} />
  );

  output = (
    <AudioPort value={this.#effect} output />
  );

  _view = () => (
    <>
      <Canvas
        width={150}
        height={150}
        draw={(ctx, can) => {
          const threshold = this._threshold.value;
          const ratio = this._ratio.value;
          const knee = this._knee.value;
          const empty = new Vec2();
          const size = Vec2.fromSize(can);

          ctx.resetTransform();
          ctx.clearRect(empty, size);
          ctx.setTransform(1, 0, 0, -1, 0, size.y);

          const tPoint = new Vec2(1 + threshold / 100).times(size);
          const rPoint = new Vec2(1, 1 / ratio);

          const kPoint = new Vec2(knee / 100)
            .times(size)
            .times(rPoint)
            .plus(tPoint);

          const lPoint = size.ctimes(rPoint)
            .plus(kPoint);

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
        }} />

      <Range
        label="Threshold"
        value={this._threshold}
        accuracy={2}
      />

      <Range
        label="KNEE"
        value={this._knee}
        accuracy={2}
      />

      <Range
        label="Ratio"
        value={this._ratio}
        accuracy={2}
      />

      <Range
        label="Attack"
        value={this._attack}
        accuracy={2}
      />

      <Range
        label="Release"
        value={this._release}
        accuracy={2}
      />
    </>
  );
}