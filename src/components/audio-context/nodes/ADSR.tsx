import { group, icon } from "../_groups";

import AdsrProcessor from "../worklet/AdsrProcessor";
import { AudioPort } from "../ports/AudioPort";
import { BaseNode } from "../lib/BaseNode";
import { Canvas } from "$components/canvas";
import { Pulse } from "../lib/Pulse";
import { Range } from "../lib/Range";
import { SignalNode } from "../lib/signalNode";
import { TrendingUp } from "lucide-react";
import { accentOf } from "../lib/accent";
import { dispose } from "$library/dispose";
import { name } from "$library/function";
import { store } from "$components/node-editor";

@name('ADSR')
@group('time')
@icon(TrendingUp)
export default class extends BaseNode {
  #processor = new AdsrProcessor();

  @store _gate = new SignalNode(this.#processor.gate, { min: 0, max: 1, default: 0 });
  @store _attack = new SignalNode(this.#processor.attack, { min: 0, max: 2, default: 0.01 });
  @store _decay = new SignalNode(this.#processor.decay, { min: 0, max: 2, default: 0.2 });
  @store _sustain = new SignalNode(this.#processor.sustain, { min: 0, max: 1, default: 0.6 });
  @store _release = new SignalNode(this.#processor.release, { min: 0, max: 4, default: 0.4 });
  @store _peak = new SignalNode(this.#processor.peak, { min: 0, max: 1, default: 1 });

  _connect = () => dispose(
    () => this.#processor.destroy()
  );

  output = (
    <AudioPort value={this.#processor} output />
  );

  // Форма огибающей; уровни — в долях peak, sustain показан на трети общего времени
  draw(c: CanvasRenderingContext2D, can: HTMLCanvasElement) {
    const { width, height } = can;
    const a = Math.max(this._attack.value, 0);
    const d = Math.max(this._decay.value, 0);
    const r = Math.max(this._release.value, 0);
    const s = Math.min(Math.max(this._sustain.value, 0), 1);
    const hold = (a + d + r) / 3 || 1;
    const total = a + d + hold + r;
    const pad = 6;
    const x = (t: number) => pad + t / total * (width - pad * 2);
    const y = (v: number) => height - pad - v * (height - pad * 2);

    const points: [number, number][] = [
      [0, 0],
      [a, 1],
      [a + d, s],
      [a + d + hold, s],
      [total, 0],
    ];

    c.clearRect(0, 0, width, height);
    c.beginPath();
    points.forEach(([t, v], i) => i ? c.lineTo(x(t), y(v)) : c.moveTo(x(t), y(v)));
    c.lineJoin = 'round';
    c.lineWidth = 2;
    c.strokeStyle = accentOf(can);
    c.stroke();
    c.lineTo(x(0), y(0));
    c.fillStyle = accentOf(can, 0.15);
    c.fill();
  }

  _view = () => (
    <>
      <Canvas width={150} height={60} draw={(c, can) => this.draw(c, can)} />

      <Pulse label="Gate" value={this._gate} text="Hold" />
      <Range label="Attack" value={this._attack} accuracy={3} postfix="S" />
      <Range label="Decay" value={this._decay} accuracy={3} postfix="S" />
      <Range label="Sustain" value={this._sustain} accuracy={2} strict />
      <Range label="Release" value={this._release} accuracy={3} postfix="S" />
      <Range label="Peak" value={this._peak} accuracy={2} />
    </>
  );
}
