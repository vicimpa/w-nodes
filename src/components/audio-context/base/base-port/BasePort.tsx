import { INodePortProps, NodePort } from "$components/node-editor/node-port";

import s from "./BasePort.module.sass";

export class BasePort extends NodePort {
  title = '';

  constructor(public props: INodePortProps) {
    super(props);
  }

  render() {
    return (
      <div className={s.port} data-output={this.props.output || undefined}>
        <span>{this.title}</span>
        {super.render()}
      </div>
    );
  }
}