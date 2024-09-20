import { Component, PropsWithChildren, ReactNode } from "react";
import { inject, provide } from "@vicimpa/react-decorators";
import { prop, reactive } from "@vicimpa/decorators";

import { NodeLayersItem } from "../node-layers";
import { NodeLinesBack } from "./NodeLinesBack";
import { NodeLinesForward } from "./NodeLinesForward";
import { NodeMap } from "../node-map";
import { NodePort } from "../node-port";
import { Vec2 } from "@vicimpa/lib-vec2";
import { connect } from "@vicimpa/react-decorators";
import { dispose } from "$library/dispose";
import { frames } from "$library/frames";
import { makeDrag } from "@vicimpa/easy-drag";

export type NodeConnect = [from: NodePort, to: NodePort];

@provide()
@connect()
@reactive()
export class NodeLines extends Component<PropsWithChildren> {
  @inject(() => NodeMap) map!: NodeMap;

  @prop mouse?: Vec2;

  @prop from: NodePort[] = [];
  @prop connects: NodeConnect[] = [];

  fromStart = makeDrag<NodePort[]>(({ current }, ...from) => {
    this.from = from ?? [];

    if (!this.from.length)
      return () => {
        return () => {

        };
      };

    const _dispose = dispose(
      frames((dtime) => {
        this.map.calcViewTransitionVec(current, dtime)
          .toObject(this.map);

        const offset = this.map.offset(current);

        if (!this.mouse?.equal(offset))
          this.mouse = offset;
      }),
      () => {
        this.mouse = undefined;
        this.from = [];
      }
    );

    return ({ current: newCurrent }) => {
      current.set(newCurrent);

      return () => {
        _dispose();
      };
    };
  });

  connect(to: NodePort) {
    if (!this.from.length)
      return;

    const connects = [...this.connects];

    for (const from of this.from) {
      const pair: NodeConnect = [from, to];

      if (!from.props.output)
        pair.reverse();

      if (connects.find(e => e[0] === pair[0] && e[1] === pair[1]))
        continue;

      if (from.onConnect(to) && to.onConnect(from)) {
        connects.push(pair);
      }
    }

    this.connects = connects;
  }

  disconnect(...ports: (NodePort | NodeConnect)[]) {
    const set = new Set(ports);

    const connects: NodeConnect[] = [];
    const removed: NodePort[] = [];


    for (const connect of this.connects) {
      const [from, to] = connect;

      if (set.has(from)) {
        removed.push(to);
        to.onDisconnect(from);
        from.onDisconnect(to);
        continue;
      }

      if (set.has(to)) {
        removed.push(from);
        to.onDisconnect(from);
        from.onDisconnect(to);
        continue;
      }

      if (!set.has(connect)) {
        connects.push(connect);
      } else {
        connect[0].onDisconnect(connect[1]);
        connect[1].onDisconnect(connect[0]);

      }
    }

    this.connects = connects;

    return removed;
  }

  render(): ReactNode {
    return (
      <>
        <NodeLayersItem>
          <NodeLinesBack />
        </NodeLayersItem>

        {this.props.children}

        <NodeLayersItem post>
          <NodeLinesForward />
        </NodeLayersItem>
      </>
    );
  }
}