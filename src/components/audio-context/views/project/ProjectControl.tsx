import { FC, useEffect } from "react";
import { NumberInput } from "$components/audio-context/lib/Row";
import { Play, Square } from "lucide-react";

import { HudPortal } from "$components/node-editor/node-hud/HudPortal";
import { Project } from "./Project";
import { clamp } from "@vicimpa/math";
import styled from "styled-components";
import { useComputed } from "@preact/signals-react";
import { windowEvents } from "@vicimpa/events";

const Container = styled.div`
  position: absolute;
  top: 10px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 6px;
  height: 36px;
  padding: 0 6px;
  border-radius: var(--radius-node);
  background-color: var(--bg-panel);
  box-shadow: 0 6px 20px rgba(0, 0, 0, .35), 0 0 0 1px var(--line);
  --accent: #DAAFD4;
`;

const IconBtn = styled.button`
  display: grid;
  place-items: center;
  width: 26px;
  height: 26px;
  padding: 0;
  border: none;
  color: var(--accent);
`;

const Field = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  height: 26px;
  padding: 0 8px;
  border-radius: var(--radius-field);
  background-color: var(--bg-field);

  small {
    color: var(--text-muted);
    font-size: 10px;
    letter-spacing: .06em;
  }

  input {
    width: 36px;
    min-width: 0;
  }
`;

const Time = styled(Field)`
  min-width: 70px;
  justify-content: flex-end;
  font-size: 14px;
`;

const formatTime = (seconds: number) => {
  const minutes = (seconds / 60) | 0;
  const rest = `${(seconds % 60) | 0}`.padStart(2, '0');
  const hundredths = `${(seconds % 1 * 100) | 0}`.padStart(2, '0');
  return `${minutes}:${rest}.${hundredths}`;
};

export const ProjectControl: FC<{ project: Project; }> = ({ project }) => {
  const playing = useComputed(() => project.run === 1);
  const time = useComputed(() => formatTime(project.timeView.value / (project.temp / 60 * 4)));
  const temp = useComputed(() => `${project.temp}`);

  useEffect(() => (
    windowEvents('keydown', (e) => {
      if (e.code === 'Space') {
        e.preventDefault();
        project.run = project.run ? 0 : 1;
      }
    })
  ), []);

  return (
    <HudPortal>
      <Container onFocus={e => e.target instanceof HTMLButtonElement && e.target.blur()}>
        {useComputed(() => (
          <IconBtn title={playing.value ? 'Stop (Space)' : 'Play (Space)'} onClick={() => project.run = playing.value ? 0 : 1}>
            {playing.value ? <Square size={13} fill="currentColor" /> : <Play size={15} fill="currentColor" />}
          </IconBtn>
        ))}
        <Time>{time}</Time>
        <Field>
          <NumberInput text={temp} onCommit={v => project.temp = clamp(Math.round(v), 1, 999)} />
          <small>BPM</small>
        </Field>
      </Container>
    </HudPortal>
  );
};
