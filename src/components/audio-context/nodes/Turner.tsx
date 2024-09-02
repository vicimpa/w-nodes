import { computed, signal } from "@preact/signals-react";

import { BaseNode } from "../lib/BaseNode";
import { Range } from "../lib/Range";
import { SignalPort } from "../ports/SignalPort";
import { frames } from "$library/frames";
import { line } from "../lib/line";
import { name } from "$library/function";
import { signalNode } from "../lib/signalNode";
import { signalRef } from "$library/signals";
import { store } from "$library/store";

@name('Turner')
export default class extends BaseNode {
  _in = signalNode(0);

  @store _sensitivity = signal(1);
  @store _speed = signal(1);

  _canRef = signalRef<HTMLCanvasElement>();
  _ctxRef = computed(() => this._canRef.value?.getContext('2d'));

  _connect = () => {
    var data: [x: number, y: number][] = [];
    for (let i = 0; i < 1000; i++) {
      data.push([0, i]);
    }

    return frames((dtime) => {
      const { value: can } = this._canRef;
      const { value: ctx } = this._ctxRef;

      if (!can || !ctx) return;
      var { width, height } = can;

      data.unshift([
        this._in.value * height * .4,
        this._speed.value * dtime * .1
      ]);

      ctx.resetTransform();
      ctx.clearRect(0, 0, width, height);
      ctx.setTransform(1, 0, 0, -1, 0, height * .5);

      line(ctx, (m) => {
        for (var i = 0, x = 0; x <= width + 100 && i < data.length; x += data[i][1] ?? 0, i++)
          m(x, data[i][0] * this._sensitivity.value);
        data.splice(i);
      }, { size: 2, color: '#777' });
    });
  };

  input = (
    <SignalPort value={this._in} />
  );

  _view = () => (
    <>
      <canvas ref={this._canRef} width={400} height={150} />
      <Range label="Sensitivity" value={this._sensitivity} strict min={.00001} max={5} default={1} accuracy={5} />
      <Range label="Speed" value={this._speed} strict min={.01} max={10} default={10} accuracy={2} />
    </>
  );
}