import { BaseNode } from "../lib/BaseNode";
import { Canvas } from "$components/canvas";
import { Range } from "../lib/Range";
import { SignalNode } from "../lib/signalNode";
import { SignalPort } from "../ports/SignalPort";
import { line } from "../lib/line";
import { name } from "$library/function";
import { store } from "$library/store";

@name('Turner')
export default class extends BaseNode {
  _in = new SignalNode(0, { default: 0 });

  @store _sensitivity = new SignalNode(1, { default: 1, min: 0.0001, max: 10 });
  @store _speed = new SignalNode(1, { default: 1, min: 0.01, max: 10 });

  _data: [x: number, y: number][] = Array.from({ length: 1000 }, (_, i) => [0, i]);

  input = (
    <SignalPort value={this._in} />
  );

  _view = () => (
    <>
      <Canvas width={400} height={150} loop={({ dtime, ctx, can }) => {
        var { width, height } = can;
        const data = this._data;

        data.unshift([
          this._in.value * height * .4,
          this._speed.value * dtime * .1
        ]);

        ctx.resetTransform();
        ctx.clearRect(0, 0, width, height);
        ctx.setTransform(-1, 0, 0, -1, width, height * .5);

        line(ctx, (m) => {
          for (var i = 0, x = 0; x <= width + 100 && i < data.length; x += data[i][1] ?? 0, i++)
            m(x, data[i][0] * this._sensitivity.value);
          data.splice(i);
        }, { size: 2, color: '#777' });
      }} />
      <Range label="Sensitivity" value={this._sensitivity} strict accuracy={5} />
      <Range label="Speed" value={this._speed} strict accuracy={2} />
    </>
  );
}