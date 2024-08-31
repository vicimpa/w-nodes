import { effect, untracked } from "@preact/signals-react";

import { NodeItem } from "../NodeItem";

export default (ctx: NodeItem) => (
  effect(() => {
    var select = ctx.selection.select.includes(ctx);

    if (select !== untracked(() => ctx.select))
      ctx.select = select;
  }),
  effect(() => {
    if (ctx.select)
      ctx.itemRef.current?.up();
  })
);