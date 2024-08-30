import { NodeItem } from "../NodeItem";
import { effect } from "@preact/signals-react";

export default (ctx: NodeItem) => (
  effect(() => {
    ctx.select = ctx.selection.select.includes(ctx);
    return () => {
      ctx.select = false;
    };
  })
);