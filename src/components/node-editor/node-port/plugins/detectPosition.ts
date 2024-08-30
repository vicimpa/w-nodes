import { NodePort } from "../NodePort";
import { Vec2 } from "$library/vec2";
import { dispose } from "$library/dispose";
import { effect } from "@preact/signals-react";
import { intersectionObserver } from "$library/observers/intersectionObserver";

export default (ctx: NodePort) => (
  effect(() => {
    const { value: port } = ctx.port;
    const { value: fill } = ctx.item.fillRef;

    if (!port || !fill) return;

    const { map } = ctx;

    const getPoint = () => {
      const rect = port.getBoundingClientRect();
      map.offset(Vec2.fromSize(rect).times(.5).plus(rect)).toObject(ctx);
    };


    return dispose(
      intersectionObserver(port, () => {
        getPoint();
      }),
      effect(() => {
        ctx.item.x;
        ctx.item.y;
        ctx.item.width;
        ctx.item.height;
        getPoint();
      })
    );
  })
);