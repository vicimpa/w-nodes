import { TSnapshot, diffSnapshots, emptySnapshot, linkKey, parseLink, sameSnapshot } from "./utils/historyDiff";

import { NodeItem } from "../node-item";
import type { NodeProject } from "./NodeProject";
import { delay } from "$library/function";
import { signal } from "@preact/signals-react";

const newId = () => Math.random().toString(36).slice(2, 10);

// История изменений проекта. Хранит снимки и откатывает их разницей, не пересоздавая
// неизменившиеся ноды: звук и внутреннее состояние остальных нод не прерываются.
export class ProjectHistory {
  past: TSnapshot[] = [];
  future: TSnapshot[] = [];
  current: TSnapshot = emptySnapshot();

  canUndo = signal(false);
  canRedo = signal(false);
  applying = false;

  ids = new WeakMap<NodeItem, string>();

  constructor(public project: NodeProject, public limit = 100) { }

  id(node: NodeItem) {
    var id = this.ids.get(node);

    if (!id)
      this.ids.set(node, id = newId());

    return id;
  }

  nodes() {
    return this.project.store.flatMap(item => item.ref.current ?? []);
  }

  capture(): TSnapshot {
    const { project } = this;
    const snapshot = emptySnapshot();
    const items = this.nodes();
    const ports = new Map<NodeItem, unknown[]>();

    for (const node of items) {
      const type = project.find(node)?.name;

      if (!type)
        continue;

      const config = project.save(node);

      // Значение входа с проводом — это пришедший сигнал, а не настройка
      for (const key of Object.keys(config)) {
        const value = (node as any)[key];

        if (value && typeof value === 'object' && value.connected)
          delete config[key];
      }

      snapshot.nodes.set(this.id(node), { type, config: JSON.stringify(config) });
      ports.set(node, node.sortPorts);
    }

    for (const [from, to] of project.lines.connects) {
      const a = ports.get(from.item)?.indexOf(from) ?? -1;
      const b = ports.get(to.item)?.indexOf(to) ?? -1;

      if (a !== -1 && b !== -1)
        snapshot.links.add(linkKey([this.id(from.item), a], [this.id(to.item), b]));
    }

    return snapshot;
  }

  sync() {
    this.canUndo.value = this.past.length > 0;
    this.canRedo.value = this.future.length > 0;
  }

  // Начать историю с текущего состояния (после открытия проекта)
  reset() {
    this.past = [];
    this.future = [];
    this.current = this.capture();
    this.sync();
  }

  // Записать шаг, если состояние изменилось
  commit() {
    if (this.applying || this.project.busy)
      return false;

    const snapshot = this.capture();

    if (sameSnapshot(snapshot, this.current))
      return false;

    this.past = [...this.past, this.current].slice(-this.limit);
    this.future = [];
    this.current = snapshot;
    this.sync();
    return true;
  }

  async undo() {
    if (this.applying || this.project.busy)
      return;

    this.commit();

    const target = this.past.at(-1);

    if (!target)
      return;

    this.past = this.past.slice(0, -1);
    this.future = [...this.future, this.current];
    await this.apply(target);
  }

  async redo() {
    if (this.applying || this.project.busy || !this.future.length)
      return;

    const target = this.future.at(-1)!;

    this.future = this.future.slice(0, -1);
    this.past = [...this.past, this.current];
    await this.apply(target);
  }

  private async apply(target: TSnapshot) {
    const { project } = this;

    this.applying = true;

    try {
      const diff = diffSnapshots(this.capture(), target);
      const byId = () => new Map(this.nodes().map(node => [this.id(node), node]));
      const portOf = (nodes: Map<string, NodeItem>, [id, index]: [string, number]) => nodes.get(id)?.sortPorts[index];

      var nodes = byId();

      if (diff.remove.length)
        project.destroy(...diff.remove.flatMap(id => nodes.get(id) ?? []));

      for (const key of diff.unlink) {
        const [from, to] = parseLink(key).map(ref => portOf(nodes, ref));
        const connect = project.lines.connects.find(([a, b]) => a === from && b === to);

        if (connect)
          project.lines.disconnect(connect);
      }

      for (const { id, config } of diff.update) {
        const node = nodes.get(id);

        if (node)
          project.restore(node, config);
      }

      await Promise.all(diff.add.map(async ({ id, type, config }) => {
        const node = project.typeById(type);

        if (!node)
          return;

        const item = await project.append(node, { x: config.x as number, y: config.y as number });
        this.ids.set(item, id);
        project.restore(item, config);
      }));

      // Новые и изменившиеся ноды успевают смонтировать порты
      if (diff.add.length || diff.update.length)
        await delay(100);

      nodes = byId();

      for (const key of diff.link) {
        const [from, to] = parseLink(key).map(ref => portOf(nodes, ref));

        if (from && to) {
          project.lines.from = [from];
          project.lines.connect(to);
        }
      }

      project.selection.select = project.selection.select.filter(node => nodes.has(this.id(node)));
    } finally {
      this.current = this.capture();
      this.applying = false;
      this.sync();
    }
  }
}
