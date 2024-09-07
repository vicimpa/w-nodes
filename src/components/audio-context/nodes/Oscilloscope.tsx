import { computed, signal } from "@preact/signals-react";

import { AudioPort } from "../ports/AudioPort";
import { BaseNode } from "../lib/BaseNode";
import { PI2 } from "$library/math";
import { SignalNode } from "../lib/signalNode";
import { Toggle } from "../lib/Toggle";
import { ctx } from "../ctx";
import { dispose } from "$library/dispose";
import { dom } from "$library/dom";
import { frames } from "$library/frames";
import { name } from "$library/function";
import { pipe } from "../lib/pipe";
import { signalRef } from "$library/signals";
import { store } from "$library/store";

@name('Oscilloscope')
export default class extends BaseNode {
  #node = ctx.createChannelSplitter(2); // Создаем мерджер для стерео

  #nodeLeft = new AnalyserNode(ctx, { fftSize: 2048 });
  #nodeRight = new AnalyserNode(ctx, { fftSize: 2048 });

  _buff = dom('canvas', {});
  _buffCtx = this._buff.getContext('2d')!;
  _dataX = new Float32Array(this.#nodeLeft.frequencyBinCount);
  _dataY = new Float32Array(this.#nodeRight.frequencyBinCount);

  @store _type = signal(0);
  @store _swap = new SignalNode(0, { default: 0 });
  @store _invert = new SignalNode(0, { default: 0 });

  canRef = signalRef<HTMLCanvasElement>();
  ctxRef = computed(() => this.canRef.value?.getContext('2d'));

  _connect = () => {
    return dispose(
      pipe(this.#node, this.#nodeLeft, 0, 0),
      pipe(this.#node, this.#nodeRight, 1, 0),
      frames(() => {
        const { value: can } = this.canRef;
        const { value: ctx } = this.ctxRef;

        if (!can || !ctx)
          return;

        const { width, height } = can;
        const bufferLength = this._dataX.length;
        const leftChannelData = this._dataX;
        const rightChannelData = this._dataY;

        this.#nodeLeft.getFloatTimeDomainData(leftChannelData);
        this.#nodeRight.getFloatTimeDomainData(rightChannelData);

        this._buff.width = can.width = width;
        this._buff.height = can.height = height;
        ctx.clearRect(0, 0, width, height);
        this._buffCtx.clearRect(0, 0, width, height);
        this._buffCtx.globalAlpha = .7;
        this._buffCtx.drawImage(can, 0, 0);
        ctx.putImageData(this._buffCtx.getImageData(0, 0, width, height), 0, 0);

        ctx.lineWidth = 1;
        ctx.fillStyle = '#fff';
        ctx.strokeStyle = '#fff';

        ctx.beginPath();
        var sX = 0;
        var sY = 0;
        var inv = this._invert.value ? -1 : 1;
        var swap = this._swap.value && 1;

        for (let i = 0; i < bufferLength; i++) {
          var vX = leftChannelData[i];
          var vY = rightChannelData[i];

          if (swap) {
            [vX, vY] = [vY, vX];
            vY *= inv;
          }

          var yX = (vX + 1) * height / 2;
          var yY = (vY + 1) * height / 2;


          if (i === 0) {
            ctx.moveTo(yX, yY);
          } else {
            ctx.lineTo(yX, yY);
          }

          sX += yX;
          sY += yY;
        }
        ctx.stroke();
        ctx.closePath();

        for (let i = 0; i < bufferLength; i++) {
          var vX = leftChannelData[i];
          var vY = rightChannelData[i];

          if (swap) {
            [vX, vY] = [vY, vX];
            vY *= inv;
          }

          var yX = (vX + 1) * height / 2;
          var yY = (vY + 1) * height / 2;

          ctx.beginPath();
          ctx.arc(yX, yY, 1, 0, PI2);
          ctx.fill();
          ctx.closePath();
        }
      })
    );
  };

  input = (
    <AudioPort value={this.#node} />
  );

  _view = () => (
    <>
      <canvas ref={this.canRef} width={200} height={200} />
      <Toggle value={this._swap} label="Swap" />
      <Toggle value={this._invert} label="Invert" />
    </>
  );
}