import type { NodeView } from "..";
import { Vec2 } from "@vicimpa/lib-vec2";
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
      .plus(map.x, map.y)
      .times(s);

    div.style.transform = `matrix(${s}, 0, 0, ${s}, ${-offset.x}, ${-offset.y})`;
  })
);