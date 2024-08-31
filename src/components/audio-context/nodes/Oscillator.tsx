import { PI, asin, sign, sin } from "$library/math";
import { ctx, empty } from "../ctx";
import { effect, signal } from "@preact/signals-react";

import { AudioPort } from "../ports/AudioPort";
import { BaseNode } from "../lib/BaseNode";
import { Range } from "../lib/Range";
import { Select } from "../lib/Select";
import { dispose } from "$library/dispose";
import { signalRef } from "$library/signals";
import { store } from "$library/store";

export class Oscillator extends BaseNode {
  title = 'Oscillator';
  color = '#3498DB';

  #src = ctx.createOscillator();
  #out = ctx.createGain();

  @store _gain = signal(this.#out.gain.value * 100);
  @store _type = signal(this.#src.type as keyof typeof this._waves);
  @store _freq = signal(this.#src.frequency.value);
  @store _detune = signal(this.#src.detune.value);

  canvas = signalRef<HTMLCanvasElement>();

  _waves = {
    sine: (t: number) => sin(t),
    square: (t: number) => sign(sin(t)),
    triangle: (t: number) => 2 / PI * asin(sin(t)),
    sawtooth: (t: number) => (t / PI) % 2 - 1
  } as const;

  _variants = Object.keys(this._waves).map(value => ({
    value: value as keyof typeof this._waves
  }));

  drawWaveform(type: keyof typeof this._waves) {
    const { value: canvas } = this.canvas;
    const ctx = canvas?.getContext('2d') ?? undefined;

    if (!canvas || !ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    const waveData = new Float32Array(width * 10);

    for (let i = 0; i < waveData.length; i++) {
      const t = (i / waveData.length * 2) * (2 * Math.PI);
      waveData[i] = this._waves[type]?.(t);
    }

    ctx.beginPath();
    ctx.moveTo(0, height / 2);

    for (let i = 0; i < waveData.length; i++) {
      const x = (i / waveData.length) * width;
      const y = (height * .5) - (waveData[i] * (height * .4));
      ctx.lineTo(x, y);
    }

    ctx.strokeStyle = '#FFF';
    ctx.lineWidth = 4;
    ctx.stroke();
  }

  _connect = () => {
    this.#src.connect(this.#out);
    this.#src.start();
    this.#src.connect(empty);

    return dispose(
      () => {
        this.#src.disconnect(this.#out);
        this.#src.stop();
        this.#src.disconnect(empty);
      },
      effect(() => {
        this.drawWaveform(this._type.value);
      })
    );
  };

  output = (
    <AudioPort value={this.#out} output />
  );

  _view = () => (
    <>
      <canvas
        ref={this.canvas}
        width={150}
        height={70} />

      <Select
        label="Type"
        variants={this._variants}
        value={this._type}
        change={v => this.#src.type = v}
      />

      <Range
        label="Freq"
        value={this._freq}
        accuracy={2}
        min={0}
        max={this.#src.frequency.maxValue}
        change={this.#src.frequency}
        postfix="HZ" />

      <Range
        label="Detune"
        value={this._detune}
        accuracy={0}
        min={-1200}
        max={1200}
        change={this.#src.detune}
        postfix="cents" />
    </>
  );
}