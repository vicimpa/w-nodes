import { created, using } from "$components/audio-context/lib/defineWorklet";

import { HudPortal } from "$components/node-editor/node-hud/HudPortal";

export const Debug = () => {

  return (
    <HudPortal>
      <div style={{
        right: 0,
        top: 0,
        backgroundColor: '#111',
        color: '#fff',
        position: 'absolute',
        padding: 10,
        fontSize: 10,
        fontFamily: 'monospace'
      }}
      >
        <p>CustomNodes: <b>{using}/{created}</b></p>
      </div>
    </HudPortal>
  );
};