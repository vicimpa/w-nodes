import { computed, effect, signal } from "@preact/signals-react";
import { decodeMedia, mediaList, mediaRef, parseMediaRef } from "$library/media";
import { group, icon } from "../_groups";
import { prop, reactive } from "@vicimpa/decorators";

import { AudioPort } from "../ports/AudioPort";
import { BaseNode } from "../lib/BaseNode";
import { Canvas } from "$components/canvas";
import { Church } from "lucide-react";
import { Select } from "../lib/Select";
import { accentOf } from "../lib/accent";
import convolver from "../assets/convolver";
import { ctx } from "../ctx";
import { dispose } from "$library/dispose";
import { name } from "$library/function";
import { store } from "$components/node-editor";

const builtin = Object.keys(convolver);
const builtinVariants = builtin.map(value => ({
  value,
  label: value.split('/').at(-1)?.split('.').slice(0, -1).join('.'),
  group: 'Built-in',
}));

const normalizeVariants = [
  { value: true, label: 'On' },
  { value: false, label: 'Off' },
];

// Импульс: встроенный файл (./name.ogg) или файл из медиатеки (local:<hash>)
@name('Convolver')
@group('effect')
@icon(Church)
@reactive()
export default class extends BaseNode {
  #convolver = ctx.createConvolver();

  @store _type = signal(builtin[0]);
  @store _normalize = signal(this.#convolver.normalize);

  @prop buffer: AudioBuffer | null = null;

  // Меняется и когда пропавший файл появляется в медиатеке
  source = computed(() => {
    const hash = parseMediaRef(this._type.value);

    if (!hash)
      return this._type.value;

    return mediaList.value.some(item => item.hash === hash) ? this._type.value : '';
  });

  variants = computed(() => [
    ...builtinVariants,
    ...mediaList.value.map(item => ({ value: mediaRef(item.hash), label: item.name, group: 'My files' })),
    ...(this.source.value ? [] : [{ value: this._type.value, label: 'Missing file', group: 'My files' }]),
  ]);

  _connect = () => dispose(
    effect(() => {
      const source = this.source.value;
      const hash = parseMediaRef(source);
      var cancelled = false;

      this.buffer = null;

      const load = hash ? decodeMedia(hash, ctx) : convolver[source]?.(ctx) ?? Promise.resolve(null);

      load
        .then(buffer => {
          if (!cancelled)
            this.buffer = buffer;
        })
        .catch(console.error);

      return () => {
        cancelled = true;
      };
    }),
    effect(() => {
      // normalize применяется в момент назначения buffer
      this.#convolver.normalize = this._normalize.value;
      this.#convolver.buffer = this.buffer;
    })
  );

  input = (
    <AudioPort value={this.#convolver} />
  );

  output = (
    <AudioPort value={this.#convolver} output />
  );

  draw(c: CanvasRenderingContext2D, can: HTMLCanvasElement) {
    const { width, height } = can;

    c.clearRect(0, 0, width, height);

    if (!this.buffer)
      return;

    const data = this.buffer.getChannelData(0);
    const step = Math.max(1, Math.ceil(data.length / width));

    c.beginPath();
    c.moveTo(0, height / 2);

    for (let x = 0; x < width; x++) {
      var min = 0;
      var max = 0;

      for (let i = x * step, end = Math.min(i + step, data.length); i < end; i++) {
        if (data[i] < min) min = data[i];
        if (data[i] > max) max = data[i];
      }

      c.lineTo(x, (1 + min) * height / 2);
      c.lineTo(x, (1 + max) * height / 2);
    }

    c.strokeStyle = accentOf(can);
    c.stroke();
  }

  _view = () => (
    <>
      <Canvas width={300} height={50} draw={(c, can) => this.draw(c, can)} />
      {computed(() => (
        <Select
          key={this.variants.value.length}
          label="Impulse"
          value={this._type}
          variants={this.variants.value}
          groupBy={variant => variant.group}
        />
      ))}
      <Select label="Normalize" value={this._normalize} variants={normalizeVariants} />
    </>
  );
}
