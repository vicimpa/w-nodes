import { Project } from "../Project";
import { dispose } from "$library/dispose";
import { effect } from "@preact/signals-react";

export default (ctx: Project) => (
  dispose(
    effect(() => {
      switch (ctx.run) {
        case 0: {
          ctx.time.revert.value = 1;
          ctx.time.start.value = 0;
          break;
        }
        case 1: {
          ctx.time.revert.value = 1;
          ctx.time.start.value = 1;
          break;
        }
        case 2: {
          ctx.time.revert.value = 0;
          ctx.time.start.value = 0;
          break;
        }
      }
    }),
    effect(() => {
      ctx.time.speed.value = ctx.temp / 60 * 4;
    })
  )
);