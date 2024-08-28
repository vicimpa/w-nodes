import { NodePort } from "../NodePort";

export default (ctx: NodePort) => {
  ctx.item.ports.add(ctx);
  return () => ctx.item.ports.delete(ctx);
};