import { AudioLines, Play } from "lucide-react";
import { MediaSelect, importAudio, isAudioFile } from "../lib/MediaSelect";
import { decodeMedia, mediaList, mediaLoaded, parseMediaRef } from "$library/media";
import { computed, effect } from "@preact/signals-react";
import { group, icon } from "../_groups";
import { prop, reactive } from "@vicimpa/decorators";

import { AudioPort } from "../ports/AudioPort";
import { BaseNode } from "../lib/BaseNode";
import { Canvas } from "$components/canvas";
import { Range } from "../lib/Range";
import { Row } from "../lib/Row";
import SamplerProcessor from "../worklet/SamplerProcessor";
import { SignalNode } from "../lib/signalNode";
import { Toggle } from "../lib/Toggle";
import { accentOf } from "../lib/accent";
import { ctx } from "../ctx";
import { dispose } from "$library/dispose";
import { name } from "$library/function";
import s from "../styles.module.sass";
import { store } from "$components/node-editor";

@name('Sampler')
@group('io')
@icon(AudioLines)
@reactive()
export default class Sampler extends BaseNode {
  #processor = new SamplerProcessor();

  @prop @store media = '';
  @prop buffer: AudioBuffer | null = null;
  @prop status: '' | 'loading' | 'missing' = '';

  @store _trigger = new SignalNode(this.#processor.trigger, { min: 0, max: 1, default: 0 });
  @store _rate = new SignalNode(this.#processor.rate, { min: -4, max: 4, default: 1 });
  @store _start = new SignalNode(this.#processor.start, { min: 0, max: 1, default: 0 });
  @store _end = new SignalNode(this.#processor.end, { min: 0, max: 1, default: 1 });
  @store _loop = new SignalNode(this.#processor.loop, { min: 0, max: 1, default: 0 });
  @store _gain = new SignalNode(this.#processor.gain, { min: 0, max: 2, default: 1 });

  // Хэш файла, если он есть в медиатеке; меняется, когда пропавший файл появляется
  available = computed(() => {
    const hash = parseMediaRef(this.media);
    return hash && mediaList.value.some(item => item.hash === hash) ? hash : null;
  });

  _connect = () => dispose(
    effect(() => {
      const hash = this.available.value;
      var cancelled = false;

      this.buffer = null;
      this.#processor.props.channels = [];
      this.status = !this.media ? '' : hash || !mediaLoaded.value ? 'loading' : 'missing';

      if (hash) {
        decodeMedia(hash, ctx).then(buffer => {
          if (cancelled)
            return;

          this.status = buffer ? '' : 'missing';
          this.buffer = buffer;

          if (buffer)
            this.#processor.props.channels = Array.from(
              { length: Math.min(buffer.numberOfChannels, 2) },
              (_, i) => buffer.getChannelData(i)
            );
        });
      }

      return () => {
        cancelled = true;
      };
    }),
    () => this.#processor.destroy()
  );

  async load(file: File | null) {
    if (file && isAudioFile(file))
      this.media = await importAudio(file);
  }

  output = (
    <AudioPort value={this.#processor} output />
  );

  draw(c: CanvasRenderingContext2D, can: HTMLCanvasElement) {
    const { width, height } = can;
    const { buffer } = this;
    const accent = accentOf(can);

    c.clearRect(0, 0, width, height);

    if (!buffer) {
      c.fillStyle = '#7e7e7e';
      c.font = '12px "Fira Sans Condensed", sans-serif';
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.fillText(
        this.status === 'loading' ? 'Loading…' :
          this.status === 'missing' ? 'File is missing — drop it here' :
            'Drop an audio file here',
        width / 2,
        height / 2
      );
      return;
    }

    const data = buffer.getChannelData(0);
    const step = Math.max(1, Math.floor(data.length / width));

    c.fillStyle = accent;

    for (let x = 0; x < width; x++) {
      var min = 0;
      var max = 0;

      for (let i = x * step, end = Math.min(i + step, data.length); i < end; i++) {
        if (data[i] < min) min = data[i];
        if (data[i] > max) max = data[i];
      }

      c.fillRect(x, (1 - max) * height / 2, 1, Math.max(1, (max - min) * height / 2));
    }

    const start = Math.min(this._start.value, this._end.value) * width;
    const end = Math.max(this._start.value, this._end.value) * width;

    c.fillStyle = 'rgba(0, 0, 0, .6)';
    c.fillRect(0, 0, start, height);
    c.fillRect(end, 0, width - end, height);
    c.fillStyle = accent;
    c.fillRect(start, 0, 1, height);
    c.fillRect(end - 1, 0, 1, height);
  }

  _view = () => (
    <div
      style={{ display: 'contents' }}
      onDragOver={e => e.preventDefault()}
      onDrop={e => {
        e.preventDefault();
        e.stopPropagation();
        this.load(e.dataTransfer.files[0] ?? null);
      }}
    >
      <Canvas width={260} height={64} draw={(c, can) => this.draw(c, can)} />

      <MediaSelect get={() => this.media} set={ref => this.media = ref} />

      <Toggle label="Trigger" value={this._trigger} />
      <Row label="Preview">
        <button
          className={s.field}
          style={{ justifyContent: 'center', border: 'none' }}
          onMouseDown={() => this._trigger.value = 1}
          onMouseUp={() => this._trigger.value = 0}
          onMouseLeave={() => this._trigger.value = 0}
        >
          <Play size={12} fill="currentColor" /> Hold to play
        </button>
      </Row>
      <Range label="Rate" value={this._rate} accuracy={2} />
      <Range label="Start" value={this._start} accuracy={3} strict />
      <Range label="End" value={this._end} accuracy={3} strict />
      <Toggle label="Loop" value={this._loop} />
      <Range label="Gain" value={this._gain} accuracy={2} />
    </div>
  );
}
