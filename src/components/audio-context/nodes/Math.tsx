import MathProcessor, { MathOperation, constants, functions, math, operators, params } from "../worklet/MathProcessor";
import { computed, signal } from "@preact/signals-react";

import { AudioPort } from "../ports/AudioPort";
import { BaseNode } from "../lib/BaseNode";
import { Number } from "../lib/Number";
import { Select } from "../lib/Select";
import { SignalNode } from "../lib/signalNode";
import { name } from "$library/function";
import { store } from "$library/store";

const operations = Object.keys(math) as MathOperation[];
const _params = Object.keys(params) as (keyof typeof params)[];
const variants = operations.map((value) => {
  const func = math[value];
  const str = func.toString();
  const _args = Array.from({ length: func.length }, (_, i) => _params[i]);
  const label = value in constants ? (
    value
  ) : value in operators ? (
    str.substring(str.indexOf('=>') + 2)
  ) : `${value}(${_args.join(', ')})`;

  return ({
    value,
    label,
    group: value in constants ? 'Constants' : value in functions ? 'Functions' : 'Operators'
  });
});

@name('Math')
export default class extends BaseNode {
  #processor = new MathProcessor();

  @store _p = signal(this.#processor.props.type);

  @store _a = new SignalNode(this.#processor.a);
  @store _b = new SignalNode(this.#processor.b);
  @store _c = new SignalNode(this.#processor.c);

  output = (
    <AudioPort value={this.#processor} output />
  );

  _inputs = computed(() => {
    const func = math[this._p.value];

    return Array.from({ length: func.length }, (_, i) => {
      const key = _params[i];
      const param = this[`_${key}`];
      return <Number key={`${key}`} label={`${key}`} value={param} />;
    });
  });

  _view = () => (
    <>
      <Select
        label="Operator"
        value={this._p}
        variants={variants}
        groupBy={e => e.group}
        change={v => this.#processor.props.type = v} />

      {this._inputs}
    </>
  );
}
