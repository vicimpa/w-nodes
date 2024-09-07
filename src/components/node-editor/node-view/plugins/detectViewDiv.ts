import type { NodeView } from "..";
import { Vec2 } from "$library/vec2";
import { effect } from "@preact/signals-react";

export default (ctx: NodeView) => (
  effect(() => {
    const { map } = ctx;
    const { value: div } = ctx.div;
    if (!div) return;

    const { s } = map;
    const { rect } = map;
    const offset = Vec2.fromSize(rect)
      .div(-2)
      .div(1, s)
      .plus(map.x, map.y);

    div.style.transform = `scale(${s}) translate(${-offset.x}px, ${- offset.y}px) `;
  })
);