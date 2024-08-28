import type { NodeFrame } from "..";
import { effect } from "@preact/signals-react";
import { resizeObserver } from "$library/observers";

export default (ctx: NodeFrame) => (
  effect(() => (
    resizeObserver(ctx.fill.value, ({ contentRect }) => {
      ctx.width = contentRect.width;
      ctx.height = contentRect.height;
      if (ctx.frame.value) {
        ctx.frame.value.width = contentRect.width + 'px';
        ctx.frame.value.height = contentRect.height + 'px';
      }
    })
  ))
);