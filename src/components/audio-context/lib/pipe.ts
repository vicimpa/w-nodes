import { SignalNode } from "./signalNode";

export const pipe = (
  from: AudioNode | SignalNode,
  to: AudioNode | AudioParam | SignalNode,
  ...append: [output?: number, input?: number]
) => {
  if (from instanceof SignalNode)
    from = from.node;

  if (to instanceof AudioNode)
    from.connect(to, ...append);
  else if (to instanceof SignalNode) {
    from.connect(to.node.offset);
    to.addInput(from);
  } else
    from.connect(to);

  return () => {
    if (to instanceof SignalNode) {
      from.disconnect(to.node.offset);
      to.deleteInput(from);
    } else
      from.disconnect(to as AudioNode);
  };
};