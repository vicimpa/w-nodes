import { TSnapshot, diffSnapshots, emptySnapshot, linkKey, parseLink, sameSnapshot } from "./historyDiff";
import { describe, expect, it } from "vitest";

const snapshot = (nodes: Record<string, [string, object]>, links: string[] = []): TSnapshot => ({
  nodes: new Map(Object.entries(nodes).map(([id, [type, config]]) => [id, { type, config: JSON.stringify(config) }])),
  links: new Set(links),
});

describe('history snapshots', () => {
  it('round-trips link keys', () => {
    const key = linkKey(['a1b2', 3], ['zz9', 0]);
    expect(parseLink(key)).toEqual([['a1b2', 3], ['zz9', 0]]);
  });

  it('compares snapshots by content', () => {
    const a = snapshot({ n1: ['Gain', { x: 1, _gain: 0.5 }] }, [linkKey(['n1', 2], ['n2', 0])]);
    const b = snapshot({ n1: ['Gain', { x: 1, _gain: 0.5 }] }, [linkKey(['n1', 2], ['n2', 0])]);

    expect(sameSnapshot(a, b)).toBe(true);
    expect(sameSnapshot(a, snapshot({ n1: ['Gain', { x: 2, _gain: 0.5 }] }))).toBe(false);
    expect(sameSnapshot(a, emptySnapshot())).toBe(false);
  });

  it('describes added, removed and changed nodes', () => {
    const from = snapshot({
      keep: ['Gain', { x: 0, y: 0, _gain: 1 }],
      gone: ['Delay', { x: 5, y: 5 }],
      swap: ['Math', { _p: 'plus' }],
    });
    const to = snapshot({
      keep: ['Gain', { x: 10, y: 0, _gain: 1 }],
      fresh: ['Oscillator', { x: 3, y: 4, _freq: 440 }],
      swap: ['Toggle', { _toggle: 1 }],
    });

    const diff = diffSnapshots(from, to);

    expect(diff.remove.sort()).toEqual(['gone', 'swap']);
    expect(diff.add).toEqual([
      { id: 'fresh', type: 'Oscillator', config: { x: 3, y: 4, _freq: 440 } },
      { id: 'swap', type: 'Toggle', config: { _toggle: 1 } },
    ]);
    expect(diff.update).toEqual([{ id: 'keep', config: { x: 10 } }]);
  });

  it('describes link changes', () => {
    const ab = linkKey(['a', 1], ['b', 0]);
    const bc = linkKey(['b', 1], ['c', 0]);
    const ac = linkKey(['a', 1], ['c', 0]);

    const diff = diffSnapshots(snapshot({}, [ab, bc]), snapshot({}, [ab, ac]));

    expect(diff.unlink).toEqual([bc]);
    expect(diff.link).toEqual([ac]);
  });

  it('undo then redo returns to the same state', () => {
    const a = snapshot({ n: ['Gain', { _gain: 1 }] }, []);
    const b = snapshot({ n: ['Gain', { _gain: 0.2 }], m: ['Delay', {}] }, [linkKey(['n', 1], ['m', 0])]);

    expect(diffSnapshots(b, a)).toEqual({ remove: ['m'], add: [], update: [{ id: 'n', config: { _gain: 1 } }], unlink: [linkKey(['n', 1], ['m', 0])], link: [] });
    expect(diffSnapshots(a, b).add).toEqual([{ id: 'm', type: 'Delay', config: {} }]);
  });
});
