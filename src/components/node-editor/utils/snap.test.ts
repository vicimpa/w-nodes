import { describe, expect, it } from "vitest";
import { snapBox, unionBox } from "./snap";

const box = (left: number, top: number, width: number, height: number) => ({
  left, top, right: left + width, bottom: top + height,
});

describe('snapBox', () => {
  const other = box(0, 0, 100, 50);

  it('aligns same sides within the threshold', () => {
    const snap = snapBox(box(4, 200, 100, 50), [other], 8);
    expect(snap.dx).toBe(-4);
    expect(snap.dy).toBe(0);
    expect(snap.guides).toEqual([{ axis: 'x', at: 0, from: 0, to: 250 }]);
  });

  it('aligns centers', () => {
    const snap = snapBox(box(300, 5 + 10, 40, 20), [other], 8);
    // центр moving по y = 25, у other = 25 → уже ровно; по x далеко
    expect(snap.dy).toBe(0);
    expect(snap.guides.map(guide => guide.axis)).toEqual(['y']);
  });

  it('docks opposite sides with a gap', () => {
    const snap = snapBox(box(126, 300, 50, 50), [other], 8, 24);
    expect(snap.dx).toBe(-2);
    expect(snap.guides[0]).toMatchObject({ axis: 'x', at: 124 });
  });

  it('picks the closest candidate and ignores far ones', () => {
    const near = box(200, 0, 100, 50);
    const snap = snapBox(box(203, 500, 100, 50), [other, near], 8);
    expect(snap.dx).toBe(-3);
    expect(snapBox(box(500, 500, 10, 10), [other], 8)).toEqual({ dx: 0, dy: 0, guides: [] });
  });

  it('unions boxes', () => {
    expect(unionBox([box(0, 0, 10, 10), box(20, -5, 10, 10)])).toEqual({ left: 0, top: -5, right: 30, bottom: 10 });
  });
});
