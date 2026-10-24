import { Component, PropsWithChildren, ReactNode, RefObject } from "react";
import { NodeConnect, NodeLines } from "../node-lines";
import { batch, computed, untracked } from "@preact/signals-react";
import { TLayoutEdge, arrange as arrangeLayout } from "../utils/layout";
import { frames } from "$library/frames";
import { inject, provide } from "@vicimpa/react-decorators";
import { prop, reactive } from "@vicimpa/decorators";

import { NodeItem } from "../node-item";
import { NodeMap } from "../node-map";
import { NodePort } from "../node-port";
import { NodeSelection } from "../node-selection";
import { TLink, TProjectData, decodeProject } from "./utils/projectCodec";
import { Vec2 } from "@vicimpa/lib-vec2";
import { connect } from "@vicimpa/react-decorators";
import { delay } from "$library/function";
import detectCopy from "./plugins/detectCopy";
import detectDelete from "./plugins/detectDelete";
import { makeWeekProtoStore } from "@vicimpa/week-store";
import { signalRef } from "$library/signals";

export type TConnect = [
  from: [n: number, p: number],
  to: [n: number, p: number] | NodePort,
];

// Для чего готовим данные проекта: от этого зависит, вшивать ли медиа
export type TExportPurpose = 'clipboard' | 'file' | 'link' | 'autosave';

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

const isBox = (val: unknown): val is { value: unknown; } => (
  val !== null && typeof val === 'object' && 'value' in val
);

const copy = <T,>(val: T): T => {
  try {
    return structuredClone(val);
  } catch {
    return val;
  }
};

// Значение из сохранённого (возможно, чужого) проекта применяем, только если его тип совпадает с текущим
const fits = (current: unknown, next: unknown) => {
  if (current === null || current === undefined)
    return true;

  if (next === null || next === undefined)
    return false;

  if (Array.isArray(current) !== Array.isArray(next))
    return false;

  return typeof current === typeof next;
};

const keyStore = makeWeekProtoStore<string | symbol>();
export const store = keyStore.store;

@provide()
@connect(detectDelete, detectCopy)
@reactive()
export class NodeProject extends Component<TNodeProjectProps> {
  @inject(() => NodeMap) map!: NodeMap;
  @inject(() => NodeSelection) selection!: NodeSelection;
  @inject(() => NodeLines) lines!: NodeLines;

  nodes = this.props.nodes ?? [];
  ports = this.props.ports ?? [];
  legacyNodes: readonly string[] = [];
  // Сколько загрузок сейчас идёт: история не снимает состояние посреди загрузки
  busy = 0;

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
        ref: signalRef<NodeItem>(),
      }];
    });
  }

  find<T extends NodeItem>(node: T) {
    return this.nodes.find(j => node instanceof j);
  }

  typeById(id: string) {
    return this.nodes.find(type => type.name === id);
  }

  destroy<T extends NodeItem>(...nodes: T[]) {
    this.store = this.store.filter(e => !nodes.includes(e.ref.current! as T));
  }

  save<T extends NodeItem>(node: T) {
    const data: { [key: string | symbol]: any; } = {};

    for (const key of keyStore.collect(node)) {
      if (!(key in node))
        continue;

      const val = (node as any)[key];

      // Копия: иначе дубликат и оригинал делят один массив (Sequencer правит его на месте)
      data[key] = copy(isBox(val) ? val.value : val);
    }

    return data;
  }

  saveConnections<T extends NodeItem>(...nodes: T[]) {
    const connections: Array<TConnect> = [];
    const connectSet = new Set<NodeConnect>();

    nodes.forEach((node, i) => {
      node.sortPorts.forEach((port, j) => {
        untracked(() => port.connects).forEach(connect => {
          const ports = connect.item.sortPorts;
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
            const l = ports.indexOf(connect);
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
    for (const key of keyStore.collect(node)) {
      if (!(key in node) || !(key in data))
        continue;

      const val = (node as any)[key];
      const next = data[key];

      if (isBox(val)) {
        if (fits(val.value, next))
          val.value = copy(next);
      } else if (fits(val, next)) {
        (node as any)[key] = copy(next);
      }
    }

    return data;
  }

  restoreConnections<T extends NodeItem>(connect: Array<TConnect>, ...nodes: T[]) {
    connect.forEach(([[i, j], _to]) => {
      const from = [...nodes[i].sortPorts][j];
      const to = Array.isArray(_to) ? [...nodes[_to[0]].sortPorts][_to[1]] : _to;
      this.lines.from = [from];
      this.lines.connect(to);
    });
  }

  serialize(nodes: NodeItem[]) {
    const links = this.saveConnections(...nodes);
    const data: TProjectData = {
      nodes: nodes.map(node => this.find(node)!.name),
      connect: links.filter((link): link is TLink => Array.isArray(link[1])),
      configs: nodes.map(node => {
        const config = this.save(node);

        if ('x' in config && 'y' in config)
          new Vec2(config as Vec2).minus(this.map).toObject(config as Vec2);

        return config;
      }),
      media: [],
    };

    return {
      data,
      external: links.filter(link => !Array.isArray(link[1])),
    };
  }

  async load(data: TProjectData, external: TConnect[] = []) {
    const types = data.nodes.map(id => {
      const type = this.typeById(id);

      if (!type)
        throw new Error(`Unknown node type "${id}"`);

      return type;
    });

    this.busy++;

    try {
      const nodes = await Promise.all(types.map(type => this.append(type)));

      nodes.forEach((node, i) => {
        this.restore(node, data.configs[i] ?? {});
        new Vec2(node).plus(this.map).toObject(node);
      });

      this.selection.select = nodes;
      await delay(100);
      this.restoreConnections([...data.connect, ...external], ...nodes);
      return nodes;
    } finally {
      this.busy--;
    }
  }

  async exportData(data: TProjectData, _purpose: TExportPurpose) {
    return data;
  }

  async importData(data: TProjectData) {
    return data;
  }

  async paste(text: string) {
    return this.load(await this.importData(await decodeProject(text, this.legacyNodes)));
  }

  // Красивая расстановка: выделенные ноды (если их больше одной) или все. Ноды плавно переезжают.
  async arrange(nodes = this.selection.select.length > 1 ? [...this.selection.select] : this.store.flatMap(item => item.ref.current ?? [])) {
    if (nodes.length < 2)
      return;

    const index = new Map(nodes.map((node, i) => [node, i]));
    const edges = this.lines.connects.flatMap(([from, to]) => (
      index.has(from.item) && index.has(to.item) ? [[index.get(from.item)!, index.get(to.item)!] as TLayoutEdge] : []
    ));
    const target = arrangeLayout(nodes.map((node, id) => ({ id, x: node.x, y: node.y, width: node.width, height: node.height })), edges);
    const from = nodes.map(node => ({ x: node.x, y: node.y }));
    const duration = 280;

    this.busy++;

    try {
      await new Promise<void>(resolve => {
        const started = performance.now();
        const stop = frames(() => {
          const t = Math.min((performance.now() - started) / duration, 1);
          const k = 1 - (1 - t) ** 3;

          batch(() => {
            nodes.forEach((node, i) => {
              const to = target.get(i)!;
              node.x = from[i].x + (to.x - from[i].x) * k;
              node.y = from[i].y + (to.y - from[i].y) * k;
            });
          });

          if (t >= 1) {
            stop();
            resolve();
          }
        });
      });
    } finally {
      this.busy--;
    }
  }

  clean() {
    this.store = [];
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