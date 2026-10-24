import { batch, effect } from "@preact/signals-react";

import type { NodeMap } from "..";
import { resizeObserver } from "@vicimpa/observers";

export default (ctx: NodeMap) => (
  effect(() => (
    resizeObserver(ctx.div.value, (entry) => {
      // Положение на странице, а не отступы из contentRect: карта может быть не в углу окна
      const rect = entry.target.getBoundingClientRect();

      batch(() => {
        ctx.top = rect.top;
        ctx.left = rect.left;
        ctx.width = entry.contentRect.width;
        ctx.height = entry.contentRect.height;
      });
    })
  ))
);
