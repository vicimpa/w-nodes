import { NodeSelection } from "../NodeSelection";
import { dispose } from "$library/dispose";
import { effect } from "@preact/signals-react";
import { windowEvents } from "$library/events";

export default (ctx: NodeSelection) => (
  dispose(
    windowEvents('keydown', e => {
      ctx._shiftCount += +e.code.startsWith('Shift');
    }),
    windowEvents('keyup', e => {
      ctx._shiftCount -= +e.code.startsWith('Shift');
      if (ctx._shiftCount < 0) ctx._shiftCount = 0;
    }),
    windowEvents('blur', () => {
      ctx._shiftCount = 0;
    }),
    effect(() => {
      ctx.shiftKey = !!ctx._shiftCount;
    })
  )
);