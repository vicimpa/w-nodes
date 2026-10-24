import { AudioPort } from "../ports/AudioPort";
import { BaseNode } from "../lib/BaseNode";
import { ctx } from "../ctx";
import { dispose } from "$library/dispose";
import { group, icon } from "../_groups";
import { Volume2 } from "lucide-react";
import { name } from "$library/function";
import { pipe } from "../lib/pipe";

@name('Destination')
@group('io')
@icon(Volume2)
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