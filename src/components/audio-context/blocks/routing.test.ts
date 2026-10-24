import { Routing, TPair, bridgePairs } from "./routing";
import { describe, expect, it } from "vitest";

import type { TSlot } from "./state";

// Модель Web Audio: множество рёбер «узел → узел», повторный connect ничего не добавляет
const audio = () => {
  const edges = new Set<string>();
  const log: string[] = [];

  return {
    edges,
    log,
    io: {
      connect: (a: string, b: string) => {
        edges.add(`${a}>${b}`);
        log.push(`+${a}>${b}`);
      },
      disconnect: (a: string, b: string) => {
        edges.delete(`${a}>${b}`);
        log.push(`-${a}>${b}`);
      },
    },
    // Доходит ли сигнал из from в to
    reaches(from: string, to: string, extra: string[] = []) {
      const all = [...edges, ...extra].map(e => e.split('>') as TPair<string>);
      const seen = new Set([from]);
      const queue = [from];

      while (queue.length) {
        const node = queue.shift()!;

        for (const [a, b] of all) {
          if (a === node && !seen.has(b)) {
            seen.add(b);
            queue.push(b);
          }
        }
      }

      return seen.has(to);
    },
  };
};

const slots: TSlot[] = [
  { id: 'x', kind: 'in', label: 'in' },
  { id: 'y', kind: 'out', label: 'out' },
];

const outer = (id: string) => `outer:${id}`;
const inner = (id: string) => `inner:${id}`;

describe('slot bridges', () => {
  it('route in-slots outside → inside and out-slots inside → outside', () => {
    expect(bridgePairs(slots, outer, inner)).toEqual([
      ['outer:x', 'inner:x'],
      ['inner:y', 'outer:y'],
    ]);
  });

  it('keep the old shared-gain semantics: what reached a slot still reaches the same ports', () => {
    const { io, reaches } = audio();
    const routing = new Routing(io);

    routing.set(bridgePairs(slots, outer, inner));

    // Раньше: source → gain:x → target, inner → gain:y → sink. Теперь между ними мост.
    const wires = ['source>outer:x', 'inner:x>target', 'target>inner:y', 'outer:y>sink'];

    expect(reaches('source', 'target', wires)).toBe(true);
    expect(reaches('source', 'sink', wires)).toBe(true);
    // Обратно сигнал не идёт, как и с одним GainNode
    expect(reaches('sink', 'source', wires)).toBe(false);
    expect(reaches('target', 'source', wires)).toBe(false);
  });

  it('are dropped while compiled and restored exactly after', () => {
    const { io, edges } = audio();
    const routing = new Routing(io);
    const bridges = bridgePairs(slots, outer, inner);

    routing.set(bridges);
    const before = [...edges].sort();

    routing.set([['outer:x', 'outer:y']]);
    expect([...edges]).toEqual(['outer:x>outer:y']);

    routing.set(bridges);
    expect([...edges].sort()).toEqual(before);
  });

  it('follow added and removed slots', () => {
    const { io, edges } = audio();
    const routing = new Routing(io);

    routing.set(bridgePairs(slots, outer, inner));
    routing.set(bridgePairs([...slots, { id: 'z', kind: 'in', label: 'z' }], outer, inner));
    expect(edges.has('outer:z>inner:z')).toBe(true);

    routing.set(bridgePairs(slots.slice(1), outer, inner));
    expect([...edges]).toEqual(['inner:y>outer:y']);

    routing.clear();
    expect(edges.size).toBe(0);
  });

  it('never re-connects or drops a pair that stays', () => {
    const { io, log } = audio();
    const routing = new Routing(io);

    routing.set([['a', 'b'], ['a', 'b'], ['b', 'c']]);
    log.length = 0;
    routing.set([['a', 'b'], ['c', 'd']]);

    expect(log).toEqual(['-b>c', '+c>d']);
    expect(routing.pairs).toEqual([['a', 'b'], ['c', 'd']]);
  });
});
