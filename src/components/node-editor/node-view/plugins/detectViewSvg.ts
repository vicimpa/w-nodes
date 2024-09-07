import type { NodeView } from "..";
import { effect } from "@preact/signals-react";

export default (ctx: NodeView) => (
  effect(() => {
    const { map } = ctx;
    const { value: svg } = ctx.svg;
    if (!svg) return;
    Object.assign(svg.viewBox.baseVal, map.view.toJSON());
  })
);