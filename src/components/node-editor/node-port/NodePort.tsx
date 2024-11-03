import { Component, ReactNode } from "react";
import { prop, reactive } from "@vicimpa/decorators";

import { NodeItem } from "../node-item";
import { NodeLines } from "../node-lines";
import { NodeMap } from "../node-map";
import { connect } from "@vicimpa/react-decorators";
import detectConnect from "./plugins/detectConnect";
import detectDrag from "./plugins/detectDrag";
import detectHover from "./plugins/detectHover";
import detectMount from "./plugins/detectMount";
import detectPosition from "./plugins/detectPosition";
import detectRemove from "./plugins/detectRemove";
import { inject } from "@vicimpa/react-decorators";
import s from "./NodePort.module.sass";
import { signalRef } from "$library/signals";

export interface INodePortProps {
  value?: any;
  output?: boolean;
  title?: string;
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
  @prop color = '#999';
  @prop hover = false;

  @prop value: any = this.props.value;

  @prop get connects() {
    if (!this.lines) return [];

    return this.lines.connects
      .filter(e => e.includes(this))
      .map(e => e[0] === this ? e[1] : e[0]);
  };

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

      if (!this._onConnect(port))
        return false;

      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  }

  public _onConnect(_port: NodePort): any {
    return true;
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

      if (!this._onDisconnect(port))
        return false;

      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  }

  public _onDisconnect(_port: NodePort): any {
    return true;
  }

  render(): ReactNode {
    this.value = this.props.value;

    return (
      <span title={this.props.title} ref={this.port} style={{ ['--color']: this.color } as any} className={s.port} />
    );
  }
}