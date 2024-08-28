import { Fragment, createElement } from "react";

import { NodeLineBack } from "./NodeLineBack";
import { NodeLines } from "./NodeLines";
import { useInject } from "$library/provider";
import { useSignals } from "@preact/signals-react/runtime";

export const NodeLinesBack = () => {
  const lines = useInject(NodeLines);

  useSignals();

  if (!lines.connects.length)
    return null;

  return createElement(Fragment, {}, ...lines.connects.map(connect => {
    const [from, to] = connect;
    return <NodeLineBack connect={connect} key={`${from.id}:${to.id}`} />;
  }));
};