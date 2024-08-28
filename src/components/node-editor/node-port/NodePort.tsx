import { Component, ReactNode } from "react";
import { prop, reactive, signalRef } from "$library/signals";

import { NodeItem } from "../node-item";
import { NodeLines } from "../node-lines";
import { NodeMap } from "../node-map";
import { computed } from "@preact/signals-react";
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
  @prop color = '#999';

  @prop hover = false;

  connects = computed(() => {
    if (!this.lines) return [];

    return this.lines.connects
      .filter(e => e.includes(this))
      .map(e => e[0] === this ? e[1] : e[0]);
  });

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
      return false;
    }
  }

  public _onDisconnect(_port: NodePort): any {
    return true;
  }

  render(): ReactNode {
    return (
      <span ref={this.port} style={{ ['--color']: this.color } as any} className={s.port} />
    );
  }
}