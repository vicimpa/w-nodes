import MathProcessor, { MathOperation, math } from "../worklet/MathProcessor";

import { AudioPort } from "../ports/AudioPort";
import { BaseNode } from "../lib/BaseNode";
import { Number } from "../lib/Number";
import { Select } from "../lib/Select";
import { SignalNode } from "../lib/signalNode";
import { name } from "$library/function";
import { signal } from "@preact/signals-react";
import { store } from "$library/store";

const operators = Object.keys(math) as MathOperation[];
const variants = operators.map((value) => ({ value }));

@name('Operation')
export default class extends BaseNode {
  #processor = new MathProcessor();

  @store _p = signal(operators[0]);
  @store _a = new SignalNode(this.#processor.a);
  @store _b = new SignalNode(this.#processor.b);

  output = (
    <AudioPort value={this.#processor} output />
  );

  _view = () => (
    <>
      <Select
        label="Operator"
        value={this._p}
        variants={variants}
        change={v => this.#processor.props.type = v} />

      <Number label="a" value={this._a} />
      <Number label="b" value={this._b} />
    </>
  );
}
