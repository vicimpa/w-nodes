import { Project } from "../Project";
import { dispose } from "$library/dispose";
import { effect } from "@preact/signals-react";

export default (ctx: Project) => (
  dispose(
    effect(() => {
      // Остановка всегда сбрасывает время в 0
      ctx.time.revert.value = 1;
      ctx.time.start.value = ctx.run;
    }),
    effect(() => {
      ctx.time.speed.value = ctx.temp / 60 * 4;
    })
  )
);