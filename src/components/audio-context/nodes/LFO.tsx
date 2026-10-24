import { LfoShape, modulation } from "$library/modulation";
import { effect, signal } from "@preact/signals-react";
import { group, icon } from "../_groups";

import { AudioPort } from "../ports/AudioPort";
import { BaseNode } from "../lib/BaseNode";
import { Canvas } from "$components/canvas";
import LfoProcessor from "../worklet/LfoProcessor";
import { Range } from "../lib/Range";
import { Select } from "../lib/Select";
import { SignalNode } from "../lib/signalNode";
import { Pulse } from "../lib/Pulse";
import { Waves } from "lucide-react";
import { accentOf } from "../lib/accent";
import { dispose } from "$library/dispose";
import { line } from "../lib/line";
import { name } from "$library/function";
import { store } from "$components/node-editor";

const variants: { value: LfoShape, label: string; }[] = [
  { value: 'sine', label: 'Sine' },
  { value: 'triangle', label: 'Triangle' },
  { value: 'square', label: 'Square' },
  { value: 'saw', label: 'Saw' },
  { value: 'ramp-down', label: 'Ramp down' },
  { value: 'random', label: 'Sample & hold' },
];

// Фиксированные «случайные» ступени для превью S&H
const previewHeld = [0.6, -0.4, 0.9, -0.8];
const cycles = 2;

@name('LFO')
@group('time')
@icon(Waves)
export default class extends BaseNode {
  #processor = new LfoProcessor();

  @store _shape = signal<LfoShape>(this.#processor.props.shape);
  @store _rate = new SignalNode(this.#processor.rate, { min: 0, max: 20, default: 1 });
  @store _depth = new SignalNode(this.#processor.depth, { min: 0, max: 1, default: 1 });
  @store _offset = new SignalNode(this.#processor.offset, { min: -1, max: 1, default: 0 });
  @store _phase = new SignalNode(this.#processor.phase, { min: 0, max: 1, default: 0 });
  @store _sync = new SignalNode(this.#processor.sync, { min: 0, max: 1, default: 0 });

  _connect = () => dispose(
    effect(() => {
      this.#processor.props.shape = this._shape.value;
    }),
    () => this.#processor.destroy()
  );

  output = (
    <AudioPort value={this.#processor} output />
  );

  draw(c: CanvasRenderingContext2D, can: HTMLCanvasElement) {
    const { width, height } = can;
    const shape = this._shape.value;
    const phase = this._phase.value;
    const pad = 6;
    const y = (v: number) => height / 2 - v * (height / 2 - pad);

    c.clearRect(0, 0, width, height);

    line(c, m => {
      m(0, height / 2);
      m(width, height / 2);
    }, { color: accentOf(can, 0.25) });

    line(c, m => {
      for (let x = 0; x <= width; x++) {
        const p = x / width * cycles + phase;
        const held = previewHeld[Math.floor(p) % previewHeld.length];
        m(x, y(modulation.lfoShape(shape, p, held)));
      }
    }, { size: 2 });
  }

  _view = () => (
    <>
      <Canvas width={150} height={60} draw={(c, can) => this.draw(c, can)} />

      <Select label="Shape" value={this._shape} variants={variants} />
      <Range label="Rate" value={this._rate} accuracy={2} postfix="HZ" />
      <Range label="Depth" value={this._depth} accuracy={2} />
      <Range label="Offset" value={this._offset} accuracy={2} />
      <Range label="Phase" value={this._phase} accuracy={2} strict />
      <Pulse label="Sync" value={this._sync} text="Restart" />
    </>
  );
}
