import { AudioPort } from "../ports/AudioPort";
import { BaseNode } from "../lib/BaseNode";
import { Range } from "../lib/Range";
import { SignalNode } from "../lib/signalNode";
import { ctx } from "../ctx";
import { group, icon } from "../_groups";
import { ArrowLeftRight } from "lucide-react";
import { name } from "$library/function";
import { store } from "$components/node-editor";

@name('StereoPanner')
@group('effect')
@icon(ArrowLeftRight)
export default class extends BaseNode {
  #stereo = new StereoPannerNode(ctx);

  @store _pan = new SignalNode(this.#stereo.pan);

  input = (
    <AudioPort value={this.#stereo} />
  );

  output = (
    <AudioPort value={this.#stereo} output />
  );

  _view = () => (
    <>
      <Range
        label="Pan"
        accuracy={3}
        value={this._pan}
      />
    </>
  );
}