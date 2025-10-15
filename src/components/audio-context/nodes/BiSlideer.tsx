import { BaseNode } from "../lib/BaseNode";
import { Canvas } from "$components/canvas";
import { PI2 } from "@vicimpa/math";
import { SignalNode } from "../lib/signalNode";
import { SignalPort } from "../ports/SignalPort";
import { vec2, Vec2 } from "@vicimpa/lib-vec2";
import { frames } from "$library/frames";
import { group } from "../_groups";
import { makeDrag } from "@vicimpa/easy-drag";
import { name } from "$library/function";
import { store } from "$components/node-editor";

const drag = makeDrag<[can: HTMLCanvasElement, ctx: BiSlider]>(({ current: now }, can, ctx) => {
  const current = vec2(now);
  const loop = frames(() => {
    const rect = can.getBoundingClientRect();
    const end = Vec2.fromSize(rect);
    const data = current
      .cminus(rect)
      .div(end)
      .clamp(0, 1)
      .times(1, -1)
      .plus(0, 1)
      .times(2)
      .minus(1);

    ctx._x.value = data.x;
    ctx._y.value = data.y;
  });

  return ({ current: newCurrent }) => {
    current.set(newCurrent);

    return () => {
      loop();
    };
  };
}, 0);

@name('BiSlider')
@group('controll')
export default class BiSlider extends BaseNode {
  radius = 10;

  @store _x = new SignalNode(0, { min: -1, max: 1, default: 0 });
  @store _y = new SignalNode(0, { min: -1, max: 1, default: 0 });

  output = (
    <>
      <SignalPort value={this._x} output title="x" />
      <SignalPort value={this._y} output title="y" />
    </>
  );

  draw(ctx: CanvasRenderingContext2D, can: HTMLCanvasElement) {
    const { radius } = this;
    const size = Vec2.fromSize(can);
    const center = size.ctimes(.5);
    const value = center.ctimes(this._x.value, -this._y.value);

    ctx.resetTransform();
    ctx.clearRect(0, 0, size);
    ctx.setTransform(1, 0, 0, 1, center);
    ctx.strokeStyle = '#fff';
    ctx.fillStyle = '#999';
    ctx.lineWidth = radius;
    ctx.beginPath();
    ctx.arc(value, radius, 0, PI2);
    ctx.stroke();
    ctx.fill();
    ctx.closePath();
  }

  _view = () => (
    <Canvas
      width={200}
      height={200}
      style={{ cursor: 'pointer', padding: 0 }}
      onMouseDown={(event) => {
        if (event.button === 2) {
          this._x.value = this._x.default;
          this._y.value = this._y.default;
        }

        drag(event, event.currentTarget, this);
      }}
      draw={(ctx, can) => {
        this.draw(ctx, can);
      }} />
  );
}