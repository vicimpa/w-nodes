import { created, using } from "./lib/defineWorklet";

import { AudioProject } from "./AudioProject";
import { HudPortal } from "$components/node-editor/node-hud/HudPortal";
import { computed } from "@preact/signals-react";

export const AudioContext = () => (
  <AudioProject>
    <HudPortal>
      <div style={{
        right: 0,
        top: 0,
        backgroundColor: '#333',
        color: '#fff',
        position: 'absolute',
        padding: 20
      }}
      >
        <h3>CustomWorkletNode</h3>
        <p>Using: <b>{using}</b></p>
        <p>Created: <b>{created}</b></p>
        <p>Pooling: <b>{computed(() => created.value - using.value)}</b></p>
      </div>
    </HudPortal>
  </AudioProject>
);
