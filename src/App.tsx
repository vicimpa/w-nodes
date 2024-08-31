import { NodeBack, NodeHud, NodeLayers, NodeLines, NodeList, NodeMap, NodeProject, NodeSelection } from "$components/node-editor";

import { TestNode } from "$TestNode";

export const App = () => (
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
              <NodeProject>
                <TestNode />
                <TestNode />
                <TestNode />
                <TestNode />
                <TestNode />
                <TestNode />
                <TestNode />
                <TestNode />
                <TestNode />
                <TestNode />
              </NodeProject>
            </NodeSelection>
          </NodeLines>
        </NodeList>
      </NodeLayers>
    </NodeMap>
  </NodeHud>
);