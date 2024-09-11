import { dispose } from "$library/dispose";
import { windowEvents } from "$library/events";

declare global {
  var _ctx: AudioContext | undefined;
  var _empty: GainNode | undefined;
}

export const ctx = globalThis._ctx ?? (globalThis._ctx = new AudioContext());
export const empty = globalThis._empty ?? (globalThis._empty = ctx.createGain(), globalThis._empty.connect(ctx.destination), globalThis._empty);

empty.gain.value = 0;

function resumeContextOnInteraction(audioContext: AudioContext) {
  if (audioContext.state === "suspended") {
    const resume = async () => {
      await audioContext.resume();

      if (audioContext.state === "running") {
        _dispose();
      }
    };

    const _dispose = dispose(
      windowEvents('touchend', resume),
      windowEvents('click', resume),
      windowEvents('keydown', resume),
    );
  }
}
resumeContextOnInteraction(ctx);