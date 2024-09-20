import { Vec2 } from "@vicimpa/lib-vec2";

export type LineOptions = {
  size?: number;
  color?: string;
  dash?: number[];
};

export const line = (
  ctx: CanvasRenderingContext2D,
  fn: (move: (...args: [x: number, y: number] | [vec: Vec2]) => void) => void | undefined | Path2D,
  options?: LineOptions
) => {
  var first = true;
  var { size = 1, color = '#fff', dash = [] } = options ?? {};
  ctx.beginPath();
  const path = fn((...args) => {
    if (first) {
      ctx.moveTo(...args);
      first = false;
      return;
    }

    ctx.lineTo(...args);
  });
  ctx.lineWidth = size;
  ctx.strokeStyle = color;
  ctx.setLineDash(dash);
  if (path)
    ctx.stroke(path);
  else
    ctx.stroke();
  ctx.closePath();
};