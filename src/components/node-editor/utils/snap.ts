export type TBox = {
  left: number;
  top: number;
  right: number;
  bottom: number;
};

// Направляющая: вертикальная линия x от y1 до y2 или горизонтальная y от x1 до x2
export type TGuide =
  | { axis: 'x', at: number, from: number, to: number; }
  | { axis: 'y', at: number, from: number, to: number; };

export type TSnap = {
  dx: number;
  dy: number;
  guides: TGuide[];
};

type TEdges = { near: number, center: number, far: number; };

const edges = (box: TBox, axis: 'x' | 'y'): TEdges => axis === 'x'
  ? { near: box.left, center: (box.left + box.right) / 2, far: box.right }
  : { near: box.top, center: (box.top + box.bottom) / 2, far: box.bottom };

// Лучший сдвиг по одной оси: выравнивание краёв и центров, плюс стыковка разными сторонами с зазором
function snapAxis(moving: TBox, others: TBox[], axis: 'x' | 'y', threshold: number, gap: number) {
  const own = edges(moving, axis);
  var best: { delta: number, at: number, target: TBox; } | null = null;

  for (const other of others) {
    const target = edges(other, axis);
    const pairs: [from: number, to: number][] = [
      [own.near, target.near],
      [own.center, target.center],
      [own.far, target.far],
      [own.near, target.far],
      [own.far, target.near],
      [own.near, target.far + gap],
      [own.far, target.near - gap],
    ];

    for (const [from, to] of pairs) {
      const delta = to - from;

      if (Math.abs(delta) <= threshold && (!best || Math.abs(delta) < Math.abs(best.delta)))
        best = { delta, at: to, target: other };
    }
  }

  return best;
}

// Сдвиг, который «примагничивает» moving к соседям, и направляющие для отрисовки
export function snapBox(moving: TBox, others: TBox[], threshold: number, gap = 0): TSnap {
  const x = snapAxis(moving, others, 'x', threshold, gap);
  const y = snapAxis(moving, others, 'y', threshold, gap);
  const dx = x?.delta ?? 0;
  const dy = y?.delta ?? 0;
  const guides: TGuide[] = [];

  if (x) {
    guides.push({
      axis: 'x',
      at: x.at,
      from: Math.min(moving.top + dy, x.target.top),
      to: Math.max(moving.bottom + dy, x.target.bottom),
    });
  }

  if (y) {
    guides.push({
      axis: 'y',
      at: y.at,
      from: Math.min(moving.left + dx, y.target.left),
      to: Math.max(moving.right + dx, y.target.right),
    });
  }

  return { dx, dy, guides };
}

export const unionBox = (boxes: TBox[]): TBox => ({
  left: Math.min(...boxes.map(box => box.left)),
  top: Math.min(...boxes.map(box => box.top)),
  right: Math.max(...boxes.map(box => box.right)),
  bottom: Math.max(...boxes.map(box => box.bottom)),
});
