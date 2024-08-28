import { Component, ReactNode } from "react";
import { prop, reactive, signalRef } from "$library/signals";

import { NodeItem } from "../node-item";
import { NodeLines } from "../node-lines";
import { NodeMap } from "../node-map";
import { connect } from "$library/connect";
import detectConnect from "./plugins/detectConnect";
import detectDrag from "./plugins/detectDrag";
import detectHover from "./plugins/detectHover";
import detectMount from "./plugins/detectMount";
import detectPosition from "./plugins/detectPosition";
import detectRemove from "./plugins/detectRemove";
import { inject } from "$library/provider";
import s from "./NodePort.module.sass";

export interface INodePortProps {
  color?: string;
  value?: any;
  output?: boolean;
  onConnect?: (port: NodePort) => any;
  onDisconnect?: (port: NodePort) => any;
}

var id = 0;


@connect(
  detectPosition,
  detectDrag,
  detectConnect,
  detectRemove,
  detectMount,
  detectHover,
)
@reactive()
export class NodePort extends Component<INodePortProps> {
  @inject(() => NodeMap) map!: NodeMap;
  @inject(() => NodeItem) item!: NodeItem;
  @inject(() => NodeLines) lines!: NodeLines;

  id = id++;

  port = signalRef<HTMLSpanElement>();

  @prop x = 0;
  @prop y = 0;

  @prop hover = false;
  @prop value = this.props.value;

  onConnect(port: NodePort) {
    try {
      if (this === port)
        return false;

      if (this.item === port.item)
        return false;

      if (this.props.output === port.props.output)
        return false;

      if (this.props.onConnect && !this.props.onConnect(port))
        return false;

      return true;
    } catch (e) {
      return false;
    }
  }

  onDisconnect(port: NodePort) {
    try {
      if (this === port)
        return false;

      if (this.item === port.item)
        return false;

      if (this.props.output === port.props.output)
        return false;

      if (this.props.onDisconnect && !this.props.onDisconnect(port))
        return false;

      return true;
    } catch (e) {
      return false;
    }
  }

  render(): ReactNode {
    this.value = this.props.value;
    return (
      <span ref={this.port} className={s.port} />
    );
  }
}