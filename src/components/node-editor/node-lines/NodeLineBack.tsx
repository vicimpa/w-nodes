import { FC, MouseEvent, useCallback } from "react";
import { NodeConnect, NodeLines } from "./NodeLines";

import { NodeLayersItem } from "../node-layers";
import { NodeLine } from "./NodeLine";
import { NodeMap } from "../node-map";
import { useInject } from "@vicimpa/react-decorators";
import { useSignals } from "@preact/signals-react/runtime";

export const NodeLineBack: FC<{ connect: NodeConnect; }> = ({ connect }) => {
  useSignals();

  const map = useInject(NodeMap);
  const lines = useInject(NodeLines);

  const mouseDown = useCallback((e: MouseEvent) => {
    if (e.button !== 0) return;
    const vec = map.offset(e);
    const { port } = connect
      .map(port => ({ port, distance: vec.distance(port) }))
      .sort((a, b) => b.distance - a.distance)[0];

    lines.disconnect(connect);
    lines.fromStart(e.nativeEvent, port);
  }, [connect]);

  const [from, to] = connect;


  if (from.hover || to.hover)
    return (
      <NodeLayersItem post>
        <NodeLine from={from} to={to} size={6} />
      </NodeLayersItem>
    );

  return (
    <NodeLine from={from} to={to} onMouseDown={mouseDown} size={4} />
  );
};