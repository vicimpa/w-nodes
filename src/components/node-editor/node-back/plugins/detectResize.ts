import { NodeBack } from "..";
import { effect } from "@preact/signals-react";
import { resizeObserver } from "@vicimpa/observers";

export default (ctx: NodeBack<any>) => (
  effect(() => (
    resizeObserver(ctx.group.value, ({ contentRect }) => {
      if (!ctx.pattern.value) return;
      ctx.pattern.value.width.baseVal.value = contentRect.width;
      ctx.pattern.value.height.baseVal.value = contentRect.height;
    })
  ))
);