export const ctx = new AudioContext();

var interval = setInterval(() => {
  ctx.resume()
    .then(() => clearInterval(interval));
});