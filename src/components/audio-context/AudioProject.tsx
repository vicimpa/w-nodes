import { NodeItem, NodeProject } from "$components/node-editor";
import { prop, reactive, signalRef } from "$library/signals";

import { Destination } from "./nodes/Destination";
import { Gain } from "./nodes/Gain";
import { HudPortal } from "$components/node-editor/node-hud/HudPortal";
import { Oscillator } from "./nodes/Oscillator";
import { ReactNode } from "react";

@reactive()
export class AudioProject extends NodeProject {
  nodes = [Destination, Oscillator, Gain];

  @prop store = [
    {
      id: -2,
      node: this.nodes[0],
      props: {},
      ref: signalRef<NodeItem>()
    },
    {
      id: -1,
      node: this.nodes[1],
      props: {},
      ref: signalRef<NodeItem>()
    },
  ];

  render(): ReactNode {
    return (
      <>
        {super.render()}
        <HudPortal>
          {this.nodes.map((node, key) => (
            <button
              onMouseDown={
                () => this.append(node as any).then(e => this.selection.select = [e])
              }
              key={key}
            >
              {node.name}
            </button>
          ))}
        </HudPortal>
      </>
    );
  }
}