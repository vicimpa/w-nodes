import type { NodeMap } from "..";
import { Vec2 } from "@vicimpa/lib-vec2";
import { clamp } from "@vicimpa/math";
import { effect } from "@preact/signals-react";
import { elementEvents } from "@vicimpa/events";

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
        clamp(v - e.deltaY * v * .001, .05, 2)
      ), Vec2.fromPageXY(e));
    })
  ))
);