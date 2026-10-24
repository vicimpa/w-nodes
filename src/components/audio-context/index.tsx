import { AudioProject } from "./AudioProject";
import { Debug } from "./views/debug/Debug";
import { Demo } from "./views/demo";
import { Menu } from "./views/menu";
import { Project } from "./views/project";
import { Session } from "./views/session";
import { History } from "./views/history";
import { Blocks } from "./blocks/Blocks";
import { PropsWithChildren } from "react";

export const AudioContext = ({ children }: PropsWithChildren) => (
  <Project>
    <AudioProject>
      <Menu />
      <Demo />
      <Debug />
      <Session />
      <History />
      <Blocks />
      {children}
    </AudioProject>
  </Project>
);