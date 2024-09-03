import { AudioPort } from "../ports/AudioPort";
import { BaseNode } from "../lib/BaseNode";
import { ctx } from "../ctx";
import { dispose } from "$library/dispose";
import { name } from "$library/function";
import { pipe } from "../lib/pipe";

@name('Destination')
export default class extends BaseNode {
  #in = ctx.createGain();

  _connect = () => (
    dispose(
      pipe(this.#in, ctx.destination)
    )
  );

  input = (
    <AudioPort value={this.#in} />
  );
}