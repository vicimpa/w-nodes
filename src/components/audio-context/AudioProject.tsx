import { Destination } from "./nodes/Destination";
import { DynamicsCompressor } from "./nodes/DynamicsCompressor";
import { Gain } from "./nodes/Gain";
import { HudPortal } from "$components/node-editor/node-hud/HudPortal";
import { NodeProject } from "$components/node-editor";
import { Oscillator } from "./nodes/Oscillator";
import { ReactNode } from "react";
import { Vec2 } from "$library/vec2";

export class AudioProject extends NodeProject {
  nodes = [Destination, Oscillator, Gain, DynamicsCompressor];

  render(): ReactNode {
    return (
      <>
        {super.render()}
        <HudPortal>
          <div style={{ display: "flex", flexDirection: 'column' }}>

            {this.nodes.map((node, key) => (
              <button
                style={{ textAlign: 'left' }}
                draggable
                onDragEnd={(event) => {
                  this.append(node as any)
                    .then(e => {
                      this.selection.select = [e];
                      this.map.offset(Vec2.fromPageXY(event)).toObject(e);
                    });
                }}
                onClick={
                  () => this.append(node as any).then(e => this.selection.select = [e])
                }
                key={key}
              >
                {node.name}
              </button>
            ))}
          </div>
        </HudPortal>
      </>
    );
  }
}