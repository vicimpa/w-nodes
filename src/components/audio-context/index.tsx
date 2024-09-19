import { AudioProject } from "./AudioProject";
import { Debug } from "./views/debug/Debug";
import { Menu } from "./views/menu";
import { Project } from "./views/project";

export const AudioContext = () => (
  <Project>
    <AudioProject>
      <Menu />
      <Debug />
    </AudioProject>
  </Project>
);