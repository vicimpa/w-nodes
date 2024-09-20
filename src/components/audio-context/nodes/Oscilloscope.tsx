import { AudioPort } from "../ports/AudioPort";
import { BaseNode } from "../lib/BaseNode";
import { Canvas } from "$components/canvas";
import { PI2 } from "@vicimpa/math";
import { SignalNode } from "../lib/signalNode";
import { Toggle } from "../lib/Toggle";
import { ctx } from "../ctx";
import { dispose } from "$library/dispose";
import { group } from "../_groups";
import { name } from "$library/function";
import { pipe } from "../lib/pipe";
import { signal } from "@preact/signals-react";
import { store } from "$components/node-editor";

@name('Oscilloscope')
@group('analyze')
export default class extends BaseNode {
  #node = ctx.createChannelSplitter(2); // Создаем мерджер для стерео

  #nodeLeft = new AnalyserNode(ctx);
  #nodeRight = new AnalyserNode(ctx);

  @store _start = new SignalNode(1, { default: 1 });

  _dataX = new Float32Array(this.#nodeLeft.frequencyBinCount);
  _dataY = new Float32Array(this.#nodeRight.frequencyBinCount);

  @store _type = signal(0);
  @store _swap = new SignalNode(0, { default: 0 });
  @store _invert = new SignalNode(0, { default: 0 });

  _connect = () => {
    this.#nodeLeft.fftSize = 2048;
    this.#nodeRight.fftSize = 2048;
    return dispose(
      pipe(this.#node, this.#nodeLeft, 0, 0),
      pipe(this.#node, this.#nodeRight, 1, 0)
    );
  };

  input = (
    <AudioPort value={this.#node} />
  );

  _view = () => (
    <>
      <Toggle label="Start" value={this._start} />
      <Canvas
        width={200}
        height={200}
        loop={({ can, ctx }) => {
          const { width, height } = can;
          const bufferLength = this._dataX.length;
          const leftChannelData = this._dataX;
          const rightChannelData = this._dataY;

          if (!this._start.value)
            return;

          this.#nodeLeft.getFloatTimeDomainData(leftChannelData);
          this.#nodeRight.getFloatTimeDomainData(rightChannelData);

          ctx.clearRect(0, 0, width, height);

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
              vX *= inv;
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
              vX *= inv;
              vY *= inv;
            }

            var yX = (vX + 1) * height / 2;
            var yY = (vY + 1) * height / 2;

            ctx.beginPath();
            ctx.arc(yX, yY, 1, 0, PI2);
            ctx.fill();
            ctx.closePath();
          }
        }} />
      <Toggle value={this._swap} label="Swap" />
      <Toggle value={this._invert} label="Invert" />
    </>
  );
}