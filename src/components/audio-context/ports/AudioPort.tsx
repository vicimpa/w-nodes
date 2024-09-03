import { BasePort } from "../lib/BasePort";
import { SignalNode } from "../lib/signalNode";
import { SignalPort } from "./SignalPort";

export class AudioPort extends BasePort {
  color = '#44f';
  value: AudioNode = this.props.value;

  _onConnect(port: AudioPort | SignalPort) {
    if (!this.value) return false;
    if (!port.value) return false;
    if (!this.props.output) return true;

    if (port.value instanceof AudioNode) {
      this.value.connect(port.value);
      return true;
    }

    if (port.value instanceof SignalNode) {
      this.value.connect(port.value.node.offset);
      port.value.addInput(this.value);
      return true;
    }

    return false;
  }

  _onDisconnect(port: AudioPort | SignalPort) {
    if (!this.props.output)
      return true;

    if (this.value && port.value) {
      if (port.value instanceof AudioNode) {
        this.value.disconnect(port.value);
        return true;
      }

      if (port.value instanceof SignalNode) {
        this.value.disconnect(port.value.node.offset);
        port.value.deleteInput(this.value);
        return true;
      }
    }

    return true;
  }
}