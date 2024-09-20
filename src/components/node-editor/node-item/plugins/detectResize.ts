import type { NodeItem } from "..";
import { effect } from "@preact/signals-react";
import { resizeObserver } from "@vicimpa/observers";

export default (ctx: NodeItem) => (
  effect(() => (
    resizeObserver(ctx.fillRef.value, ({ contentRect }) => {
      ctx.width = contentRect.width + ctx.padding * 2;
      ctx.height = contentRect.height + ctx.padding * 2;
    })
  ))
);