import { CSSProperties, FC, MouseEvent } from "react";

import { NodePort } from "../node-port";
import { Vec2 } from "$library/vec2";
import { max } from "$library/math";
import { useSignals } from "@preact/signals-react/runtime";

export type TNodeLineProps = {
  from: NodePort | Vec2;
  to: NodePort | Vec2;
  color?: string;
  size?: number;
  onMouseDown?: (event: MouseEvent) => void;
};

function drawBezierCurve(from: Vec2 | NodePort, to: Vec2 | NodePort) {
  const step1 = new Vec2(from);
  const step2 = new Vec2(to);

  const distance = max(step1.distance(to) * .5, 50);

  if (from instanceof NodePort)
    step1.plus(distance * (+!!from.props.output * 2 - 1), 0);

  if (to instanceof NodePort)
    step2.plus(distance * (+!!to.props.output * 2 - 1), 0);

  return `M ${from.x} ${from.y} C ${step1.x} ${step1.y}, ${step2.x} ${step2.y}, ${to.x} ${to.y}`;
}

export const NodeLine: FC<TNodeLineProps> = ({
  from,
  to,
  color = '#fff',
  size = 3,
  onMouseDown,
}) => {
  useSignals();

  const style: CSSProperties = {
    pointerEvents: onMouseDown ? 'visibleStroke' : 'none',
    cursor: 'pointer'
  };

  const path = drawBezierCurve(from, to);
  color = from instanceof NodePort ? from.color : to instanceof NodePort ? to.color : '#999';

  return (
    <g>
      <path
        style={style}
        stroke={color}
        strokeWidth={size}
        fill="none"
        onMouseDown={onMouseDown}
        strokeLinecap="round"
        d={path}
      />
    </g>
  );
};