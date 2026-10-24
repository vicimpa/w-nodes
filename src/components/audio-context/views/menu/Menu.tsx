import { Bookmark, CodeXml, Search, X } from "lucide-react";
import { placeBlock, removeBlock, savedBlocks } from "$components/audio-context/blocks/library";
import { getGroup, getIcon, groupIndex, groups } from "$components/audio-context/_groups";
import { useComputed, useSignal } from "@preact/signals-react";

import { activeProject, openBlocks } from "$components/audio-context/blocks/state";
import { AudioProject } from "$components/audio-context/AudioProject";
import { NodeProject } from "$components/node-editor";
import { droppedOn } from "../demo/Demo";
import { HudPortal } from "$components/node-editor/node-hud/HudPortal";
import { Vec2 } from "@vicimpa/lib-vec2";
import rsp from "@vicimpa/rsp";
import styled from "styled-components";
import { useInject } from "@vicimpa/react-decorators";

// Входы и выходы блока имеют смысл только внутри открытого блока
const blockOnly = ['GroupInput', 'GroupOutput'];

const humanize = (name: string) => name.replace(/([a-z])([A-Z])/g, '$1 $2');

const Container = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  width: 200px;
  display: flex;
  flex-direction: column;
  background-color: color-mix(in srgb, var(--bg-panel) 92%, transparent);
  backdrop-filter: blur(6px);
  border-right: 1px solid var(--line);
`;

const Brand = styled.div`
  padding: 12px 12px 8px;
  font-family: var(--font-title);
  font-weight: 800;
  font-size: 13px;
  letter-spacing: .04em;
`;

const SearchBox = styled.label`
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0 8px 6px;
  padding: 0 8px;
  height: 28px;
  background-color: var(--bg-field);
  border-radius: var(--radius-field);
  color: var(--text-muted);

  input {
    flex-grow: 1;
    min-width: 0;
    padding: 0;
    border: none !important;
    background: none;
    color: var(--text);
    user-select: text;
  }

  button {
    display: grid;
    padding: 0;
    border: none;
    background: none;
    color: inherit;
  }
`;

const List = styled.div`
  flex-grow: 1;
  overflow-y: auto;
  padding: 0 8px 8px;
`;

const Group = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1px;
  margin-top: 8px;

  & > p {
    padding: 4px 4px;
    color: var(--accent);
    font-family: var(--font-title);
    font-weight: 800;
    font-size: 9.5px;
    letter-spacing: .08em;
    text-transform: uppercase;
  }
`;

const Item = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  height: 26px;
  padding: 0 8px;
  border: none;
  background: none;
  text-align: left;

  svg {
    color: var(--accent);
    flex-shrink: 0;
  }

  .remove {
    color: var(--text-muted);
    visibility: hidden;
  }

  &:hover .remove {
    visibility: visible;
  }

  .remove:hover {
    color: var(--danger);
  }

  &:not(:disabled):hover {
    background-color: var(--bg-hover);
  }
`;

const Footer = styled.a`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border-top: 1px solid var(--line);
  color: var(--text-muted);
  text-decoration: none;

  &:hover {
    color: var(--text);
  }
`;

const Empty = styled.p`
  padding: 16px 8px;
  color: var(--text-muted);
`;

// Центр экрана, сдвинутый лесенкой, пока там уже стоит нода
const freeSpot = (project: NodeProject) => {
  const items = project.store.flatMap(item => item.ref.current ?? []);
  var { x, y } = project.map;

  while (items.some(item => Math.abs(item.x - x) < 12 && Math.abs(item.y - y) < 12)) {
    x += 30;
    y += 30;
  }

  return { x, y };
};

export const Menu = () => {
  const project = useInject(AudioProject);
  const filter = useSignal('');

  const menu = useComputed(() => {
    const query = filter.value.trim().toLowerCase();
    const inBlock = openBlocks.value.length > 0;
    const nodes = project.nodes
      .filter(node => inBlock || !blockOnly.includes(node.name))
      .filter(node => !query || `${humanize(node.name)} ${node.name} ${groups[getGroup(node)].label}`.toLowerCase().includes(query))
      .sort((a, b) => a.name.localeCompare(b.name));

    if (!nodes.length)
      return <Empty>Nothing found</Empty>;

    return [...Map.groupBy(nodes, node => getGroup(node))]
      .sort((a, b) => groupIndex(a[0]) - groupIndex(b[0]))
      .map(([group, nodes]) => (
        <Group key={group} style={{ '--accent': groups[group].color } as React.CSSProperties}>
          <p>{groups[group].label}</p>
          {
            nodes.map((node) => {
              const Icon = getIcon(node);

              return (
                <Item
                  key={node.name}
                  draggable
                  title={`Click or drag to add ${humanize(node.name)}`}
                  onKeyDown={e => e.preventDefault()}
                  onDragEnd={(event) => {
                    const target = activeProject(project);

                    if (!droppedOn(target, event))
                      return;

                    target.append(node as any)
                      .then(e => {
                        target.selection.select = [e];
                        target.map.offset(Vec2.fromPageXY(event)).toObject(e);
                      });
                  }}
                  onClick={(e) => {
                    const target = activeProject(project);

                    e.currentTarget.blur();
                    target.append(node as any, freeSpot(target)).then(e => target.selection.select = [e]);
                  }}
                >
                  {Icon && <Icon size={14} strokeWidth={2.25} />}
                  {humanize(node.name)}
                </Item>
              );
            })
          }
        </Group>
      ));
  });

  const mine = useComputed(() => !filter.value && savedBlocks.value.length > 0 && (
    <Group style={{ '--accent': groups.block.color } as React.CSSProperties}>
      <p>My blocks</p>
      {savedBlocks.value.map(entry => (
        <Item
          key={entry.id}
          title={`Add ${entry.label}`}
          onKeyDown={e => e.preventDefault()}
          onClick={e => {
            const target = activeProject(project);
            e.currentTarget.blur();
            placeBlock(target, entry, freeSpot(target));
          }}
        >
          <Bookmark size={14} strokeWidth={2.25} />
          <span style={{ flexGrow: 1 }}>{entry.label}</span>
          <X
            size={13}
            className="remove"
            onClick={e => {
              e.stopPropagation();
              removeBlock(entry.id);
            }} />
        </Item>
      ))}
    </Group>
  ));

  return (
    <HudPortal>
      <Container>
        <Brand>WebAudio Nodes</Brand>
        <SearchBox>
          <Search size={14} />
          <rsp.input bind-value={filter} placeholder="Search nodes" onKeyDown={e => e.stopPropagation()} />
          {useComputed(() => filter.value && (
            <button onClick={() => filter.value = ''} title="Clear"><X size={14} /></button>
          ))}
        </SearchBox>
        <List>
          {menu}
          {mine}
        </List>
        <Footer href="https://github.com/vicimpa/w-nodes" target="_blank" rel="noreferrer">
          <CodeXml size={14} />
          Source on GitHub
        </Footer>
      </Container>
    </HudPortal>
  );
};
