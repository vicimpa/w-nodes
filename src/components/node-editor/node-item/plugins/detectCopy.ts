import { NodeItem } from "../NodeItem";
import { effect } from "@preact/signals-react";
import { elementEvents } from "$library/events";

var storeType: typeof NodeItem | null;
var storeConfig: object | null;

export default (ctx: NodeItem) => (
  effect(() => (
    elementEvents(ctx.fillRef.value, 'mousedown', e => {
      if (!e.metaKey && !e.ctrlKey)
        return;

      const type = ctx.project.nodes.find(e => ctx instanceof e);

      if (!type)
        return;

      if (e.button === 0) {
        if (storeType === type && storeConfig) {
          ctx.project.restore(ctx, storeConfig);
        }
      }

      if (e.button === 2) {
        storeType = type;
        storeConfig = ctx.project.save(ctx);
      }
    })
  ))
);