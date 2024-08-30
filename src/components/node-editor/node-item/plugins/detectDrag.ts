import { NodeItem } from "../NodeItem";
import { Vec2 } from "$library/vec2";
import { dispose } from "$library/dispose";
import { effect } from "@preact/signals-react";
import { elementEvents } from "$library/events";
import { frames } from "$library/frames";
import { makeDrag } from "$library/drag";

export const dragNodeItem = makeDrag<[ctx: NodeItem, elem: HTMLElement]>(({ start, current }, ctx, elem) => {
  elem.style.cursor = 'grabbing';

  const { map } = ctx;
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
      elem.style.cursor = '';
      _dispose();
    };
  };
});

export default (ctx: NodeItem) => (
  effect(() => elementEvents(ctx.fillRef.value, 'mousedown', (event) => {
    const { value: div } = ctx.fillRef;
    const { target } = event;

    ctx.itemRef.current?.up();
    if (!ctx.select) {

      ctx.selection.select = event.shiftKey ? [
        ...ctx.selection.select, ctx
      ] : [ctx];
    }

    if (!div || event.button !== 0) return;
    if (!(target instanceof HTMLElement)) return;

    for (const elem of div.querySelectorAll('[data-drag]')) {
      if (target === elem || elem.contains(target))
        if (elem instanceof HTMLElement) {
          for (const _ctx of new Set(ctx.selection.select))
            dragNodeItem(event, _ctx, elem);
          return;
        }
    }
  }))
);