import { NodeProject } from "../NodeProject";
import { isFocused } from "../../node-map";
import { windowEvents } from "@vicimpa/events";

const deleteKeys = ['Backspace', 'Delete'];

export default (ctx: NodeProject) => (
  windowEvents('keydown', e => {
    if (deleteKeys.includes(e.key) && isFocused(ctx.map)) {
      ctx.destroy(...ctx.selection.select);
    }
  })
);