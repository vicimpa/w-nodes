import { NodePort } from "../NodePort";
import { effect } from "@preact/signals-react";
import { elementEvents } from "@vicimpa/events";

export default (ctx: NodePort) => (
  effect(() => (
    elementEvents(ctx.port.value, 'mouseup', () => {
      ctx.lines.connect(ctx);
    })
  ))
);