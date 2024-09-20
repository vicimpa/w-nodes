import { NodeLayersItem } from "../node-layers";
import { NodeSelection } from "./NodeSelection";
import { useInject } from "@vicimpa/react-decorators";
import { useSignals } from "@preact/signals-react/runtime";

export const NodeSelectionView = () => {
  useSignals();
  const select = useInject(NodeSelection);

  if (!select.view)
    return null;

  const [from, to] = select.view;
  const size = to.cminus(from);

  return (
    <NodeLayersItem post>
      <rect
        x={from.x}
        y={from.y}
        width={size.x}
        height={size.y}
        stroke="#fff"
        strokeWidth={2}
        fill="rgba(255,255,255,0.4)" />
    </NodeLayersItem>
  );
};