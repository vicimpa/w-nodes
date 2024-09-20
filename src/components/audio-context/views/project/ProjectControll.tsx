import { FC, useEffect, useRef } from "react";
import { useComputed, useSignalEffect } from "@preact/signals-react";

import { HudPortal } from "$components/node-editor/node-hud/HudPortal";
import { Project } from "./Project";
import { clamp } from "@vicimpa/math";
import styled from "styled-components";
import { windowEvents } from "@vicimpa/events";

const Container = styled.div`
  position: absolute;
  display: flex;
  justify-content: center;
  top: 0;
  left: 0;
  right: 0;
`;

const Panel = styled.div`
  display: flex;
  gap: 10px;
  padding: 5px 10px;
  border-radius: 0 0 10px 10px;
  background-color: #444;
  border: 2px solid #111;
  align-items: center;
  font-family: 'monospace';
`;

const IconBtn = styled.button`
  width: 25px;
  height: 25px;
  border: none;
  padding: 0;
  background-color: #222;
  color: #fff;

  &:disabled {
    opacity: 0.6;
  }
`;

const Buttons = styled.div`
  display: flex;
  gap: 5px;
`;

const Time = styled.span`
  padding: 2.5px 10px;
  background-color: #222;
`;

const Temp = styled.input.attrs({
  type: 'number',
  min: 1,
  max: 999
})`
width: 100px;
  text-align: right;
  font-family: monospace;
  background-color: #666;
  color: #fff;
`;

export const ProjectControll: FC<{ project: Project; }> = ({ project }) => {
  const tempRef = useRef<HTMLInputElement>(null);

  const buttons = useComputed(() => {
    return (
      <Buttons>
        <IconBtn
          onFocus={e => e.currentTarget.blur()}
          className={project.run === 1 ? "icon-pause2" : "icon-play3"}
          onClick={() => project.run = project.run === 1 ? 2 : 1} />
        <IconBtn
          onFocus={e => e.currentTarget.blur()}
          className="icon-stop2" disabled={!project.run}
          onClick={() => project.run = 0}
        />
      </Buttons>
    );
  });

  const time = useComputed(() => {
    var val = project.timeView.value / (project.temp / 60 * 4);
    var segments = [
      `${((val / 60) % 60) | 0}`,
      `${(val % 60) | 0}`.padStart(2, '0'),
      `${(val % 1 * 100) | 0}`.padStart(3, '0'),
    ];

    return (
      <Time>
        {segments.join(':')}
      </Time>
    );
  });

  useSignalEffect(() => {
    if (!tempRef.current)
      return;

    tempRef.current.value = `${project.temp}`;
  });

  useEffect(() => (
    windowEvents('keydown', (e) => {
      if (e.code === 'Space') {
        project.run = project.run === 1 ? 0 : 1;
      }
    })
  ), []);

  return (
    <HudPortal>
      <Container>
        <Panel>
          {buttons}
          {time}
          <Temp
            ref={tempRef}
            defaultValue={project.temp}
            onKeyDown={e => {
              if (e.code !== 'Enter')
                return;

              e.currentTarget.blur();
              var val = +e.currentTarget.value;
              if (isNaN(val)) {
                e.currentTarget.value = `${project.temp}`;
              } else {
                project.temp = clamp(val, 1, 999);
              }
            }}
          />
        </Panel>
      </Container>
    </HudPortal>
  );
};