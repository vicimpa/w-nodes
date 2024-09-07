import { AudioPort } from "../ports/AudioPort";
import { BaseNode } from "../lib/BaseNode";
import InterpolationProcessor from "../worklet/InterpolationProcessor";
import { Range } from "../lib/Range";
import { SignalNode } from "../lib/signalNode";
import { SignalPort } from "../ports/SignalPort";
import { name } from "$library/function";
import { store } from "$library/store";

@name('Interpolation')
export default class extends BaseNode {
  #processor = new InterpolationProcessor();

  _input = new SignalNode(this.#processor.value);
  @store _frames = new SignalNode(this.#processor.frames);

  input = (
    <SignalPort value={this._input} />
  );

  output = (
    <AudioPort value={this.#processor} output />
  );

  _view = () => (
    <>
      <Range
        label="Frames"
        value={this._frames}
        strict
      />
    </>
  );
}