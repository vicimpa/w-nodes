import { AudioPort } from "../ports/AudioPort";
import { BaseNode } from "../lib/BaseNode";
import ImpulseProcessor from "../worklet/ImpulseProcessor";
import { Number } from "../lib/Number";
import { SignalNode } from "../lib/signalNode";
import { dispose } from "$library/dispose";
import { name } from "$library/function";
import { store } from "$library/store";

@name('Inpulse')
export default class extends BaseNode {
  #processor = new ImpulseProcessor();

  @store _value = new SignalNode(this.#processor.value);
  @store _length = new SignalNode(this.#processor.length);

  _connect = () => dispose(
    () => this.#processor.destroy()
  );

  output = (
    <AudioPort value={this.#processor} output />
  );

  _view = () => (
    <>
      <Number label={`Value`} value={this._value} />
      <Number label={`Length`} value={this._length} />
    </>
  );
}
