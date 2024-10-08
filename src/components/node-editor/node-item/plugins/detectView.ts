import type { NodeItem } from "..";
import { Vec2 } from "@vicimpa/lib-vec2";
import { effect } from "@preact/signals-react";

export default (ctx: NodeItem) => (
  effect(() => {
    if (!ctx.viewRef.value)
      return;

    const size = Vec2.fromSize(ctx);
    const _ctx = new Vec2(ctx).round();
    const pos = size.cdiv(2).times(-1).plus(_ctx);

    ctx.viewRef.value.x.baseVal.value = pos.x;
    ctx.viewRef.value.y.baseVal.value = pos.y;
    ctx.viewRef.value.width.baseVal.value = size.x;
    ctx.viewRef.value.height.baseVal.value = size.y;
  })
);