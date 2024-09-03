import { Component, PropsWithChildren, ReactNode, RefObject } from "react";
import { NodeConnect, NodeLines } from "../node-lines";
import { inject, provide } from "$library/provider";
import { prop, reactive, signalRef } from "$library/signals";

import { NodeItem } from "../node-item";
import { NodeMap } from "../node-map";
import { NodePort } from "../node-port";
import { NodeSelection } from "../node-selection";
import { collectStore } from "$library/store";
import { computed } from "@preact/signals-react";
import { connect } from "$library/connect";
import detectCopy from "./plugins/detectCopy";
import detectDelete from "./plugins/detectDelete";

export type TConnect = [
  from: [n: number, p: number],
  to: [n: number, p: number] | NodePort,
];

export type TNodeProjectProps = {
  nodes?: typeof NodeItem[];
  ports?: typeof NodePort[];
} & PropsWithChildren;

type TStateItem<T extends NodeItem = NodeItem> = {
  id: number;
  node: new (...args: any[]) => T;
  props?: T['props'];
  ref: RefObject<T>;
};

var id = 0;

@provide()
@connect(detectDelete, detectCopy)
@reactive()
export class NodeProject extends Component<TNodeProjectProps> {
  @inject(() => NodeMap) map!: NodeMap;
  @inject(() => NodeSelection) selection!: NodeSelection;
  @inject(() => NodeLines) lines!: NodeLines;

  nodes = this.props.nodes ?? [];
  ports = this.props.ports ?? [];

  @prop store: TStateItem[] = [];

  append<T extends NodeItem>(
    node: new (props: T['props']) => T,
    props: T['props'] = {}
  ) {
    return new Promise<T>((onMount) => {
      this.store = [...this.store, {
        id: id++,
        node,
        props: { x: this.map.x, y: this.map.y, ...props, onMount },
        ref: signalRef(),
      }];
    });
  }

  find<T extends NodeItem>(node: T) {
    return this.nodes.find(j => node instanceof j);
  }

  destroy<T extends NodeItem>(...nodes: T[]) {
    this.store = this.store.filter(e => !nodes.includes(e.ref.current! as T));
  }

  copy<T extends NodeItem>(...items: T[]) {
    const copys = items
      .map(e => ({
        node: this.find(e)!,
        props: { x: e.x, y: e.y },
        _item: e
      }))
      .filter(e => e.node);

    const datas = copys.map(e => this.save(e._item));

    return Promise.all(
      copys.map(e => this.append(e.node, e.props))
    ).then(e => {
      e.forEach((e, i) => this.restore(e, datas[i]));
      return e;
    });
  }

  save<T extends NodeItem>(node: T) {
    const data: { [key: string | symbol]: any; } = {};

    for (const key of collectStore(node)) {
      if (!(key in node))
        continue;

      const val = (node as any)[key];

      if (typeof val === 'object' && 'value' in val) {
        data[key] = val.value;
      } else {
        data[key] = val;
      }
    }

    return data;
  }

  saveConnections<T extends NodeItem>(...nodes: T[]) {
    const connections: Array<TConnect> = [];
    const connectSet = new Set<NodeConnect>();

    nodes.forEach((node, i) => {
      [...node.ports].forEach((port, j) => {
        port.connects.peek().forEach(connect => {
          const k = nodes.indexOf(connect.item as T);
          const _c = this.lines.connects.find(e => (
            (e[0] === port && e[1] === connect) ||
            (e[1] === port && e[0] === connect)
          ));
          if (!_c || connectSet.has(_c)) {
            return;
          }

          connectSet.add(_c);

          if (k === -1) {
            connections.push([[i, j], connect]);
          } else {
            const l = [...connect.item.ports].indexOf(connect);
            if (l === -1)
              throw new Error('No search port');

            connections.push([[i, j], [k, l]]);
          }
        });
      });
    });

    return connections;
  }

  restore<T extends NodeItem>(node: T, data: { [key: string | symbol]: any; }) {
    for (const key of collectStore(node)) {
      if (!(key in node) || !(key in data))
        continue;

      const val = (node as any)[key];

      if (typeof val === 'object' && 'value' in val) {
        val.value = data[key];
      } else {
        (node as any)[key] = data[key];
      }
    }

    return data;
  }

  restoreConnections<T extends NodeItem>(connect: Array<TConnect>, ...nodes: T[]) {
    connect.forEach(([[i, j], _to]) => {
      const from = [...nodes[i].ports][j];
      const to = Array.isArray(_to) ? [...nodes[_to[0]].ports][_to[1]] : _to;
      this.lines.from = [from];
      this.lines.connect(to);
    });
  }

  render(): ReactNode {
    return (
      <>
        {
          computed(() => (
            this.store.map(e => (
              <e.node
                key={e.id}
                {...e.props ?? {}}
                ref={e.ref} />
            ))
          ))
        }
        {this.props.children}
      </>
    );
  }
}