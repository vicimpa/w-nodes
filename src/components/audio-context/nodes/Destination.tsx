import { AudioPort } from "../ports/AudioPort";
import { BaseNode } from "../base/base-node";
import { ctx } from "../ctx";

export class Destination extends BaseNode {
  _in = ctx.createGain();
  title = 'Destination';

  __mount = () => {
    this._in.connect(ctx.destination);
    return () => {
      this._in.disconnect(ctx.destination);
    };
  };

  input = [
    <AudioPort data-title="in" data-value={this._in} />
  ];
}