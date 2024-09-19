import { getGroup, groupIndex, groups } from "$components/audio-context/_groups";
import styled, { keyframes } from "styled-components";
import { useComputed, useSignal } from "@preact/signals-react";

import { AudioProject } from "$components/audio-context/AudioProject";
import { HudPortal } from "$components/node-editor/node-hud/HudPortal";
import { Vec2 } from "$library/vec2";
import rsp from "@vicimpa/rsp";
import { useInject } from "$library/provider";

export const GroupNaming = {
  'input': 'Input/Source',
  'analyze': 'Analyze/Test/Show',
  'output': 'Output/Destination',
  'controll': 'Controll/Value',
  'base': 'Default/Base/Effect',
  'custom': 'Custom Worklet',
  'ungroup': 'Without Group',
} as const;

const show = keyframes`
  from {
    opacity: 0;
    transform: translate(-200px, 0px);
  }

  to {
    opacity: 1;
    transform: translate(0px, 0px);
  }
`;

const Container = styled.div`
  display: flex;
  flex-direction: column;
  position: absolute;
  gap: 10px;
  top: 0;
  left: 0;
  bottom: 0;
  background-color: #33333399;
  backdrop-filter: blur(5px);
  overflow-y: scroll;
`;

const Group = styled.div`
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 5px;

  & > p {
    font-size: 10px; 
    padding: 5px;
  }
`;

const Header = styled.div`
  display: flex;
  box-shadow: 0 0 10px #000;
  z-index: 1;
  position: sticky;
  top: 0;

  input, button {
    padding: 5px 10px;
  }

  input {
    flex-grow: 1;
  }
`;


const Button = styled.button<{ $top?: boolean; }>`
  position: ${({ $top }) => $top ? 'sticky' : 'relative'};
  z-index: ${({ $top }) => $top ? '1' : '0'};
  bottom: 0;
  padding: ${({ $top }) => $top ? '10px' : '5px'};
  text-align: left;
  box-shadow: 0 0 10px #000;
  animation: ${show} 0.2s;
`;

export const Menu = () => {
  const project = useInject(AudioProject);
  const filter = useSignal('');
  const filteredNodes = useComputed(() => (
    project.nodes.filter(e => !filter.value || (e.name + getGroup(e)).toLowerCase().includes(filter.value.toLowerCase()))
  ));
  const menu = useComputed(() => {
    if (!filteredNodes.value.length)
      return <p>Not found</p>;

    return (
      [...Map.groupBy(filteredNodes.value, (node) => getGroup(node))]
        .sort((a, b) => groupIndex(a[0]) - groupIndex(b[0]))
        .map(([group, nodes]) => {
          return (
            <Group key={group}>
              <p>{groups[group] ?? groups['ungroup']}</p>
              {
                nodes.map((node) => (
                  <Button
                    draggable
                    onKeyDown={e => e.preventDefault()}
                    onFocus={e => e.currentTarget.blur()}
                    onDragEnd={(event) => {
                      project.append(node as any)
                        .then(e => {
                          project.selection.select = [e];
                          project.map.offset(Vec2.fromPageXY(event)).toObject(e);
                        });
                    }}
                    onClick={
                      () => project.append(node as any).then(e => project.selection.select = [e])
                    }
                    key={node.name + project.nodes.indexOf(node)}
                  >
                    {node.name}
                  </Button>
                ))
              }
            </Group>
          );
        })
    );

  });

  return (
    <HudPortal>
      <Container>
        <Header>
          <rsp.input bind-value={filter} placeholder="Search" onKeyDown={e => e.stopPropagation()} />
          <button onClick={() => filter.value = ''}>Clear</button>
        </Header>
        <div style={{ flexGrow: 1 }}>
          {menu}
        </div>
        <Button onFocus={e => e.currentTarget.blur()} $top onClick={() => window.open('https://github.com/vicimpa/w-nodes')}>
          Open GitHub
        </Button>
      </Container>
    </HudPortal >
  );
};