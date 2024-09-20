import { FC } from "react";
import { NodeLine } from "./NodeLine";
import { NodeLines } from "./NodeLines";
import { NodePort } from "../node-port";
import { useInject } from "@vicimpa/react-decorators";
import { useSignals } from "@preact/signals-react/runtime";

export const NodeLineForward: FC<{ from: NodePort; }> = ({ from }) => {
  const lines = useInject(NodeLines);

  useSignals();

  if (!lines.mouse)
    return null;

  return (
    <NodeLine
      from={from}
      to={lines.mouse}
      size={3} />
  );
};
