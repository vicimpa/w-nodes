import { NodeSelection } from "../NodeSelection";
import { dispose } from "$library/dispose";
import { windowEvents } from "@vicimpa/events";

export default (ctx: NodeSelection) => (
  dispose(
    windowEvents(['mousedown', 'mouseup', 'mousemove', 'mousedown', 'mouseup'], (e) => {
      ctx.shiftKey = e.shiftKey;
    })
  )
);