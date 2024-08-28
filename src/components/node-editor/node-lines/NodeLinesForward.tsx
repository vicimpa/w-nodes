import { Fragment, createElement } from "react";

import { NodeLineForward } from "./NodeLineForward";
import { NodeLines } from "./NodeLines";
import { useInject } from "$library/provider";
import { useSignals } from "@preact/signals-react/runtime";

export const NodeLinesForward = () => {
  const lines = useInject(NodeLines);

  useSignals();

  if (!lines.from.length)
    return null;

  return createElement(Fragment, {}, ...lines.from.map(from => (
    <NodeLineForward from={from} />
  )));
};