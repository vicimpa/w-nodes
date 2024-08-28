import type { NodeMap } from "..";
import { Vec2 } from "$library/vec2";
import { effect } from "@preact/signals-react";
import { elementEvents } from "$library/events";
import { makeDrag } from "$library/drag";

export default (ctx: NodeMap) => (
  effect(() => {
    const drag = makeDrag(() => {
      const start = new Vec2(ctx);
      ctx.move = true;
      if (ctx.div.value)
        ctx.div.value.style.cursor = 'move';
      return ({ delta }) => {
        delta.div(ctx.s)
          .plus(start)
          .toObject(ctx);

        return () => {
          ctx.move = false;
          if (ctx.div.value)
            ctx.div.value.style.cursor = 'default';
        };
      };
    }, 1);

    return elementEvents(ctx.div.value, 'mousedown', drag);
  })
); 