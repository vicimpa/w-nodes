import { accentOf } from "../lib/accent";
import { PI, asin, floor, sign, sin } from "@vicimpa/math";
import { computed, signal } from "@preact/signals-react";
import { ctx, empty } from "../ctx";

import { AudioPort } from "../ports/AudioPort";
import { BaseNode } from "../lib/BaseNode";
import { Canvas } from "$components/canvas";
import { Range } from "../lib/Range";
import { Select } from "../lib/Select";
import { SignalNode } from "../lib/signalNode";
import { Toggle } from "../lib/Toggle";
import { dispose } from "$library/dispose";
import { group, icon } from "../_groups";
import { AudioWaveform } from "lucide-react";
import { name } from "$library/function";
import { pipe } from "../lib/pipe";
import { reactive } from "@vicimpa/decorators";
import rsp from "@vicimpa/rsp";
import { start } from "../lib/start";
import { store } from "$components/node-editor";

const noteNames = [
  ['C', 'До'],
  ['C#', 'До-диез'],
  ['D', 'Ре'],
  ['D#', 'Ре-диез'],
  ['E', 'Ми'],
  ['F', 'Фа'],
  ['F#', 'Фа-диез'],
  ['G', 'Соль'],
  ['G#', 'Соль-диез'],
  ['A', 'Ля'],
  ['A#', 'Ля-диез'],
  ['B', 'Си'],
] as const;

const octaveNames = [
  'субконтроктавы',
  'контроктавы',
  'большой октавы',
  'малой октавы',
  'первой октавы',
  'второй октавы',
  'третьей октавы',
  'четвёртой октавы',
  'пятой октавы',
];

// MIDI 16 (E0, 20.6 Hz) .. 112 (E8, 5274 Hz)
const notes = Array.from({ length: 97 }, (_, i) => {
  const midi = 16 + i;
  const [name, description] = noteNames[midi % 12];

  return {
    name,
    description,
    group: octaveNames[floor(midi / 12) - 1],
    note: +(440 * 2 ** ((midi - 69) / 12)).toFixed(2)
  };
});

@name('Oscillator')
@group('io')
@icon(AudioWaveform)
@reactive()
export default class extends BaseNode {
  #src = ctx.createOscillator();
  #out = new GainNode(ctx, { gain: 0 });

  @store _type = signal(this.#src.type as keyof typeof this._waves);
  @store _freq = new SignalNode(this.#src.frequency, { min: 0 });
  @store _detune = new SignalNode(this.#src.detune, { min: -1200, max: 1200 });
  @store _active = new SignalNode(this.#out.gain, { default: 0 });

  blockNoteSelect = computed(() => this._freq.connected);

  _waves = {
    sine: (t: number) => sin(t),
    square: (t: number) => sign(sin(t)),
    triangle: (t: number) => 2 / PI * asin(sin(t)),
    sawtooth: (t: number) => (t / PI) % 2 - 1
  } as const;

  _variants = Object.keys(this._waves).map(value => ({
    value: value as keyof typeof this._waves
  }));

  head = (
    <rsp.select
      value={this._freq}
      onKeyDown={e => e.preventDefault()}
      onChange={e => {
        const find = notes.find(j => j.note === +e.currentTarget.value);

        if (find) {
          this._freq.value = find.note;
          this._detune.value = 0;
        }
      }}
      disabled={this.blockNoteSelect}
    >
      <option >Select note</option>
      {
        [...Map.groupBy(notes, (note) => note.group)].map(([group, items], index) => (
          <optgroup label={group} key={index}>
            {items.map((item, key) => (
              <option value={item.note} key={key}>{item.name} ({item.description})</option>
            ))}
          </optgroup>
        ))

      }
    </rsp.select>
  );

  _connect = () => dispose(
    pipe(this.#src, empty),
    pipe(this.#src, this.#out),
    start(this.#src),
  );

  output = (
    <AudioPort value={this.#out} output />
  );

  _view = () => (
    <>
      <Toggle value={this._active} label="Start" />

      <Canvas
        width={150}
        height={70}
        draw={(ctx, can) => {
          const width = can.width;
          const height = can.height;

          ctx.clearRect(0, 0, width, height);

          const waveData = new Float32Array(width * 10);

          for (let i = 0; i < waveData.length; i++) {
            const t = (i / waveData.length * 2) * (2 * Math.PI);
            waveData[i] = this._waves[this._type.value]?.(t);
          }

          ctx.beginPath();
          ctx.moveTo(0, height / 2);

          for (let i = 0; i < waveData.length; i++) {
            const x = (i / waveData.length) * width;
            const y = (height * .5) - (waveData[i] * (height * .4));
            ctx.lineTo(x, y);
          }

          ctx.strokeStyle = accentOf(can);
          ctx.lineWidth = 4;
          ctx.stroke();
        }} />

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
        postfix="HZ" />

      <Range
        label="Detune"
        value={this._detune}
        accuracy={0}
        postfix="cents" />
    </>
  );
}