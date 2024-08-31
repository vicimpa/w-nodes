import { NodeBack } from "./node-back";
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
      <NodeBack type="fill" />
      <NodeBack type="points" p={5} s={.25} />
      <NodeBack type="points" s={1.5} />
      <NodeBack type="pluses" s={.2} s2={1} />
      <NodeBack type="gridpoints" p={25 * 5} s={1} s2={6} />

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