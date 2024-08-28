import { effect, signal } from "@preact/signals-react";

import { AudioPort } from "../../ports/AudioPort";
import { BaseNode } from "../../base/base-node";
import { ctx } from "../../ctx";
import { dispose } from "$library/dispose";
import rsp from "@vicimpa/rsp";

export { ctx };

export class Gain extends BaseNode {
  _gain = ctx.createGain();
  title = 'Gain';

  __store = {
    volume: signal('1')
  };

  __mount = () => {

    return dispose(
      effect(() => {
        this._gain.gain.value = +this.__store.volume.value;
      })
    );
  };

  input = [
    <AudioPort data-title="in" data-value={this._gain} />
  ];

  output = [
    <AudioPort data-title="out" output data-value={this._gain} />
  ];

  main = [
    <rsp.input
      type="range"
      min={0}
      max={1.5}
      step={0.00000001}
      bind-value={this.__store.volume}
    />
  ];
}