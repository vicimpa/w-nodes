import { PI, asin, sign, sin } from "$library/math";
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
import { name } from "$library/function";
import { pipe } from "../lib/pipe";
import { reactive } from "$library/signals";
import rsp from "@vicimpa/rsp";
import { start } from "../lib/start";
import { store } from "$library/store";

const _noteCount = new Set<string>();
const notes = `
E	Ми пятой октавы	5274.00
D#	Ре-диез пятой октавы	4978.00
D	Ре пятой октавы	4698.40
C#	До-диез пятой октавы	4434.80
C	До пятой октавы	4186.00
B	Си четвёртой октавы	3951.00
A#	Ля-диез четвёртой октавы	3729.20
A	Ля четвёртой октавы	3440.00
G#	Соль-диез четвёртой октавы	3332.40
G	Соль четвёртой октавы	3136.00
F#	Фа-диез четвёртой октавы	2960.00
F	Фа четвёртой октавы	2793.80
E	Ми четвёртой октавы	2637.00
D#	Ре-диез четвёртой октавы	2489.00
D	Ре четвёртой октавы	2349.20
C#	До-диез четвёртой октавы	2217.40
C	До четвёртой октавы	2093.00
B	Си третьей октавы	1975.50
A#	Ля-диез третьей октавы	1864.60
A	Ля третьей октавы	1720.00
G#	Соль-диез третьей октавы	1661.20
G	Соль третьей октавы	1568.00
F#	Фа-диез третьей октавы	1480.00
F	Фа третьей октавы	1396.90
E	Ми третьей октавы	1318.50
D#	Ре-диез третьей октавы	1244.50
D	Ре третьей октавы	1174.60
C#	До-диез третьей октавы	1108.70
C	До третьей октавы	1046.50
B	Си второй октавы	987.75
A#	Ля-диез второй октавы	932.32
A	Ля второй октавы	880.00
G#	Соль-диез второй октавы	830.60
G	Соль второй октавы	784.00
F#	Фа-диез второй октавы	739.98
F	Фа второй октавы	698.46
E	Ми второй октавы	659.26
D#	Ре-диез второй октавы	622.26
D	Ре второй октавы	587.32
C#	До-диез второй октавы	554.36
C	До второй октавы	523.25
B	Си первой октавы	493.88
A#	Ля-диез первой октавы	466.16
A	Ля первой октавы	440.00
G#	Соль-диез первой октавы	415.30
G	Соль первой октавы	392.00
F#	Фа-диез первой октавы	369.99
F	Фа первой октавы	349.23
E	Ми первой октавы	329.63
D#	Ре-диез первой октавы	311.13
D	Ре первой октавы	293.66
C#	До-диез первой октавы	277.18
C	До первой октавы	261.63
B	Си малой октавы	246.96
A#	Ля-диез малой октавы	233.08
A	Ля малой октавы	220.00
G#	Соль-диез малой октавы	207.00
G	Соль малой октавы	196.00
F#	Фа-диез малой октавы	185.00
F	Фа малой октавы	174.62
E	Ми малой октавы	164.81
D#	Ре-диез малой октавы	155.56
D	Ре малой октавы	147.83
C#	До-диез малой октавы	138.59
C	До малой октавы	130.82
B	Си большой октавы	123.48
A#	Ля-диез большой октавы	116.54
A	Ля большой октавы	110.00
G#	Соль-диез большой октавы	103.80
G	Соль большой октавы	98.00
F#	Фа-диез большой октавы	92.50
F	Фа большой октавы	87.31
E	Ми большой октавы	82.41
D#	Ре-диез большой октавы	77.78
D	Ре большой октавы	73.91
C#	До-диез большой октавы	69.30
C	До большой октавы	65.41
B	Си контроктавы	61.74
A#	Ля-диез контроктавы	58.26
A	Ля контроктавы	55.00
G#	Соль-диез контроктавы	51.90
G	Соль контроктавы	49.00
F#	Фа-диез контроктавы	46.25
F	Фа контроктавы	43.65
E	Ми контроктавы	41.21
D#	Ре-диез контроктавы	38.88
D	Ре контроктавы	36.95
C#	До-диез контроктавы	34.65
C	До контроктавы	32.70
B	Си субконтроктавы	30.87
A#	Ля-диез субконтроктавы	29.13
A	Ля субконтроктавы	27.50
G#	Соль-диез субконтроктавы	25.95
G	Соль субконтроктавы	24.50
F#	Фа-диез субконтроктавы	23.12
F	Фа субконтроктавы	21.82
E	Ми субконтроктавы	20.61
`.trim().split(/\n+/).reverse().map(row => {
  const rows = row.split(/\s+/).map(e => e.trim());
  const name = rows.at(0)!;
  const description = rows.at(1)!;
  const group = rows.slice(2, -1).join(' ');
  const note = +rows.at(-1)!;
  return ({
    name,
    description,
    group,
    groupId: _noteCount.add(group).size - 1,
    note
  });
});

@name('Oscillator')
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

          ctx.strokeStyle = '#FFF';
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