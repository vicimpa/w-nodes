import { computed, effect, signal } from "@preact/signals-react";
import { prop, reactive, signalRef } from "$library/signals";

import { AudioPort } from "../ports/AudioPort";
import { BaseNode } from "../lib/BaseNode";
import { Select } from "../lib/Select";
import convolver from "../assets/convolver";
import { ctx } from "../ctx";
import { dispose } from "$library/dispose";
import { name } from "$library/function";
import { store } from "$library/store";

const type = Object.keys(convolver);
const variants = type.map(value => ({ value, label: value.split('/').at(-1)?.split('.').slice(0, -1).join('.') }));

@name('Convolver')
@reactive()
export default class extends BaseNode {
  #convolver = ctx.createConvolver();

  @store _type = signal(type[0]);
  @store _normalize = signal(this.#convolver.normalize);

  @prop buffer: AudioBuffer | null = null;

  canRef = signalRef<HTMLCanvasElement>();
  ctxRef = computed(() => this.canRef.value?.getContext('2d'));

  _typeData = computed(() => convolver[this._type.value](ctx));

  _connect = () => dispose(
    this._typeData.subscribe(value => {
      this.buffer = null;
      value.then(buffer => {
        this.buffer = buffer;
      });
    }),
    effect(() => {
      this.#convolver.buffer = this.buffer;
      if (!this.buffer) return;
      this.drawWaveform(this.buffer);
    })
  );

  drawWaveform(audioBuffer: AudioBuffer) {
    const { value: can } = this.canRef;
    const { value: ctx } = this.ctxRef;

    if (!can || !ctx) return;

    const channelData = audioBuffer.getChannelData(0);
    const width = can.width;
    const height = can.height;

    ctx.clearRect(0, 0, width, height);

    ctx.beginPath();
    ctx.moveTo(0, height / 2);

    const step = Math.ceil(channelData.length / width);
    for (let i = 0; i < width; i++) {
      const min = Math.min(...channelData.slice(i * step, (i + 1) * step));
      const max = Math.max(...channelData.slice(i * step, (i + 1) * step));
      ctx.lineTo(i, (1 + min) * height / 2);
      ctx.lineTo(i, (1 + max) * height / 2);
    }

    ctx.strokeStyle = '#fff';
    ctx.stroke();
  }

  input = (
    <AudioPort value={this.#convolver} />
  );

  output = (
    <AudioPort value={this.#convolver} output />
  );

  _view = () => (
    <>
      <canvas ref={this.canRef} width={400} height={50} />
      <Select
        label="Type"
        value={this._type}
        variants={variants}
      />
    </>
  );
}