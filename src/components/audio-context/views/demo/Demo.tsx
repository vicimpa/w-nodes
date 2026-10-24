import { exampleName, examples } from "$components/audio-context/examples";
import { addSampler, hasPrevious, replace, restorePrevious, shareLink, snapshot } from "../session";
import { formatSize, mediaList, mediaRef, removeMedia } from "$library/media";
import { useComputed, useSignal } from "@preact/signals-react";

import { AudioLines, FilePlus, FolderOpen, Link, Network, Redo2, RotateCcw, Save, Trash2, Undo2 } from "lucide-react";
import { projectHistory } from "../history";
import { NodeProject } from "$components/node-editor";
import { Vec2 } from "@vicimpa/lib-vec2";
import { activeProject } from "$components/audio-context/blocks/state";
import { AudioProject } from "$components/audio-context/AudioProject";
import { HudPortal } from "$components/node-editor/node-hud/HudPortal";
import { dom } from "$library/dom";
import styled from "styled-components";
import { useInject } from "@vicimpa/react-decorators";

const Container = styled.div`
  position: absolute;
  top: 10px;
  right: 10px;
  width: 190px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px;
  border-radius: var(--radius-node);
  background-color: color-mix(in srgb, var(--bg-panel) 92%, transparent);
  backdrop-filter: blur(6px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, .35), 0 0 0 1px var(--line);

  h4 {
    margin: 4px 2px 2px;
    color: var(--text-muted);
    font-family: var(--font-title);
    font-weight: 800;
    font-size: 9.5px;
    letter-spacing: .08em;
    text-transform: uppercase;
  }
`;

const Actions = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4px;

  button {
    display: flex;
    align-items: center;
    gap: 6px;
    height: 26px;
    padding: 0 8px;
  }
`;

const Demos = styled.div`
  display: flex;
  flex-direction: column;

  a {
    padding: 3px 4px;
    border-radius: var(--radius-field);
    color: var(--text);
    text-decoration: none;

    &:hover {
      background-color: var(--bg-hover);
    }
  }
`;

const Media = styled.div`
  display: flex;
  flex-direction: column;
  max-height: 180px;
  overflow-y: auto;

  & > div {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 3px 4px;
    border-radius: var(--radius-field);
    cursor: grab;

    span {
      flex-grow: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    svg {
      flex-shrink: 0;
    }

    small {
      color: var(--text-muted);
      white-space: nowrap;
    }

    button {
      display: grid;
      padding: 0;
      border: none;
      background: none;
      color: var(--text-muted);
      visibility: hidden;
    }

    &:hover {
      background-color: var(--bg-hover);

      button {
        visibility: visible;
      }
    }

    button:hover {
      color: var(--danger);
    }
  }

  p {
    padding: 2px 4px;
    color: var(--text-muted);
    font-size: 11px;
  }
`;

// Перетаскивание закончилось над холстом этого проекта, а не над панелью
export const droppedOn = (project: NodeProject, e: { clientX: number, clientY: number; }) => (
  !!project.map.div.value?.contains(document.elementFromPoint(e.clientX, e.clientY))
);

const download = (name: string, text: string) => {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/plain' }));
  dom('a', { href: url, download: name }).click();
  setTimeout(() => URL.revokeObjectURL(url));
};

const pickFile = () => new Promise<File | null>(resolve => {
  dom('input', {
    type: 'file',
    accept: '.wnodes,.txt',
    onchange: e => resolve((e.target as HTMLInputElement).files?.[0] ?? null),
  }).click();
});

export const Demo = () => {
  const project = useInject(AudioProject);
  const copied = useSignal('');

  const actions = useComputed(() => (
    <Actions>
      <button onClick={() => replace(project, '')}><FilePlus size={13} />New</button>
      <button onClick={async () => {
        const file = await pickFile();
        if (file) await replace(project, await file.text());
      }}>
        <FolderOpen size={13} />Open
      </button>
      <button onClick={async () => {
        download('project.wnodes', (await snapshot(project, 'file')).text);
      }}>
        <Save size={13} />Save
      </button>
      <button onClick={async () => {
        const { text, skipped } = await snapshot(project, 'link');
        await navigator.clipboard.writeText(shareLink(text));
        copied.value = skipped.length ? 'Copied, no media' : 'Copied!';
        setTimeout(() => copied.value = '', 2000);
      }}>
        <Link size={13} />{copied.value || 'Share'}
      </button>
      <button
        title="Undo (Ctrl+Z)"
        disabled={!projectHistory.value?.canUndo.value}
        onClick={() => projectHistory.peek()?.undo()}
      >
        <Undo2 size={13} />Undo
      </button>
      <button
        title="Redo (Ctrl+Shift+Z)"
        disabled={!projectHistory.value?.canRedo.value}
        onClick={() => projectHistory.peek()?.redo()}
      >
        <Redo2 size={13} />Redo
      </button>
      <button
        title="Arrange the selection, or every node when nothing is selected"
        style={{ gridColumn: 'span 2' }}
        onClick={() => activeProject(project).arrange().catch(console.error)}
      >
        <Network size={13} />Arrange nodes
      </button>
      {hasPrevious.value && (
        <button style={{ gridColumn: 'span 2' }} onClick={() => restorePrevious(project)}>
          <RotateCcw size={13} />Restore previous
        </button>
      )}
    </Actions>
  ));

  const media = useComputed(() => (
    <Media>
      {
        mediaList.value.length ? mediaList.value.map(item => (
          <div
            key={item.hash}
            draggable
            title="Drag to the canvas to create a Sampler"
            onDragEnd={e => {
              const target = activeProject(project);

              if (droppedOn(target, e))
                addSampler(target, mediaRef(item.hash), target.map.offset(Vec2.fromPageXY(e)));
            }}
          >
            <AudioLines size={13} />
            <span title={item.name}>{item.name}</span>
            <small>{formatSize(item.size)}</small>
            <button title="Remove from library" onClick={() => removeMedia(item.hash)}>
              <Trash2 size={13} />
            </button>
          </div>
        )) : <p>Drop audio files on the canvas</p>
      }
    </Media>
  ));

  return (
    <HudPortal>
      <Container onFocus={e => e.target instanceof HTMLButtonElement && e.target.blur()}>
        <h4>Project</h4>
        {actions}
        <h4>Media</h4>
        {media}
        <h4>Demo projects</h4>
        <Demos>
          {
            Object.entries(examples).map(([path, load]) => {
              const name = exampleName(path).replace(/\.txt$/, '');

              return (
                <a
                  key={path}
                  href={'#' + name}
                  onClick={async (e) => {
                    e.preventDefault();
                    await replace(project, await load());
                  }}
                >
                  {name}
                </a>
              );
            })
          }
        </Demos>
      </Container>
    </HudPortal>
  );
};
