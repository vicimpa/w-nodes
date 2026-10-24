import { TCompiled, TGraph, templates } from "$library/blockCompiler";

import type { NodeItem } from "$components/node-editor";

const field = (node: NodeItem, key: string): unknown => (node as unknown as Record<string, unknown>)[key];

// Порты живых нод должны совпасть с картой портов компилятора, иначе провода поняты неверно
export const checkPorts = (nodes: NodeItem[], graph: TGraph) => {
  for (let i = 0; i < nodes.length; i++) {
    const type = graph.nodes[i];
    const expected = templates[type]?.ports(graph.configs[i]);
    const ports = nodes[i].sortPorts;

    if (!expected || typeof expected === 'string' || ports.length !== expected.inputs.length + expected.outputs)
      return `${type} has unexpected ports`;

    for (let k = 0; k < ports.length; k++) {
      const key = expected.inputs[k];
      const output = k >= expected.inputs.length;

      if (!!ports[k].props.output !== output || (key && ports[k].props.value !== field(nodes[i], key)))
        return `${type} has unexpected ports`;
    }
  }

  return null;
};

export const programSignals = (nodes: NodeItem[], result: TCompiled) => (
  result.params.map(({ node, key }) => field(nodes[node], key))
);
