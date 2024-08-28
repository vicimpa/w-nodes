import { elementEvents, windowEvents } from "$library/events";

import { NodePort } from "../NodePort";
import { dispose } from "$library/dispose";
import { effect } from "@preact/signals-react";

export default (ctx: NodePort) => (
  effect(() => (
    dispose(
      elementEvents(ctx.port.value, 'mouseenter', () => {
        ctx.hover = true;
      }),
      elementEvents(ctx.port.value, 'mouseover', () => {
        ctx.hover = true;
      }),
      elementEvents(ctx.port.value, 'mouseout', () => {
        ctx.hover = false;
      }),
      windowEvents('blur', () => {
        ctx.hover = false;
      })
    )
  ))
);