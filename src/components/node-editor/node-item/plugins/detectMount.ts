import { NodeItem } from "../NodeItem";

export default (ctx: NodeItem) => {
  ctx.list.items.add(ctx);
  return () => { ctx.list.items.delete(ctx); };
};