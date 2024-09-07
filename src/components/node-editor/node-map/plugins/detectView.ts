import type { NodeMap } from "..";
import { Vec2 } from "$library/vec2";
import { effect } from "@preact/signals-react";

export default (ctx: NodeMap) => (
  effect(() => {
    const size = Vec2.fromSize(ctx.rect).div(ctx.s);
    const pos = size.cdiv(-2).plus(ctx);
    ctx.view = new DOMRect(...pos, ...size);
  })
);