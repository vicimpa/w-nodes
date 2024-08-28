import type { NodeItem } from "..";
import { Vec2 } from "$library/vec2";
import { effect } from "@preact/signals-react";

export default (ctx: NodeItem) => (
  effect(() => {
    const size = Vec2.fromSize(ctx);
    const pos = size.cdiv(2).times(-1).plus(ctx);

    if (!ctx.view.value)
      return;

    ctx.view.value.x.baseVal.value = pos.x;
    ctx.view.value.y.baseVal.value = pos.y;
    ctx.view.value.width.baseVal.value = size.x;
    ctx.view.value.height.baseVal.value = size.y;
  })
);