import { NodeItem } from "../NodeItem";
import { vec2, Vec2 } from "@vicimpa/lib-vec2";
import { effect } from "@preact/signals-react";
import { elementEvents } from "@vicimpa/events";
import { frames } from "$library/frames";
import { makeDrag } from "@vicimpa/easy-drag";

export const dragNodeItem = makeDrag<[ctx: NodeItem, elem: HTMLElement]>(({ start, current: now }, ctx, elem) => {
  elem.style.cursor = 'grabbing';

  const { map } = ctx;
  const offset = map.offset(vec2(start));
  const items = [...ctx.selection.select];
  const corrects = items.map(e => new Vec2(e).minus(offset));
  const current = vec2(now);

  const dispose = frames((dtime) => {
    map.calcViewTransitionVec(current, dtime)
      .toObject(map);

    const offset = map.offset(current);

    corrects.forEach((e, i) => {
      e.cplus(offset)
        .toObject(items[i]);
    });
  });

  return ({ current: newCurrent }) => {
    current.set(newCurrent);

    return () => {
      elem.style.cursor = '';
      dispose();
    };
  };
});

export default (ctx: NodeItem) => (
  effect(() => elementEvents(ctx.fillRef.value, 'mousedown', (event) => {
    const { value: div } = ctx.fillRef;
    const { target } = event;

    if (!ctx.select && !event.shiftKey)
      ctx.selection.toSelect(ctx);

    if (!div || event.button !== 0) return;
    if (!(target instanceof HTMLElement)) return;

    if (event.shiftKey)
      return;

    for (const elem of div.querySelectorAll('[data-drag]')) {
      if (target === elem || elem.contains(target))
        if (elem instanceof HTMLElement)
          return dragNodeItem(event, ctx, elem);
    }
  }))
);