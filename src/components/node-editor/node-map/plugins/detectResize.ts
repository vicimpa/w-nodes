import type { NodeMap } from "..";
import { effect } from "@preact/signals-react";
import { resizeObserver } from "$library/observers";

export default (ctx: NodeMap) => (
  effect(() => (
    resizeObserver(ctx.div.value, (entry) => {
      ctx.rect = entry.contentRect;
    })
  ))
);