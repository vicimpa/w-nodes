import { AudioPort } from "../ports/AudioPort";
import { BaseNode } from "../lib/BaseNode";
import { Number } from "../lib/Number";
import { SignalNode } from "../lib/signalNode";
import { SignalPort } from "../ports/SignalPort";
import TimerProcessor from "../worklet/TimerProcessor";
import { computed } from "@preact/signals-react";
import { name } from "$library/function";
import { reactive } from "$library/signals";
import { store } from "$library/store";

@name('Timer')
@reactive()
export default class extends BaseNode {
  #src = new TimerProcessor();

  @store _start = new SignalNode(this.#src.start, { default: 0, min: 0, max: 1 });
  @store _loop = new SignalNode(this.#src.loop, { default: 0, min: 0 });

  output = (
    <AudioPort value={this.#src} output />
  );

  _view = () => (
    <>
      {
        computed(() => {
          var connected = this._start.connected;

          return (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <SignalPort value={this._start} />
              <button
                disabled={connected}
                onClick={() => this._start.value = this._start.value ? 0 : 1}
                style={{ background: connected && this._start.value ? '#050' : '', flexGrow: 1 }}
              >
                {connected ? 'Signal' : this._start.value ? 'Stop' : 'Start'}
              </button>
            </div>
          );
        })
      }

      <Number
        label="Loop"
        value={this._loop} />
    </>
  );
}