import { NodeFrame } from "../NodeFrame";
import { effect } from "@preact/signals-react";

export default (ctx: NodeFrame) => (
  effect(() => {
    const { value: frame } = ctx.frame;

    if (!frame || !frame.contentWindow) return;
    const { document: doc } = frame.contentWindow;
    doc.body.appendChild(ctx.elem);
    ctx.mount = true;
  })
);