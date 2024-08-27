type TFrameListener = (dtime: number, time: number) => any;

var FRAME_LISTENER = new Set<TFrameListener>();
var dtime = 0;
var time = performance.now();

function loop(_time = performance.now()) {
  requestAnimationFrame(loop);
  (dtime = _time - time, time = _time);
  FRAME_LISTENER.forEach(frame);
}

loop();

export function frame<T extends TFrameListener>(_frame: T) {
  return _frame(dtime, time) as ReturnType<T>;
}

export function frames<T extends TFrameListener>(frame: T) {
  FRAME_LISTENER.add(frame);
  return () => { FRAME_LISTENER.delete(frame); };
}