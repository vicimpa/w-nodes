import { group, icon } from "../_groups";

import { AudioPort } from "../ports/AudioPort";
import { BaseNode } from "../lib/BaseNode";
import { Dices } from "lucide-react";
import { Number } from "../lib/Number";
import { Pulse } from "../lib/Pulse";
import RandomProcessor from "../worklet/RandomProcessor";
import { SignalNode } from "../lib/signalNode";
import { dispose } from "$library/dispose";
import { name } from "$library/function";
import { store } from "$components/node-editor";

@name('Random')
@group('math')
@icon(Dices)
export default class extends BaseNode {
  #processor = new RandomProcessor();

  @store _trigger = new SignalNode(this.#processor.trigger, { min: 0, max: 1, default: 0 });
  @store _from = new SignalNode(this.#processor.from, { default: 0 });
  @store _to = new SignalNode(this.#processor.to, { default: 1 });
  @store _step = new SignalNode(this.#processor.step, { min: 0, default: 0 });

  _connect = () => dispose(
    () => this.#processor.destroy()
  );

  output = (
    <AudioPort value={this.#processor} output />
  );

  _view = () => (
    <>
      <Pulse label="Trigger" value={this._trigger} text="Next" />
      <Number label="From" value={this._from} />
      <Number label="To" value={this._to} />
      <Number label="Step" value={this._step} />
    </>
  );
}
