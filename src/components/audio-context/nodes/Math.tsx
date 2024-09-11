import MathProcessor, { MathOperation, constants, custom, functions, math, operators, params, renamePorts } from "../worklet/MathProcessor";
import { computed, signal } from "@preact/signals-react";

import { AudioPort } from "../ports/AudioPort";
import { BaseNode } from "../lib/BaseNode";
import { Number } from "../lib/Number";
import { Select } from "../lib/Select";
import { SignalNode } from "../lib/signalNode";
import { dispose } from "$library/dispose";
import { group } from "../_groups";
import { name } from "$library/function";
import { store } from "$library/store";

const operations = Object.keys(math) as MathOperation[];
const _params = Object.keys(params) as (keyof typeof params)[];
const variants = operations.map((value) => {
  const func = math[value];
  const findRename = renamePorts.find(e => e.op.includes(value));
  const str = func.toString();
  const _args = Array.from({ length: func.length }, (_, i) => findRename?.ports[_params[i++]] ?? _params[i++]);
  var i = 0;
  const label = value in constants ? (
    value
  ) : value in operators ? (
    str.substring(str.indexOf('=>') + 2).replace(/\w/g, () => findRename?.ports[_params[i++]] ?? _params[i++])
  ) : `${value}(${_args.join(', ')})`;

  return ({
    value,
    label,
    group: value in constants ? 'Constants' : value in functions ? 'Functions' : value in custom ? 'Custom' : 'Operators'
  });
});

@name('Math')
@group('custom')
export default class extends BaseNode {
  #processor = new MathProcessor();

  @store _p = signal(this.#processor.props.type);

  @store _a = new SignalNode(this.#processor.a);
  @store _b = new SignalNode(this.#processor.b);
  @store _c = new SignalNode(this.#processor.c);
  @store _d = new SignalNode(this.#processor.d);
  @store _e = new SignalNode(this.#processor.e);

  _connect = () => dispose(
    () => this.#processor.destroy()
  );

  output = (
    <AudioPort value={this.#processor} output />
  );

  _inputs = computed(() => {
    const func = math[this._p.value];

    return Array.from({ length: func.length }, (_, i) => {
      const value = this._p.value;
      const key = _params[i];
      const param = this[`_${key}`];
      const findRename = renamePorts.find(e => e.op.includes(value));
      var label = `${key}`;

      if (findRename)
        label = findRename.ports[key] ?? label;

      return <Number key={`${key}`} label={label} value={param} />;
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
