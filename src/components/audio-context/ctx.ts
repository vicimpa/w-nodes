export const ctx = new AudioContext();
export const empty = ctx.createGain();

empty.gain.value = 0;
empty.connect(ctx.destination);

const interval = setInterval(() => {
  ctx.resume()
    .then(() => clearInterval(interval));
}, 10);