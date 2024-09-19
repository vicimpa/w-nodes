import { Project } from "../Project";
import { dispose } from "$library/dispose";
import { pipe } from "$components/audio-context/lib/pipe";
import { start } from "$components/audio-context/lib/start";

export default (ctx: Project) => (
  dispose(
    pipe(ctx.time, ctx.timeView),
    start(ctx.timeView),
    () => ctx.time.destroy(),
  )
);