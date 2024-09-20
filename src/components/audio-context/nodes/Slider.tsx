import { BaseNode } from "../lib/BaseNode";
import { Range } from "../lib/Range";
import { SignalNode } from "../lib/signalNode";
import { SignalPort } from "../ports/SignalPort";
import { group } from "../_groups";
import { name } from "$library/function";
import { store } from "$components/node-editor";

@name('Slider')
@group('controll')
export default class extends BaseNode {
  @store _value = new SignalNode(0, { min: 0, max: 1 });

  output = (
    <SignalPort value={this._value} output />
  );

  _view = () => (
    <Range label="Value" value={this._value} accuracy={10} />
  );
}