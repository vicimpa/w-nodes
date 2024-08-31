import { NodeItem } from "../NodeItem";

export default (ctx: NodeItem) => {
  ctx.list.items.add(ctx);
  ctx.props.onMount?.(ctx);
  return () => {
    ctx.list.items.delete(ctx);
    ctx.props.onDestroy?.(ctx);
  };
};