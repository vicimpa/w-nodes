import { AudioProject } from "./AudioProject";
import { Debug } from "./views/debug/Debug";
import { Demo } from "./views/demo";
import { Menu } from "./views/menu";
import { Project } from "./views/project";
import { PropsWithChildren } from "react";

export const AudioContext = ({ children }: PropsWithChildren) => (
  <Project>
    <AudioProject>
      <Menu />
      <Demo />
      <Debug />
      {children}
    </AudioProject>
  </Project>
);