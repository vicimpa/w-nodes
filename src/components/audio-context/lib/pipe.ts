import { SignalNode } from "./signalNode";

export const pipe = (
  from: AudioNode | SignalNode,
  to: AudioNode | AudioParam,
  ...append: [output?: number, input?: number]
) => {
  if (from instanceof SignalNode)
    from = from.node;

  if (to instanceof AudioNode)
    from.connect(to, ...append);
  else
    from.connect(to);

  return () => {
    from.disconnect(to as AudioNode);
  };
};