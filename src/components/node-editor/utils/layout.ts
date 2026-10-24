export type TLayoutNode = {
  id: number;
  // Текущий центр и размер
  x: number;
  y: number;
  width: number;
  height: number;
};

export type TLayoutEdge = [from: number, to: number];

export type TLayoutOptions = {
  columnGap?: number;
  rowGap?: number;
  groupGap?: number;
};

type TPoint = { x: number, y: number; };

// Слоистая раскладка графа слева направо по направлению сигнала.
// Возвращает новые центры нод; общий центр раскладки остаётся там, где был.
export function arrange(nodes: TLayoutNode[], edges: TLayoutEdge[], options: TLayoutOptions = {}) {
  const { columnGap = 60, rowGap = 12, groupGap = 60 } = options;
  const byId = new Map(nodes.map(node => [node.id, node]));
  const result = new Map<number, TPoint>();

  if (!nodes.length)
    return result;

  const succ = new Map(nodes.map(node => [node.id, new Set<number>()]));
  const pred = new Map(nodes.map(node => [node.id, new Set<number>()]));

  for (const [from, to] of edges) {
    if (from === to || !byId.has(from) || !byId.has(to))
      continue;

    succ.get(from)!.add(to);
    pred.get(to)!.add(from);
  }

  // Связные компоненты (без учёта направления)
  const groups: TLayoutNode[][] = [];
  const seen = new Set<number>();

  for (const node of [...nodes].sort((a, b) => a.y - b.y || a.x - b.x)) {
    if (seen.has(node.id))
      continue;

    const group: TLayoutNode[] = [];
    const queue = [node.id];
    seen.add(node.id);

    while (queue.length) {
      const id = queue.shift()!;
      group.push(byId.get(id)!);

      for (const next of [...succ.get(id)!, ...pred.get(id)!]) {
        if (!seen.has(next)) {
          seen.add(next);
          queue.push(next);
        }
      }
    }

    groups.push(group);
  }

  const singles = groups.filter(group => group.length === 1).map(([node]) => node);
  const graphs = groups.filter(group => group.length > 1);
  var top = 0;

  // Одиночные ноды (заметки и т. п.) — рядами сверху, с переносом по ширине
  if (singles.length) {
    const area = singles.reduce((sum, node) => sum + (node.width + columnGap) * (node.height + rowGap), 0);
    const limit = Math.max(1200, Math.sqrt(area) * 1.6);
    var x = 0;
    var rowHeight = 0;

    for (const node of [...singles].sort((a, b) => a.y - b.y || a.x - b.x)) {
      if (x > 0 && x + node.width > limit) {
        x = 0;
        top += rowHeight + rowGap * 2;
        rowHeight = 0;
      }

      result.set(node.id, { x: x + node.width / 2, y: top + node.height / 2 });
      x += node.width + columnGap;
      rowHeight = Math.max(rowHeight, node.height);
    }

    top += rowHeight + groupGap;
  }

  for (const group of graphs) {
    const height = layoutGroup(group, succ, columnGap, rowGap, top, result);
    top += height + groupGap;
  }

  // Сохраняем общий центр
  const box = (points: { x: number, y: number, width: number, height: number; }[]) => ({
    cx: (Math.min(...points.map(p => p.x - p.width / 2)) + Math.max(...points.map(p => p.x + p.width / 2))) / 2,
    cy: (Math.min(...points.map(p => p.y - p.height / 2)) + Math.max(...points.map(p => p.y + p.height / 2))) / 2,
  });

  const before = box(nodes);
  const after = box(nodes.map(node => ({ ...node, ...result.get(node.id)! })));
  const dx = before.cx - after.cx;
  const dy = before.cy - after.cy;

  for (const point of result.values()) {
    point.x += dx;
    point.y += dy;
  }

  return result;
}

function layoutGroup(
  group: TLayoutNode[],
  succ: Map<number, Set<number>>,
  columnGap: number,
  rowGap: number,
  top: number,
  result: Map<number, TPoint>,
) {
  const ids = new Set(group.map(node => node.id));
  const byId = new Map(group.map(node => [node.id, node]));

  // Убираем циклы: ребро в узел, который ещё на стеке обхода, не учитываем
  const forward = new Map(group.map(node => [node.id, [] as number[]]));
  const state = new Map<number, 1 | 2>();

  const visit = (id: number) => {
    state.set(id, 1);

    for (const next of succ.get(id)!) {
      if (!ids.has(next) || state.get(next) === 1)
        continue;

      forward.get(id)!.push(next);

      if (!state.has(next))
        visit(next);
    }

    state.set(id, 2);
  };

  for (const node of [...group].sort((a, b) => a.x - b.x || a.y - b.y)) {
    if (!state.has(node.id))
      visit(node.id);
  }

  const backward = new Map(group.map(node => [node.id, [] as number[]]));

  for (const [from, list] of forward) {
    for (const to of list)
      backward.get(to)!.push(from);
  }

  // Слой — длина самого длинного пути от источника
  const layer = new Map<number, number>();
  const order: number[] = [];
  const incoming = new Map(group.map(node => [node.id, backward.get(node.id)!.length]));
  const queue = group.filter(node => !incoming.get(node.id)).map(node => node.id);

  while (queue.length) {
    const id = queue.shift()!;
    order.push(id);
    layer.set(id, Math.max(0, ...backward.get(id)!.map(from => layer.get(from)! + 1)));

    for (const next of forward.get(id)!) {
      incoming.set(next, incoming.get(next)! - 1);

      if (!incoming.get(next))
        queue.push(next);
    }
  }

  // Источники ставим вплотную к первой ноде, которую они питают
  for (const id of order) {
    const next = forward.get(id)!;

    if (!backward.get(id)!.length && next.length)
      layer.set(id, Math.min(...next.map(to => layer.get(to)!)) - 1);
  }

  const shift = Math.min(...layer.values());
  const columns: number[][] = [];

  for (const id of order) {
    const index = layer.get(id)! - shift;
    (columns[index] ??= []).push(id);
  }

  for (const column of columns)
    column?.sort((a, b) => byId.get(a)!.y - byId.get(b)!.y);

  // Порядок в колонках: несколько проходов по среднему положению соседей — меньше пересечений
  const position = new Map<number, number>();
  const index = () => columns.forEach(column => column?.forEach((id, i) => position.set(id, i)));
  const sweep = (column: number[], neighbours: (id: number) => number[]) => {
    const weight = new Map(column.map(id => {
      const list = neighbours(id).filter(other => position.has(other));
      return [id, list.length ? list.reduce((s, other) => s + position.get(other)!, 0) / list.length : position.get(id)!];
    }));

    column.sort((a, b) => weight.get(a)! - weight.get(b)!);
  };

  index();

  for (let pass = 0; pass < 4; pass++) {
    for (let i = 1; i < columns.length; i++) {
      if (columns[i]) sweep(columns[i], id => backward.get(id)!);
      index();
    }

    for (let i = columns.length - 2; i >= 0; i--) {
      if (columns[i]) sweep(columns[i], id => forward.get(id)!);
      index();
    }
  }

  // Координаты: колонки слева направо, внутри колонки — стопкой, колонки центрированы по высоте
  const heights = columns.map(column => (
    column ? column.reduce((s, id) => s + byId.get(id)!.height, 0) + rowGap * (column.length - 1) : 0
  ));
  const height = Math.max(...heights);
  var left = 0;

  columns.forEach((column, i) => {
    if (!column)
      return;

    const width = Math.max(...column.map(id => byId.get(id)!.width));
    var y = top + (height - heights[i]) / 2;

    for (const id of column) {
      const node = byId.get(id)!;
      result.set(id, { x: left + width / 2, y: y + node.height / 2 });
      y += node.height + rowGap;
    }

    left += width + columnGap;
  });

  return height;
}
