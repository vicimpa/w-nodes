declare global {
  var _ctx: AudioContext | undefined;
  var _empty: GainNode | undefined;
}

export const ctx = globalThis._ctx ?? (globalThis._ctx = new AudioContext());
export const empty = globalThis._empty ?? (globalThis._empty = ctx.createGain(), globalThis._empty.connect(ctx.destination), globalThis._empty);

empty.gain.value = 0;

const interval = setInterval(() => {
  ctx.resume()
    .then(() => clearInterval(interval));
}, 10);