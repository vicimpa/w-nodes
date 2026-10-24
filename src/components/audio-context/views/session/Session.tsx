import { addSampler, autosave, preserveAutosave, startup } from "./actions";
import { activeProject } from "$components/audio-context/blocks/state";
import { projectHistory } from "../history";
import { importAudio, isAudioFile } from "$components/audio-context/lib/MediaSelect";

import { AudioProject } from "$components/audio-context/AudioProject";
import { dispose } from "$library/dispose";
import { useEffect } from "react";
import { Vec2 } from "@vicimpa/lib-vec2";
import { useInject } from "@vicimpa/react-decorators";
import { windowEvents } from "@vicimpa/events";

const projectFile = /\.(wnodes|txt)$/i;

export const Session = () => {
  const project = useInject(AudioProject);

  useEffect(() => {
    var ready = false;

    startup(project)
      .catch(e => {
        console.error('Cannot open the project', e);
        preserveAutosave();
      })
      .finally(() => {
        ready = true;
        // Открытие проекта — начало истории, отменять его нечего
        projectHistory.peek()?.reset();
      });

    const timer = setInterval(() => {
      if (ready)
        autosave(project).catch(console.error);
    }, 2000);

    return dispose(
      () => clearInterval(timer),
      windowEvents('drop', e => {
        e.preventDefault();

        const target = activeProject(project);
        const point = target.map.offset(Vec2.fromPageXY(e));

        [...e.dataTransfer?.files ?? []].forEach((file, i) => {
          if (projectFile.test(file.name))
            file.text().then(text => target.paste(text)).catch(console.error);
          else if (isAudioFile(file))
            importAudio(file).then(media => addSampler(target, media, point.cplus(i * 30))).catch(console.error);
        });
      })
    );
  }, []);

  return null;
};
