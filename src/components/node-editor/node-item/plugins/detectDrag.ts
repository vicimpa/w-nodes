import { NodeItem } from "../NodeItem";
import { Vec2 } from "$library/vec2";
import { dispose } from "$library/dispose";
import { effect } from "@preact/signals-react";
import { elementEvents } from "$library/events";
import { frames } from "$library/frames";
import { makeDrag } from "$library/drag";

export default (ctx: NodeItem) => (
  effect(() => {
    const { map } = ctx;

    const drag = makeDrag<HTMLElement>(({ start, current, meta }) => {
      if (meta) meta.style.cursor = 'grabbing';

      const offset = map.offset(start);
      const correct = new Vec2(ctx)
        .minus(offset);

      const _dispose = dispose(
        frames((dtime) => {
          map.calcViewTransitionVec(current, dtime)
            .toObject(map);

          const offset = map.offset(current);

          correct
            .cplus(offset)
            .toObject(ctx);
        })
      );

      return ({ current: newCurrent }) => {
        current.set(newCurrent);

        return () => {
          if (meta) meta.style.cursor = '';
          _dispose();
        };
      };
    });


    return elementEvents(ctx.fill.value, 'mousedown', (event) => {
      const { value: div } = ctx.fill;
      const { target } = event;

      if (event.button !== 0) return;

      ctx.up();

      if (!div) return;
      if (!(target instanceof HTMLElement)) return;

      for (const elem of div.querySelectorAll('[data-drag]')) {
        if (target === elem || elem.contains(target))
          if (elem instanceof HTMLElement)
            return drag(event, elem);
      }
    });
  })
);