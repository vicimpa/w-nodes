import { CSSProperties, FC, MouseEvent, useLayoutEffect, useRef } from "react";

import { NodePort } from "../node-port";
import { Vec2 } from "@vicimpa/lib-vec2";
import { effect } from "@preact/signals-react";
import { max } from "@vicimpa/math";

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

const lineColor = (from: Vec2 | NodePort, to: Vec2 | NodePort) => (
  from instanceof NodePort ? from.color : to instanceof NodePort ? to.color : '#999'
);

// Путь и цвет обновляются подпиской на позиции портов, без перерисовки компонента:
// при перетаскивании сотни проводов меняют только атрибут d
export const NodeLine: FC<TNodeLineProps> = ({
  from,
  to,
  size = 3,
  onMouseDown,
}) => {
  const ref = useRef<SVGPathElement>(null);

  useLayoutEffect(() => (
    effect(() => {
      const path = ref.current;

      if (!path)
        return;

      path.setAttribute('d', drawBezierCurve(from, to));
      path.setAttribute('stroke', lineColor(from, to));
    })
  ), [from, to]);

  const style: CSSProperties = {
    pointerEvents: onMouseDown ? 'visibleStroke' : 'none',
    cursor: 'pointer'
  };

  return (
    <path
      ref={ref}
      style={style}
      strokeWidth={size}
      fill="none"
      onMouseDown={onMouseDown}
      strokeLinecap="round"
      shapeRendering="crispEdges" />
  );
};
