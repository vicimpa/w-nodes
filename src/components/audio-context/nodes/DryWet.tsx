import { AudioPort } from "../ports/AudioPort";
import { BaseNode } from "../lib/BaseNode";
import { Range } from "../lib/Range";
import { ctx } from "../ctx";
import { name } from "$library/function";
import { signal } from "@preact/signals-react";
import { store } from "$library/store";

@name('DryWet')
export default class extends BaseNode {
  #a = ctx.createGain();
  #b = ctx.createGain();
  #out = ctx.createGain();

  @store _mix = signal(50);

  _connect = () => {
    this.#a.connect(this.#out);
    this.#b.connect(this.#out);

    return () => {
      this.#a.disconnect(this.#out);
      this.#b.disconnect(this.#out);
    };
  };

  input = (
    <>
      <AudioPort value={this.#a} />
      <AudioPort value={this.#b} />
    </>
  );

  output = (
    <AudioPort value={this.#out} output />
  );

  _view = () => (
    <>
      <Range
        label="Mix"
        min={0}
        max={100}
        postfix="%"
        value={this._mix}
        change={v => {
          this.#a.gain.value = (1 - (v / 50));
          this.#b.gain.value = ((v / 50));
        }}
      />
    </>
  );
}