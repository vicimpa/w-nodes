import { NodePort } from "../NodePort";
import { effect } from "@preact/signals-react";
import { elementEvents } from "@vicimpa/events";

export default (ctx: NodePort) => (
  effect(() => {
    return elementEvents(ctx.port.value, 'mousedown', (event) => {
      if (event.button !== 0) return;
      event.preventDefault();
      ctx.lines.fromStart(event, ...(event.metaKey || event.ctrlKey) ? (
        ctx.lines.disconnect(ctx)
      ) : [ctx]);
    });
  })
);