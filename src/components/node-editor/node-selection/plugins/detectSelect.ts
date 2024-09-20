import { NodeSelection } from "../NodeSelection";
import { Vec2 } from "@vicimpa/lib-vec2";
import { dispose } from "$library/dispose";
import { effect } from "@preact/signals-react";
import { windowEvents } from "@vicimpa/events";

export default (ctx: NodeSelection) => (
  dispose(
    effect(() => {
      if (!ctx.view) {
        ctx._select = null;
        return;
      }

      var [from, to] = ctx.view;

      if (ctx.shiftKey && !ctx._select)
        ctx._select = [...ctx.select];

      ctx.toSelect(...[...ctx.list.items].filter(node => {
        const double = Vec2.fromSize(node).times(.5).minus(node.padding);
        const a = new Vec2(node).minus(double);
        const b = new Vec2(node).plus(double);
        return a.x < to.x && b.x > from.x && a.y < to.y && b.y > from.y;
      }));
    }),
    windowEvents('keydown', e => {
      if ((e.metaKey || e.ctrlKey) && e.code == 'KeyA') {
        e.preventDefault();
        ctx.select = [...ctx.list.items];

      }
    })
  )
);