import InterpolationProcessor, { FunctionType, functions } from "../worklet/SmoothingProcessor";

import { AudioPort } from "../ports/AudioPort";
import { BaseNode } from "../lib/BaseNode";
import { Canvas } from "$components/canvas";
import { Range } from "../lib/Range";
import { Select } from "../lib/Select";
import { SignalNode } from "../lib/signalNode";
import { SignalPort } from "../ports/SignalPort";
import { dispose } from "$library/dispose";
import { line } from "../lib/line";
import { name } from "$library/function";
import { signal } from "@preact/signals-react";
import { store } from "$library/store";

const types = Object.keys(functions) as FunctionType[];
const variants = types.map(value => ({ value }));

@name('Smoothing')
export default class extends BaseNode {
  #processor = new InterpolationProcessor();

  _input = new SignalNode(this.#processor.value);

  @store _type = signal(this.#processor.props.type);
  @store _frames = new SignalNode(this.#processor.frames, { min: 1, max: 100000 });

  input = (
    <SignalPort value={this._input} />
  );

  _connect = () => dispose(
    () => this.#processor.destroy()
  );

  output = (
    <AudioPort value={this.#processor} output />
  );

  _view = () => (
    <>
      <Canvas
        width={150}
        height={150}
        style={{ padding: 0 }}
        draw={(ctx, { width, height }) => {
          var count = 100;
          var p = width * .15;
          ctx.clearRect(0, 0, width, height);
          ctx.beginPath();
          ctx.moveTo(p, p);
          ctx.lineTo(p, height - p);
          ctx.moveTo(p, height - p);
          ctx.lineTo(width - p, height - p);
          ctx.strokeStyle = '#999';
          ctx.stroke();
          ctx.closePath();

          line(ctx, (m) => {
            for (let i = 0; i < 100; i++) {
              var x = i / count;
              var y = functions[this._type.value](x);
              m(x * (width - p * 2) + p, (height - p) - y * (height - p * 2));
            }
          }, { size: 2 });
        }}
      />

      <Select
        label="Type"
        value={this._type}
        variants={variants}
        change={v => this.#processor.props.type = v} />

      <Range
        label="Frames"
        value={this._frames}
        strict
      />
    </>
  );
}