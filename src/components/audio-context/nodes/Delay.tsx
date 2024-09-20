import { AudioPort } from "../ports/AudioPort";
import { BaseNode } from "../lib/BaseNode";
import { Range } from "../lib/Range";
import { SignalNode } from "../lib/signalNode";
import { ctx } from "../ctx";
import { group } from "../_groups";
import { name } from "$library/function";
import { store } from "$components/node-editor";

@name('Delay')
@group('base')
export default class extends BaseNode {
  #delay = new DelayNode(ctx);

  @store _gain = new SignalNode(this.#delay.delayTime, { min: 0, max: 10 });

  input = (
    <AudioPort value={this.#delay} />
  );

  output = (
    <AudioPort value={this.#delay} output />
  );

  _view = () => (
    <>
      <Range
        label="Delay"
        accuracy={3}
        postfix="sec"
        value={this._gain}
      />
    </>
  );
}