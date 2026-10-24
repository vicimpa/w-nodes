import { group, icon } from "../_groups";

import { AudioPort } from "../ports/AudioPort";
import { BaseNode } from "../lib/BaseNode";
import CounterProcessor from "../worklet/CounterProcessor";
import { Hash } from "lucide-react";
import { Number } from "../lib/Number";
import { Pulse } from "../lib/Pulse";
import { SignalNode } from "../lib/signalNode";
import { dispose } from "$library/dispose";
import { name } from "$library/function";
import { store } from "$components/node-editor";

@name('Counter')
@group('math')
@icon(Hash)
export default class extends BaseNode {
  #processor = new CounterProcessor();

  @store _trigger = new SignalNode(this.#processor.trigger, { min: 0, max: 1, default: 0 });
  @store _step = new SignalNode(this.#processor.step, { default: 1 });
  @store _reset = new SignalNode(this.#processor.reset, { min: 0, max: 1, default: 0 });
  @store _modulo = new SignalNode(this.#processor.modulo, { min: 0, default: 0 });

  _connect = () => dispose(
    () => this.#processor.destroy()
  );

  output = (
    <AudioPort value={this.#processor} output />
  );

  _view = () => (
    <>
      <Pulse label="Trigger" value={this._trigger} text="Count" />
      <Number label="Step" value={this._step} />
      <Pulse label="Reset" value={this._reset} text="Reset" />
      <Number label="Modulo" value={this._modulo} />
    </>
  );
}
