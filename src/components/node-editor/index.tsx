import { NodeBack } from "./node-back";
import { NodeHud } from "./node-hud";
import { NodeLayers } from "./node-layers";
import { NodeLines } from "./node-lines";
import { NodeList } from "./node-list";
import { NodeMap } from "./node-map";
import { PropsWithChildren } from "react";

export const NodeEditor = (props: PropsWithChildren) => (
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
            {props.children}
          </NodeLines>
        </NodeList>
      </NodeLayers>
    </NodeMap>
  </NodeHud>
);