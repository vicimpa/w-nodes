import { AudioPort } from "../ports/AudioPort";
import { BaseNode } from "../lib/BaseNode";
import { Number } from "../lib/Number";
import { SignalNode } from "../lib/signalNode";
import TimerProcessor from "../worklet/TimerProcessor";
import { Toggle } from "../lib/Toggle";
import { dispose } from "$library/dispose";
import { group } from "../_groups";
import { name } from "$library/function";
import { reactive } from "$library/signals";
import { store } from "$library/store";

@name('Timer')
@group('custom')
@reactive()
export default class extends BaseNode {
  #src = new TimerProcessor();

  @store _start = new SignalNode(this.#src.start, { default: 0, min: 0, max: 1 });
  @store _loop = new SignalNode(this.#src.loop, { default: 0, min: 0 });
  @store _speed = new SignalNode(this.#src.speed, { default: 1, min: 0 });
  @store _revert = new SignalNode(this.#src.revert, { default: 1, min: 0 });

  _connect = () => dispose(
    () => this.#src.destroy()
  );

  output = (
    <AudioPort value={this.#src} output />
  );

  _view = () => (
    <>

      <Toggle value={this._start} label="Start" />
      <Number
        label="Loop"
        value={this._loop} />

      <Number
        label="Speed"
        value={this._speed} />

      <Toggle value={this._revert} label="Revert" />
    </>
  );
}