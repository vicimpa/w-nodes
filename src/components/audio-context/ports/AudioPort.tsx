import { INodePortProps, NodePort } from "$components/node-editor/node-port";

import { BasePort } from "../base/base-port";

export type TAudioPortProps = {
  ['data-title']?: string;
  ['data-value']: AudioNode;
} & INodePortProps;

export class AudioPort extends BasePort {
  title = 'audio ' + (this.props.output ? 'out' : 'in');
  color = 'blue';
  node!: AudioNode;

  constructor(props: TAudioPortProps) {
    super(props);
    this.title = props['data-title'] ?? this.title;
    this.node = props['data-value'];
  }

  _onConnect(port: NodePort) {
    if (!(port instanceof AudioPort)) return false;
    if (!this.props.output) return true;
    this.node.connect(port.node);
    return true;
  }

  _onDisconnect(port: NodePort) {
    if (!(port instanceof AudioPort)) return false;
    if (!this.props.output) return true;
    this.node.disconnect(port.node);
    return true;
  }
}