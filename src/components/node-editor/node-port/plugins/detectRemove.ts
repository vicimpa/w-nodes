import { NodePort } from "../NodePort";

export default (ctx: NodePort) => {

  return () => {
    ctx.lines.disconnect(ctx);
  };
};