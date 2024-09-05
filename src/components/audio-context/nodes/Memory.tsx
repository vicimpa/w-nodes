import { AudioPort } from "../ports/AudioPort";
import { BaseNode } from "../lib/BaseNode";
import MemoryProcessor from "../worklet/MemoryProcessor";
import { Number } from "../lib/Number";
import { SignalNode } from "../lib/signalNode";
import { name } from "$library/function";
import { store } from "$library/store";

@name('Memory')
export default class extends BaseNode {
  #processor = new MemoryProcessor();

  @store _value = new SignalNode(this.#processor.value);
  @store _write = new SignalNode(this.#processor.write);

  output = (
    <AudioPort value={this.#processor} output />
  );

  _view = () => (
    <>
      <Number label={`Value`} value={this._value} />
      <Number label={`Write`} value={this._write} />
    </>
  );
}
