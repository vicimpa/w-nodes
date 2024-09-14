import { BaseNode } from "../lib/BaseNode";
import { SignalNode } from "../lib/signalNode";
import { SignalPort } from "../ports/SignalPort";
import { Toggle } from "../lib/Toggle";
import { group } from "../_groups";
import { name } from "$library/function";
import { store } from "$library/store";

@name('Toggle')
@group('controll')
export default class extends BaseNode {
  @store _toggle = new SignalNode(0, { default: 0 });

  output = (
    <SignalPort value={this._toggle} output />
  );

  _view = () => (
    <>
      <Toggle label="Value" value={this._toggle} />
    </>
  );
}