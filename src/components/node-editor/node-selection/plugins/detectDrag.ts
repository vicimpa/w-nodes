import { max, min } from "$library/math";

import { NodeSelection } from "../NodeSelection";
import { Vec2 } from "$library/vec2";
import { effect } from "@preact/signals-react";
import { elementEvents } from "$library/events";
import { frames } from "$library/frames";
import { makeDrag } from "$library/drag";

const select = makeDrag<[ctx: NodeSelection]>(({ current }, ctx) => {
  const { map } = ctx;

  const a = map.offset(current);

  const dispose = frames((dtime) => {
    map.calcViewTransitionVec(current, dtime)
      .toObject(map);

    const b = map.offset(current);

    const from = new Vec2(min(a.x, b.x), min(a.y, b.y));
    const to = new Vec2(max(a.x, b.x), max(a.y, b.y));

    if (!from.equal(from) || to.equal(to)) {
      ctx.view = [from, to];
    }
  });

  return ({ current: newCurrent }) => {
    current.set(newCurrent);

    return () => {
      ctx.view = null;
      dispose();
    };
  };
});

export default (ctx: NodeSelection) => (
  effect(() => elementEvents(ctx.map.div.value, 'mousedown', e => {
    if (!e.button) {
      if (!e.shiftKey && e.target instanceof HTMLElement)
        return;
      select(e, ctx);
      ctx.shiftKey = e.shiftKey;
    }
  }))
);