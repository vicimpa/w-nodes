import { batch, effect } from "@preact/signals-react";

import type { NodeMap } from "..";
import { resizeObserver } from "@vicimpa/observers";

export default (ctx: NodeMap) => (
  effect(() => (
    resizeObserver(ctx.div.value, (entry) => {
      batch(() => {
        ctx.top = entry.contentRect.top;
        ctx.left = entry.contentRect.left;
        ctx.width = entry.contentRect.width;
        ctx.height = entry.contentRect.height;
      });
    })
  ))
);