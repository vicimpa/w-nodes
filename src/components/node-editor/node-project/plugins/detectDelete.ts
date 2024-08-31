import { NodeProject } from "../NodeProject";
import { windowEvents } from "$library/events";

const deleteKeys = ['Backspace', 'Delete'];

export default (ctx: NodeProject) => (
  windowEvents('keydown', e => {
    if (deleteKeys.includes(e.key)) {
      ctx.destroy(...ctx.selection.select);
    }
  })
);