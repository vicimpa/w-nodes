import { AudioPort } from "../ports/AudioPort";
import { BaseNode } from "../lib/BaseNode";
import { Range } from "../lib/Range";
import { ctx } from "../ctx";
import { name } from "$library/function";
import { signal } from "@preact/signals-react";
import { store } from "$library/store";

@name('Gain')
export default class extends BaseNode {
  #gain = ctx.createGain();

  @store _gain = signal(this.#gain.gain.value * 100);

  input = (
    <AudioPort value={this.#gain} />
  );

  output = (
    <AudioPort value={this.#gain} output />
  );

  _view = () => (
    <>
      <Range
        label="Gain"
        min={0}
        max={150}
        postfix="%"
        value={this._gain}
        change={e => this.#gain.gain.value = e / 100}
      />
    </>
  );
}