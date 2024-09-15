type TFrameListener = (dtime: number, time: number) => any;

export function frames<T extends TFrameListener>(frame: T) {
  var run = true;
  var time = performance.now();

  function loop(newTime: number) {
    if (!run) return;
    requestAnimationFrame(loop);
    frame(newTime - time, time = newTime);
  }

  requestAnimationFrame(loop);

  return function () {
    run = false;
  };
}