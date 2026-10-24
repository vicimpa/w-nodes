import { TLayoutEdge, TLayoutNode, arrange } from "./layout";
import { describe, expect, it } from "vitest";

const node = (id: number, x = 0, y = 0, width = 100, height = 60): TLayoutNode => ({ id, x, y, width, height });

const overlaps = (nodes: TLayoutNode[], result: Map<number, { x: number, y: number; }>) => {
  const boxes = nodes.map(n => ({ ...n, ...result.get(n.id)! }));

  return boxes.some((a, i) => boxes.some((b, j) => (
    i < j &&
    Math.abs(a.x - b.x) < (a.width + b.width) / 2 &&
    Math.abs(a.y - b.y) < (a.height + b.height) / 2
  )));
};

describe('arrange', () => {
  it('places a chain left to right on one line', () => {
    const nodes = [node(1, 500, 300), node(2, 0, 0), node(3, 200, 900)];
    const result = arrange(nodes, [[1, 2], [2, 3]]);
    const [a, b, c] = [1, 2, 3].map(id => result.get(id)!);

    expect(a.x).toBeLessThan(b.x);
    expect(b.x).toBeLessThan(c.x);
    expect(a.y).toBeCloseTo(b.y);
    expect(b.y).toBeCloseTo(c.y);
  });

  it('keeps the overall center', () => {
    const nodes = [node(1, 1000, 1000), node(2, 1400, 1200)];
    const result = arrange(nodes, [[1, 2]]);
    const xs = [...result.values()].map(p => p.x);
    const ys = [...result.values()].map(p => p.y);

    expect((Math.min(...xs) + Math.max(...xs)) / 2).toBeCloseTo(1200);
    expect((Math.min(...ys) + Math.max(...ys)) / 2).toBeCloseTo(1100);
  });

  it('puts a source right before the node it feeds', () => {
    // 1 → 2 → 3 → 4, и отдельный источник 5 → 4: 5 в колонке рядом с 4, а не в первой
    const nodes = [1, 2, 3, 4, 5].map(id => node(id, id * 10, id * 10));
    const result = arrange(nodes, [[1, 2], [2, 3], [3, 4], [5, 4]]);

    expect(result.get(5)!.x).toBeCloseTo(result.get(3)!.x);
  });

  it('survives cycles and never overlaps', () => {
    const nodes = Array.from({ length: 30 }, (_, i) => node(i, Math.random() * 1000, Math.random() * 1000, 80 + i % 3 * 40, 50 + i % 4 * 30));
    const edges: TLayoutEdge[] = Array.from({ length: 50 }, () => [Math.floor(Math.random() * 30), Math.floor(Math.random() * 30)]);
    edges.push([0, 1], [1, 2], [2, 0]);

    const result = arrange(nodes, edges);

    expect(result.size).toBe(30);
    expect(overlaps(nodes, result)).toBe(false);
  });

  it('wraps many lone nodes into rows', () => {
    const nodes = Array.from({ length: 40 }, (_, i) => node(i, i * 10, 0, 200, 120));
    const result = arrange(nodes, []);
    const xs = [...result.values()].map(p => p.x);

    expect(Math.max(...xs) - Math.min(...xs)).toBeLessThan(2500);
    expect(overlaps(nodes, result)).toBe(false);
  });

  it('lays out separate groups and lone nodes without overlap', () => {
    const nodes = [node(1), node(2), node(3), node(4), node(5, 0, 0, 300, 200)];
    const result = arrange(nodes, [[1, 2], [3, 4]]);

    expect(overlaps(nodes, result)).toBe(false);
    // Одиночная нода — выше графов
    expect(result.get(5)!.y).toBeLessThan(Math.min(result.get(1)!.y, result.get(3)!.y));
  });
});
