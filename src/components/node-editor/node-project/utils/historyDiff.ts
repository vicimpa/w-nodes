// Снимок проекта для истории: ноды по постоянному id и связи между их портами.
// Настройки храним JSON-строкой: так их дёшево сравнивать и нельзя случайно изменить.
export type TSnapshotNode = {
  type: string;
  config: string;
};

export type TSnapshot = {
  nodes: Map<string, TSnapshotNode>;
  links: Set<string>;
};

export type TPortRef = [node: string, port: number];

export const linkKey = (from: TPortRef, to: TPortRef) => `${from[0]}.${from[1]}>${to[0]}.${to[1]}`;

export const parseLink = (key: string): [TPortRef, TPortRef] => {
  const [from, to] = key.split('>').map(part => {
    const dot = part.lastIndexOf('.');
    return [part.slice(0, dot), +part.slice(dot + 1)] as TPortRef;
  });

  return [from, to];
};

export const emptySnapshot = (): TSnapshot => ({ nodes: new Map(), links: new Set() });

export function sameSnapshot(a: TSnapshot, b: TSnapshot) {
  if (a.nodes.size !== b.nodes.size || a.links.size !== b.links.size)
    return false;

  for (const [id, node] of a.nodes) {
    const other = b.nodes.get(id);

    if (!other || other.type !== node.type || other.config !== node.config)
      return false;
  }

  for (const link of a.links) {
    if (!b.links.has(link))
      return false;
  }

  return true;
}

export type TSnapshotDiff = {
  remove: string[];
  add: { id: string, type: string, config: Record<string, unknown>; }[];
  update: { id: string, config: Record<string, unknown>; }[];
  unlink: string[];
  link: string[];
};

// Что сделать с состоянием from, чтобы получить to
export function diffSnapshots(from: TSnapshot, to: TSnapshot): TSnapshotDiff {
  const replaced = (id: string) => from.nodes.get(id)?.type !== to.nodes.get(id)?.type;
  const diff: TSnapshotDiff = { remove: [], add: [], update: [], unlink: [], link: [] };

  for (const id of from.nodes.keys()) {
    if (!to.nodes.has(id) || replaced(id))
      diff.remove.push(id);
  }

  for (const [id, node] of to.nodes) {
    const prev = from.nodes.get(id);

    if (!prev || replaced(id)) {
      diff.add.push({ id, type: node.type, config: JSON.parse(node.config) });
      continue;
    }

    if (prev.config === node.config)
      continue;

    const before = JSON.parse(prev.config);
    const after = JSON.parse(node.config);
    const changed: Record<string, unknown> = {};

    for (const key of Object.keys(after)) {
      if (JSON.stringify(before[key]) !== JSON.stringify(after[key]))
        changed[key] = after[key];
    }

    diff.update.push({ id, config: changed });
  }

  diff.unlink = [...from.links].filter(link => !to.links.has(link));
  diff.link = [...to.links].filter(link => !from.links.has(link));

  return diff;
}
