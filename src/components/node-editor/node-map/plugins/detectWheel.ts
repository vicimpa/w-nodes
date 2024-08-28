import type { NodeMap } from "..";
import { Vec2 } from "$library/vec2";
import { effect } from "@preact/signals-react";
import { elementEvents } from "$library/events";
import { minMax } from "$library/math";

export default (ctx: NodeMap) => (
  effect(() => (
    elementEvents(ctx.div.value, 'wheel', (e) => {
      if (ctx.move) return;

      e.preventDefault();
      e.stopPropagation();

      if (!e.ctrlKey) {
        const delta = Vec2.fromDeltaXY(e);

        delta
          .div(ctx.s)
          .plus(ctx)
          .toObject(ctx);

        return;
      }

      ctx.toScale(v => (
        minMax(v - e.deltaY * v * .001, .2, 10)
      ), Vec2.fromPageXY(e));
    })
  ))
);