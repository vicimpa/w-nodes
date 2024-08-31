import { BasePort } from "../lib/BasePort";

export class AudioPort extends BasePort {
  color = '#44f';
  value: AudioNode = this.props.value;

  _onConnect(port: AudioPort) {
    if (!this.value) return false;
    if (!port.value) return false;
    if (!(port.value instanceof AudioNode)) return false;
    if (!this.props.output) return true;
    this.value.connect(port.value);
    return true;
  }

  _onDisconnect(port: AudioPort) {
    if (!this.props.output)
      return true;

    if (this.value && port.value) {
      if (port.value instanceof AudioNode) {
        this.value.disconnect(port.value);
      }
    }

    return true;
  }
}