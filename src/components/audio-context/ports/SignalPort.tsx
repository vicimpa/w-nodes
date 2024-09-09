import { prop, reactive } from "$library/signals";

import { AudioPort } from "./AudioPort";
import { BasePort } from "../lib/BasePort";
import { SignalNode } from "../lib/signalNode";
import { connect } from "$library/connect";
import { start } from "../lib/start";

@connect(ctx => start(ctx.value))
@reactive()
export class SignalPort extends BasePort {
  @prop color = '#4f4';
  value: SignalNode = this.props.value;

  _onConnect(port: AudioPort | SignalPort) {
    if (!this.value) return false;
    if (!port.value) return false;
    if (!this.props.output) return true;

    if (port.value instanceof AudioNode) {
      this.value.node.connect(port.value);
      return true;
    }

    if (port.value instanceof SignalNode) {
      this.value.node.connect(port.value.node.offset);
      port.value.addInput(this.value);
      return true;
    }

    return false;
  }

  _onDisconnect(port: AudioPort | SignalPort) {
    if (!this.props.output) return true;

    if (port.value instanceof AudioNode) {
      this.value.node.disconnect(port.value);
    }

    if (port.value instanceof SignalNode) {
      this.value.node.disconnect(port.value.node.offset);
      port.value.deleteInput(this.value);
    }
  }
}