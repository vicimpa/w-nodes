import { Project } from "../Project";
import { effect } from "@preact/signals-react";

export default (ctx: Project) => {
  effect(() => {
    if (!ctx.controlls && ctx.run) {
      ctx.run = 0;
    }
  });
};