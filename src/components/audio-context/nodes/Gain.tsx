import { AudioPort } from "../ports/AudioPort";
import { BaseNode } from "../lib/BaseNode";
import { Range } from "../lib/Range";
import { SignalNode } from "../lib/signalNode";
import { ctx } from "../ctx";
import { name } from "$library/function";
import { store } from "$library/store";

@name('Gain')
export default class extends BaseNode {
  #gain = new GainNode(ctx);

  @store _gain = new SignalNode(this.#gain.gain, { min: 0, max: 1.5 });


  input = (
    <AudioPort value={this.#gain} />
  );

  output = (
    <AudioPort value={this.#gain} output />
  );

  _view = () => (
    <>
      <Range
        label="Gain"
        accuracy={2}
        value={this._gain}
      />
    </>
  );
}