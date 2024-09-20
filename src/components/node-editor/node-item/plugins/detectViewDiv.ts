import type { NodeItem } from "..";
import { Vec2 } from "@vicimpa/lib-vec2";
import { effect } from "@preact/signals-react";

export default (ctx: NodeItem) => (
  effect(() => {
    const { value: div } = ctx.viewDivRef;

    if (!div) return;

    const size = Vec2.fromSize(ctx);
    const _ctx = new Vec2(ctx).round();
    const pos = size.cdiv(2).times(-1).plus(_ctx);
    div.style.transform = `translate(${pos.x}px, ${pos.y}px)`;
  })
);