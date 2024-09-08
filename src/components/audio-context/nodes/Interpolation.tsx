import InterpolationProcessor, { FunctionType, functions } from "../worklet/InterpolationProcessor";

import { AudioPort } from "../ports/AudioPort";
import { BaseNode } from "../lib/BaseNode";
import { Range } from "../lib/Range";
import { Select } from "../lib/Select";
import { SignalNode } from "../lib/signalNode";
import { SignalPort } from "../ports/SignalPort";
import { name } from "$library/function";
import { signal } from "@preact/signals-react";
import { store } from "$library/store";

const types = Object.keys(functions) as FunctionType[];
const variants = types.map(value => ({ value }));

@name('Interpolation')
export default class extends BaseNode {
  #processor = new InterpolationProcessor();

  _input = new SignalNode(this.#processor.value);

  @store _type = signal(this.#processor.props.type);
  @store _frames = new SignalNode(this.#processor.frames, { min: 1, max: 100000 });

  input = (
    <SignalPort value={this._input} />
  );

  output = (
    <AudioPort value={this.#processor} output />
  );

  _view = () => (
    <>
      <Select
        label="Type"
        value={this._type}
        variants={variants}
        change={v => this.#processor.props.type = v} />

      <Range
        label="Frames"
        value={this._frames}
        strict
      />
    </>
  );
}