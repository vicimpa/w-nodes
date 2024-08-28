import type { NodeItem } from "..";
import { effect } from "@preact/signals-react";
import { resizeObserver } from "$library/observers";

export default (ctx: NodeItem) => (
  effect(() => (
    resizeObserver(ctx.fill.value, ({ contentRect }) => {
      ctx.width = contentRect.width;
      ctx.height = contentRect.height;
    })
  ))
);