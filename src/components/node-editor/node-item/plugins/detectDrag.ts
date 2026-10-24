import { NodeItem } from "../NodeItem";
import { vec2, Vec2 } from "@vicimpa/lib-vec2";
import { batch, effect } from "@preact/signals-react";
import { TBox, snapBox, unionBox } from "../../utils/snap";
import { elementEvents, windowEvents } from "@vicimpa/events";
import { dispose as dispose_ } from "$library/dispose";
import { frames } from "$library/frames";
import { makeDrag } from "@vicimpa/easy-drag";

// Видимая карточка ноды (без прозрачной рамки padding) при центре в x, y
export const cardBox = (item: NodeItem, x = item.x, y = item.y): TBox => ({
  left: Math.round(x) - item.width / 2 + item.padding,
  right: Math.round(x) + item.width / 2 - item.padding,
  top: Math.round(y) - item.height / 2 + item.padding,
  bottom: Math.round(y) + item.height / 2 - item.padding,
});

// Магнит срабатывает ближе этого расстояния на экране; зазор при стыковке разными сторонами — в единицах карты
const snapDistance = 8;
const snapGap = 24;

export const dragNodeItem = makeDrag<[ctx: NodeItem, elem: HTMLElement]>(({ start, current: now }, ctx, elem) => {
  elem.style.cursor = 'grabbing';

  const { map, selection } = ctx;
  const offset = map.offset(vec2(start));
  const items = [...selection.select];
  const corrects = items.map(e => new Vec2(e).minus(offset));
  const current = vec2(now);
  const others = [...ctx.list.items].filter(item => !items.includes(item)).map(item => cardBox(item));
  var free = false;

  const dispose = dispose_(
    // Alt — двигать без магнитов
    windowEvents(['keydown', 'keyup', 'mousemove'], e => free = e.altKey),
    frames((dtime) => {
      map.calcViewTransitionVec(current, dtime)
        .toObject(map);

      const offset = map.offset(current);
      const moved = corrects.map(e => e.cplus(offset));
      const snap = free || !others.length ? null : snapBox(
        unionBox(moved.map((pos, i) => cardBox(items[i], pos.x, pos.y))),
        others,
        snapDistance / map.s,
        snapGap
      );

      // Одной пачкой: иначе подписчики (порты, провода) срабатывают на x и y по отдельности
      batch(() => {
        moved.forEach((pos, i) => {
          pos.plus(snap?.dx ?? 0, snap?.dy ?? 0).toObject(items[i]);
        });

        selection.guides = snap?.guides ?? [];
      });
    }),
    () => selection.guides = []
  );

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

    for (const elem of div.querySelectorAll('[data-drag]')) {
      if (!(elem instanceof HTMLElement) || (target !== elem && !elem.contains(target)))
        continue;

      // Shift+клик по заголовку добавляет ноду в выделение или убирает из него
      if (event.shiftKey) {
        ctx.selection.shiftKey = true;
        ctx.selection.toSelect(ctx);
        return;
      }

      return dragNodeItem(event, ctx, elem);
    }
  }))
);