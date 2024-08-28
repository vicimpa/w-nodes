import { AudioPort } from "../../ports/AudioPort";
import { BaseNode } from "../../base/base-node";
import { ctx } from "../../ctx";

export class Oscillator extends BaseNode {
  _src = ctx.createOscillator();
  _out = ctx.createGain();

  title = 'Oscillator';

  __mount = () => {
    this._src.start();
    this._src.connect(this._out);

    return () => {
      this._src.stop();
      this._src.disconnect(this._out);
    };
  };

  output = [
    <AudioPort data-title="out" output data-value={this._out} />
  ];
}