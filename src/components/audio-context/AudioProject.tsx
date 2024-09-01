import { HudPortal } from "$components/node-editor/node-hud/HudPortal";
import { NodeProject } from "$components/node-editor";
import { ReactNode } from "react";
import { Vec2 } from "$library/vec2";
import _nodes from "./_nodes";
export class AudioProject extends NodeProject {
  nodes = _nodes;

  render(): ReactNode {
    return (
      <>
        {super.render()}
        <HudPortal>
          <div style={{ display: "flex", flexDirection: 'column' }}>

            {this.nodes.map((node, key) => (
              <button
                style={{ textAlign: 'left', padding: 5 }}
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
            <button onClick={() => window.open('https://github.com/vicimpa/w-nodes')}>Open GitGub</button>
          </div>
        </HudPortal>
      </>
    );
  }
}