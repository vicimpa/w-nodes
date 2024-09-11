import { AudioProject } from "./AudioProject";
import { Debug } from "./views/debug/Debug";
import { Menu } from "./views/menu";

export const AudioContext = () => (
  <AudioProject>
    <Menu />
    <Debug />
  </AudioProject>
);
