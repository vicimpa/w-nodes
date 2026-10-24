import { collapse, expand } from "./actions";

import { AudioProject } from "../AudioProject";
import type Group from "./Group";
import { activeProject } from "./state";
import { useEffect } from "react";
import { useInject } from "@vicimpa/react-decorators";
import { windowEvents } from "@vicimpa/events";

// Ctrl+G — свернуть выделение в блок, Ctrl+Shift+G — распаковать выбранные блоки
export const Blocks = () => {
  const root = useInject(AudioProject);

  useEffect(() => (
    windowEvents('keydown', e => {
      if (!(e.metaKey || e.ctrlKey) || e.code !== 'KeyG')
        return;

      e.preventDefault();

      const project = activeProject(root);
      const selected = [...project.selection.select];

      if (!e.shiftKey)
        return collapse(project, selected).catch(console.error);

      for (const node of selected) {
        if (project.find(node)?.name === 'Group')
          expand(project, node as Group).catch(console.error);
      }
    })
  ), []);

  return null;
};
