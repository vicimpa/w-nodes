import { created, using } from "$components/audio-context/lib/defineWorklet";

import { HudPortal } from "$components/node-editor/node-hud/HudPortal";
import styled from "styled-components";

const Container = styled.div`
  position: absolute;
  right: 10px;
  bottom: 10px;
  padding: 4px 8px;
  border-radius: var(--radius-field);
  background-color: var(--bg-panel);
  color: var(--text-muted);
  font-size: 11px;
`;

export const Debug = () => (
  <HudPortal>
    <Container title="Worklet nodes in use / created">
      Worklets: <b>{using}</b> / {created}
    </Container>
  </HudPortal>
);
