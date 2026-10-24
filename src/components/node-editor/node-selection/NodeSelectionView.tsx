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

// Направляющие магнитов: тонкие линии, толщина не зависит от масштаба
export const NodeSnapGuides = () => {
  useSignals();
  const select = useInject(NodeSelection);

  if (!select.guides.length)
    return null;

  return (
    <NodeLayersItem post>
      {select.guides.map((guide, i) => (
        <line
          key={i}
          x1={guide.axis === 'x' ? guide.at : guide.from}
          x2={guide.axis === 'x' ? guide.at : guide.to}
          y1={guide.axis === 'x' ? guide.from : guide.at}
          y2={guide.axis === 'x' ? guide.to : guide.at}
          stroke="#ffffff"
          strokeOpacity={.55}
          strokeWidth={1}
          strokeDasharray="4 4"
          vectorEffect="non-scaling-stroke" />
      ))}
    </NodeLayersItem>
  );
};
