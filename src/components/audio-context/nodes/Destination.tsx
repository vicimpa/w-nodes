import { AudioPort } from "../ports/AudioPort";
import { BaseNode } from "../lib/BaseNode";
import { ctx } from "../ctx";
import { name } from "$library/function";

@name('Destination')
export default class extends BaseNode {
  #in = ctx.createGain();

  _connect = () => {
    this.#in.connect(ctx.destination);

    return () => {
      this.#in.disconnect(ctx.destination);
    };
  };

  input = (
    <AudioPort value={this.#in} />
  );
}