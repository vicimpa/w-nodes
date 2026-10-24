import { NodeItem, NodePort, NodeProject } from "$components/node-editor";
import { TSlot, slotId } from "./state";

import type Group from "./Group";
import { TLink } from "$components/node-editor/node-project/utils/projectCodec";
import { delay } from "$library/function";

const connectPorts = (project: NodeProject, from: NodePort, to: NodePort) => {
  project.lines.from = [from];
  project.lines.connect(to);
};

const portLabel = (node: NodeItem, port: NodePort) => (
  port.props.title ?? `${(node as { title?: unknown; }).title ?? 'port'}`.toLowerCase()
);

// Сворачивает выбранные ноды в блок; провода, выходившие наружу, становятся портами блока
export async function collapse(project: NodeProject, nodes: NodeItem[]) {
  const type = project.typeById('Group');

  if (!type || !nodes.length)
    return;

  const { data, external } = project.serialize(nodes);
  const xs = nodes.map(node => node.x);
  const ys = nodes.map(node => node.y);
  const center = {
    x: (Math.min(...xs) + Math.max(...xs)) / 2,
    y: (Math.min(...ys) + Math.max(...ys)) / 2,
  };

  data.configs.forEach((config, i) => {
    config.x = nodes[i].x - center.x;
    config.y = nodes[i].y - center.y;
  });

  const slots: TSlot[] = [];
  const slotByPort = new Map<NodePort, string>();
  const outerLinks: [slot: string, port: NodePort][] = [];

  for (const [[i, j], outer] of external) {
    const node = nodes[i];
    const port = node.sortPorts[j];
    const kind = port.props.output ? 'out' : 'in';
    var id = slotByPort.get(port);

    if (!id) {
      id = slotId();
      slotByPort.set(port, id);

      const label = portLabel(node, port);
      const index = data.nodes.length;

      slots.push({ id, kind, label });
      data.nodes.push(kind === 'in' ? 'GroupInput' : 'GroupOutput');
      data.configs.push({
        x: (kind === 'in' ? Math.min(...xs) - 260 : Math.max(...xs) + 260) - center.x,
        y: node.y - center.y,
        slot: id,
        label,
      });
      data.connect.push([[index, 0], [i, j]]);
    }

    outerLinks.push([id, outer as NodePort]);
  }

  project.destroy(...nodes);

  const block = await project.append(type, center) as Group;
  block.slots = slots;
  block.graph = data;
  project.selection.select = [block];

  await delay(100);

  for (const [id, outer] of outerLinks) {
    const port = block.portFor(id);

    if (port)
      connectPorts(project, port, outer);
  }

  return block;
}

// Распаковывает блок обратно в ноды текущего проекта
export async function expand(project: NodeProject, block: Group) {
  const data = block.graph;
  const io = new Map<number, string>();

  data.nodes.forEach((id, i) => {
    if (id === 'GroupInput' || id === 'GroupOutput')
      io.set(i, data.configs[i]?.slot);
  });

  const keep = data.nodes.map((_, i) => i).filter(i => !io.has(i));
  const index = new Map(keep.map((from, to) => [from, to]));

  // Связи внутри блока, задевающие вход/выход, превращаются в «слот → порт ноды»
  const inner: [slot: string, link: [node: number, port: number]][] = [];
  const bypass: [a: string, b: string][] = [];
  const connect: TLink[] = [];

  for (const [a, b] of data.connect) {
    if (io.has(a[0]) && io.has(b[0]))
      bypass.push([io.get(a[0])!, io.get(b[0])!]);
    else if (io.has(a[0]) && index.has(b[0]))
      inner.push([io.get(a[0])!, [index.get(b[0])!, b[1]]]);
    else if (io.has(b[0]) && index.has(a[0]))
      inner.push([io.get(b[0])!, [index.get(a[0])!, a[1]]]);
    else if (index.has(a[0]) && index.has(b[0]))
      connect.push([[index.get(a[0])!, a[1]], [index.get(b[0])!, b[1]]]);
  }

  // Порты снаружи, подключённые к каждому слоту блока
  const outer = new Map<string, NodePort[]>();

  for (const [[, j], port] of project.saveConnections(block)) {
    if (Array.isArray(port))
      continue;

    const own = block.sortPorts[j];
    const slot = block.slots.find(slot => block.outerGain(slot.id) === own?.props.value);

    if (slot)
      outer.set(slot.id, [...outer.get(slot.id) ?? [], port]);
  }

  const { x, y } = block;
  const nodes = await project.load({
    nodes: keep.map(i => data.nodes[i]),
    configs: keep.map(i => ({
      ...data.configs[i],
      x: data.configs[i].x + x - project.map.x,
      y: data.configs[i].y + y - project.map.y,
    })),
    connect,
    media: [],
  });

  for (const [slot, [node, port]] of inner) {
    const from = nodes[node]?.sortPorts[port];

    for (const to of outer.get(slot) ?? []) {
      if (from)
        connectPorts(project, from, to);
    }
  }

  // Вход, соединённый прямо с выходом: соединяем внешние порты напрямую
  for (const [a, b] of bypass) {
    for (const from of outer.get(a) ?? [])
      for (const to of outer.get(b) ?? [])
        connectPorts(project, from, to);
  }

  project.destroy(block);
  return nodes;
}
