import { ctx, empty } from "../ctx";
import { prop, reactive } from "@vicimpa/decorators";

import { AudioPort } from "../ports/AudioPort";
import { BaseNode } from "../lib/BaseNode";
import { Canvas } from "$components/canvas";
import { Range } from "../lib/Range";
import { Select } from "../lib/Select";
import { SignalNode } from "../lib/signalNode";
import { avgArray } from "../lib/avgArray";
import { dispose } from "$library/dispose";
import { frequencies } from "../lib/frequencies";
import { group } from "../_groups";
import { name } from "$library/function";
import { signal } from "@preact/signals-react";
import { store } from "$components/node-editor";

function freqName(n: number) {
  if (n >= 1000) return ((n / 1000) | 0) + "k";
  return n + '';
}

const type: BiquadFilterType[] = ["allpass", "bandpass", "highpass", "highshelf", "lowpass", "lowshelf", "notch", "peaking"];
const variants = type.map((value) => ({ value }));

@name('BiquadFilter')
@group('base')
@reactive()
export default class extends BaseNode {
  #effect = ctx.createBiquadFilter();
  #view = ctx.createBiquadFilter();

  @store _type = signal(this.#effect.type);
  @store _frequency = new SignalNode(this.#effect.frequency);
  @store _q = new SignalNode(this.#effect.Q, { min: -100, max: 100 });
  @store _detune = new SignalNode(this.#effect.detune, { min: -1200, max: 1200 });
  @store _gain = new SignalNode(this.#effect.gain, { min: -10, max: 10 });
  @prop _draw = 0;

  _freq = new Float32Array(avgArray(frequencies, 5));
  _out = new Float32Array(this._freq.length);
  _outPhase = new Float32Array(this._freq.length);


  _connect = () => {
    this.#effect.connect(empty);

    return dispose(
      () => {
        this.#effect.disconnect(empty);
      }
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
      <Canvas
        width={300}
        height={100} draw={(ctx, can) => {
          const getX = (x: number, length: number) => (
            (x + 0.5) * (can.width / length)
          );

          ctx.clearRect(0, 0, can.width, can.height);
          this.#view.type = this._type.value;
          this.#view.frequency.value = this._frequency.value;
          this.#view.Q.value = this._q.value;
          this.#view.detune.value = this._detune.value;
          this.#view.gain.value = this._gain.value;
          this.#view.getFrequencyResponse(this._freq, this._out, this._outPhase);

          ctx.textAlign = 'center';
          ctx.textBaseline = 'top';
          ctx.font = '10px Arial';

          ctx.strokeStyle = '#fff';
          ctx.lineWidth = 1;

          for (let i = 0; i < frequencies.length; i++) {
            ctx.strokeText(freqName(frequencies[i]), getX(i, frequencies.length), 2);
          }

          ctx.lineWidth = .5;
          ctx.strokeStyle = '#999';
          ctx.beginPath();

          for (let i = 0; i < frequencies.length; i++) {
            const x = getX(i, frequencies.length);
            ctx.moveTo(x, 10);
            ctx.lineTo(x, can.height - 10);
          }

          ctx.stroke();
          ctx.closePath();

          ctx.lineWidth = 3;
          ctx.strokeStyle = '#fff';

          var points: [x: number, y: number][] = [];

          for (let i = 0; i < this._freq.length; i++) {
            const x = getX(i, this._freq.length);
            points.push([x, can.height + -this._out[i] * can.height * .5]);
          }

          ctx.stroke(new Path2D(points.map((e, i) => `${['M', 'L'][+!!i]}${e[0]},${e[1]}`).join(' ')));
        }} />

      <Select
        label="Type"
        value={this._type}
        variants={variants}
        change={v => this.#effect.type = v}
      />

      <Range
        label="Frequency"
        value={this._frequency}
        postfix="HZ"
      />

      <Range
        label="Q"
        value={this._q}
        accuracy={1}
      />

      <Range
        label="Detune"
        value={this._detune}
        postfix="cents"
      />

      <Range
        label="Gain"
        value={this._gain}
        accuracy={2}
      />
    </>
  );
}