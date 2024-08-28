import { AudioContext } from "$components/audio-context";
import { NodeEditor } from "$components/node-editor";

export const App = () => (
  <NodeEditor>
    <AudioContext />
  </NodeEditor>
);