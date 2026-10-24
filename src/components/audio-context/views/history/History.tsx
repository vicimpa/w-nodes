import { AudioProject } from "$components/audio-context/AudioProject";
import { ProjectHistory } from "$components/node-editor";
import { dispose } from "$library/dispose";
import { signal } from "@preact/signals-react";
import { useEffect } from "react";
import { useInject } from "@vicimpa/react-decorators";
import { windowEvents } from "@vicimpa/events";

export const projectHistory = signal<ProjectHistory | null>(null);

const nonTextInputs = ['range', 'checkbox', 'radio', 'button'];

// В текстовых полях Ctrl+Z остаётся за полем
const isEditable = (target: EventTarget | null) => (
  target instanceof HTMLTextAreaElement ||
  (target instanceof HTMLInputElement && !nonTextInputs.includes(target.type)) ||
  (target instanceof HTMLElement && target.isContentEditable)
);

// Шаг истории записывается, когда действие закончилось: отпустили мышь или клавишу,
// поменяли поле. Пока кнопка мыши зажата (тащим ноду, крутим слайдер), шаг не пишется.
export const History = () => {
  const project = useInject(AudioProject);

  useEffect(() => {
    const history = new ProjectHistory(project);
    var timer = 0;
    var pressed = false;

    const commit = () => {
      clearTimeout(timer);

      if (pressed || project.busy || history.applying)
        return schedule(300);

      history.commit();
    };

    const schedule = (ms = 200) => {
      clearTimeout(timer);
      timer = window.setTimeout(commit, ms);
    };

    projectHistory.value = history;
    history.reset();

    const interval = setInterval(() => !pressed && commit(), 1500);

    return dispose(
      () => clearTimeout(timer),
      () => clearInterval(interval),
      () => projectHistory.value = null,
      windowEvents('pointerdown', () => pressed = true),
      windowEvents('pointerup', () => {
        pressed = false;
        schedule();
      }),
      windowEvents('blur', () => pressed = false),
      windowEvents('keyup', () => schedule()),
      windowEvents('change', () => schedule()),
      windowEvents('drop', () => schedule(600)),
      windowEvents('keydown', e => {
        if (!(e.metaKey || e.ctrlKey) || isEditable(e.target))
          return;

        if (e.code === 'KeyZ') {
          e.preventDefault();
          (e.shiftKey ? history.redo() : history.undo()).catch(console.error);
        }

        if (e.code === 'KeyY') {
          e.preventDefault();
          history.redo().catch(console.error);
        }
      })
    );
  }, []);

  return null;
};
