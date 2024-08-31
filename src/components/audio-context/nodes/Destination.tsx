import { AudioPort } from "../ports/AudioPort";
import { BaseNode } from "../lib/BaseNode";
import { ctx } from "../ctx";

export class Destination extends BaseNode {
  title = 'Destination';
  color = '#2ECC71';
  canCreate = false;
  canRemove = false;

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