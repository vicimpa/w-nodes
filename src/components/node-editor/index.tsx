import { NodeBack2 } from "./node-back-v2";
import { NodeHud } from "./node-hud";
import { NodeLayers } from "./node-layers";
import { NodeLines } from "./node-lines";
import { NodeList } from "./node-list";
import { NodeMap } from "./node-map";
import { NodeSelection } from "./node-selection";
import { PropsWithChildren } from "react";

export * from "./node-back";
export * from "./node-hud";
export * from "./node-item";
export * from "./node-layers";
export * from "./node-lines";
export * from "./node-list";
export * from "./node-map";
export * from "./node-port";
export * from "./node-project";
export * from "./node-selection";

export const Editor = ({ children }: PropsWithChildren) => (
  <NodeHud>
    <NodeMap>
      <NodeBack2 />
      <NodeLayers>
        <NodeList>
          <NodeLines>
            <NodeSelection>
              {children}
            </NodeSelection>
          </NodeLines>
        </NodeList>
      </NodeLayers>
    </NodeMap>
  </NodeHud>
);
