import { NodeSelection } from "../NodeSelection";
import { Vec2 } from "$library/vec2";
import { effect } from "@preact/signals-react";

export default (ctx: NodeSelection) => (
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
  })
);