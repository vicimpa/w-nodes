import { NodeBack } from "..";
import { Vec2 } from "@vicimpa/lib-vec2";
import { dispose } from "$library/dispose";
import { effect } from "@preact/signals-react";

export default (ctx: NodeBack<any>) => (
  dispose(
    effect(() => {
      const pos = new Vec2(ctx)
        .times(-1)
        .times(ctx.block)
        .minus(ctx.block / 2);

      const size = Vec2.fromSize(ctx)
        .cropMin(1)
        .plus(ctx)
        .times(ctx.block);

      if (!ctx.rect.value)
        return;

      const rect = new DOMRect(...pos, ...size);
      ctx.rect.value.x.baseVal.value = rect.x;
      ctx.rect.value.y.baseVal.value = rect.y;
      ctx.rect.value.width.baseVal.value = rect.width;
      ctx.rect.value.height.baseVal.value = rect.height;
    })
  )
);