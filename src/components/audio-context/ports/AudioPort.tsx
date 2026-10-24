import { BasePort } from "../lib/BasePort";
import { SignalNode } from "../lib/signalNode";
import { SignalPort } from "./SignalPort";

export class AudioPort extends BasePort {
  kind = 'audio';
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

  // Та же пара «узел → цель» ещё нужна другой связи (у входа и выхода блока общий GainNode)
  _isShared(port: AudioPort | SignalPort) {
    return this.lines.connects.some(([a, b]) => (
      (a !== this || b !== port) &&
      a.value === this.value &&
      b.value === port.value
    ));
  }

  _onDisconnect(port: AudioPort | SignalPort) {
    if (!this.props.output)
      return true;

    if (this.value && port.value) {
      if (this._isShared(port))
        return true;

      if (port.value instanceof AudioNode) {
        this.value.disconnect(port.value);
        return true;
      }

      if (port.value instanceof SignalNode) {
        port.value.deleteInput(this.value);
        try {
          this.value.disconnect(port.value.node.offset);
        } catch (e) { }
        return true;
      }
    }

    return true;
  }
}