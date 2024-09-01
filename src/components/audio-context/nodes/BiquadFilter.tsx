import { ctx, empty } from "../ctx";
import { effect, signal } from "@preact/signals-react";

import { AudioPort } from "../ports/AudioPort";
import { BaseNode } from "../lib/BaseNode";
import { Range } from "../lib/Range";
import { Select } from "../lib/Select";
import { avgArray } from "../lib/avgArray";
import { dispose } from "$library/dispose";
import { frequencies } from "../lib/frequencies";
import { name } from "$library/function";
import { signalRef } from "$library/signals";
import { store } from "$library/store";

function freqName(n: number) {
  if (n >= 1000) return ((n / 1000) | 0) + "k";
  return n + '';
}

const type: BiquadFilterType[] = ["allpass", "bandpass", "highpass", "highshelf", "lowpass", "lowshelf", "notch", "peaking"];
const variants = type.map((value) => ({ value }));

@name('BiquadFilter')
export default class extends BaseNode {
  #effect = ctx.createBiquadFilter();

  canvas = signalRef<HTMLCanvasElement>();

  @store _type = signal(this.#effect.type);
  @store _frequency = signal(this.#effect.frequency.value);
  @store _q = signal(this.#effect.Q.value);
  @store _detune = signal(this.#effect.detune.value);
  @store _gain = signal(this.#effect.gain.value);

  _freq = new Float32Array(avgArray(frequencies, 5));
  _out = new Float32Array(this._freq.length);
  _outPhase = new Float32Array(this._freq.length);

  drawFilter() {
    const { value: can } = this.canvas;
    const ctx = can?.getContext('2d');


    if (!can || !ctx) return;

    const getX = (x: number, length: number) => (
      (x + 0.5) * (can.width / length)
    );

    ctx.clearRect(0, 0, can.width, can.height);
    this.#effect.getFrequencyResponse(this._freq, this._out, this._outPhase);

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
  }

  _connect = () => {
    this.#effect.connect(empty);

    return dispose(
      () => {
        this.#effect.disconnect(empty);
      },
      effect(() => {
        this.drawFilter();
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
        width={300}
        height={100} />

      <Select
        label="Type"
        value={this._type}
        variants={variants}
        change={v => (this.#effect.type = v, this.drawFilter())}
      />

      <Range
        label="Frequency"
        value={this._frequency}
        change={this.#effect.frequency}
        postfix="HZ"
        onChange={() => this.drawFilter()}
      />

      <Range
        label="Q"
        value={this._q}
        change={this.#effect.Q}
        min={-100}
        max={100}
        accuracy={1}
        onChange={() => this.drawFilter()}
      />

      <Range
        label="Detune"
        value={this._detune}
        change={this.#effect.detune}
        postfix="cents"
        min={-1200}
        max={1200}
        onChange={() => this.drawFilter()}
      />

      <Range
        label="Gain"
        value={this._gain}
        change={this.#effect.gain}
        min={-10}
        max={10}
        accuracy={2}
        onChange={() => this.drawFilter()}
      />
    </>
  );
}