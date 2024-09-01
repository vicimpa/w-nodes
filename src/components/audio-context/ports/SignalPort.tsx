import { BasePort } from "../lib/BasePort";
import { SignalNode } from "../lib/signalNode";

export class SignalPort extends BasePort {
  color = '#4f4';
  value: SignalNode = this.props.value;

  _onConnect(port: SignalPort) {
    if (this.props.output)
      return true;
    this.value.connect(port.value);
    return true;
  }

  _onDisconnect(port: SignalPort) {
    if (this.props.output)
      return true;
    this.value.disconnect(port.value);
    return true;
  }
}