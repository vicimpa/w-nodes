import { computed, signal } from "@preact/signals-react";

import { AudioPort } from "../ports/AudioPort";
import { BaseNode } from "../lib/BaseNode";
import { Select } from "../lib/Select";
import { SignalNode } from "../lib/signalNode";
import { Toggle } from "../lib/Toggle";
import { ctx } from "../ctx";
import { dispose } from "$library/dispose";
import { frames } from "$library/frames";
import { group } from "../_groups";
import { line } from "../lib/line";
import { name } from "$library/function";
import { signalRef } from "$library/signals";
import { store } from "$library/store";

@name('Analyzer')
@group('analyze')
export default class extends BaseNode {
  #node = new AnalyserNode(ctx);

  _data = new Uint8Array();

  @store _start = new SignalNode(1, { default: 1 });

  @store _type = signal(0);

  canRef = signalRef<HTMLCanvasElement>();
  ctxRef = computed(() => this.canRef.value?.getContext('2d'));

  _connect = () => {
    this.#node.fftSize = 1024;
    this._data = new Uint8Array(this.#node.frequencyBinCount);

    return dispose(
      frames(() => {
        const { value: can } = this.canRef;
        const { value: ctx } = this.ctxRef;

        if (!can || !ctx)
          return;

        if (!this._start.value)
          return;

        var { width, height } = can;
        var length = this._data.length;
        var scaleX = 1 / length;
        var scaleY = 1 / 255;

        if (this._type.value)
          this.#node.getByteTimeDomainData(this._data);
        else
          this.#node.getByteFrequencyData(this._data);

        ctx.resetTransform();
        ctx.clearRect(0, 0, width, height);
        ctx.setTransform(1, 0, 0, -1, 0, height);

        line(ctx, (m) => {
          for (let i = 0; i < length; i++) {
            m(i * scaleX * width, scaleY * this._data[i] * height);
          }
        }, { size: 2 });
      })
    );
  };

  input = (
    <AudioPort value={this.#node} />
  );

  _view = () => (
    <>
      <Toggle label="Start" value={this._start} />

      <canvas ref={this.canRef} width={200} height={70} />

      <Select
        label="Type"
        value={this._type}
        variants={[
          { value: 0, label: 'Frequency' },
          { value: 1, label: 'TimeDomain' }
        ]} />
    </>
  );
}