import { BaseNode } from "../lib/BaseNode";
import { Range } from "../lib/Range";
import { SignalPort } from "../ports/SignalPort";
import { name } from "$library/function";
import { signal } from "@preact/signals-react";
import { store } from "$library/store";

@name('Value')
export default class extends BaseNode {
  @store _value = signal(.5);

  output = (
    <SignalPort value={this._value} output />
  );

  _view = () => (
    <Range label="Value" value={this._value} min={0} max={1} accuracy={10} noPort />
  );
}