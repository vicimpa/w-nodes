import { Canvas } from "$components/canvas";
import { NodeMap } from "../node-map";
import { PI2 } from "@vicimpa/math";
import { Vec2 } from "@vicimpa/lib-vec2";
import { useInject } from "@vicimpa/react-decorators";

export const NodeBack2 = () => {
  const map = useInject(NodeMap);

  return (
    <Canvas
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none'
      }}
      draw={(ctx, can) => {
        const { s } = map;

        const { rect } = map;
        const zero = new Vec2(0);
        const size = Vec2.fromSize(rect);
        const offset = size.cdiv(-2 * s).plus(map.x, map.y).times(-1);



        var grid = 10;

        while (grid * s < 150)
          grid *= 2;

        can.width = size.x;
        can.height = size.y;
        ctx.fillStyle = '#222';

        ctx.resetTransform();
        ctx.fillRect(zero, size);
        ctx.scale(s, s);
        ctx.translate(offset);

        const start = map.offset(zero).div(grid).floor();
        const end = map.offset(size).div(grid).ceil();
        const delta = end.cminus(start);
        const count = delta.max();

        ctx.beginPath();
        for (let i = 0; i < count; i += 1 / 16) {
          const point = start.cplus(i).times(grid);
          ctx.moveTo(point.x, start.y * grid);
          ctx.lineTo(point.x, end.y * grid);
          ctx.moveTo(start.x * grid, point.y);
          ctx.lineTo(end.x * grid, point.y);
        }

        ctx.strokeStyle = '#333';
        ctx.lineWidth = grid / 400;
        ctx.stroke();
        ctx.closePath();

        ctx.beginPath();
        for (let i = 0; i < count; i += 1 / 4) {
          const point = start.cplus(i).times(grid);
          ctx.moveTo(point.x, start.y * grid);
          ctx.lineTo(point.x, end.y * grid);
          ctx.moveTo(start.x * grid, point.y);
          ctx.lineTo(end.x * grid, point.y);
        }

        ctx.strokeStyle = '#666';
        ctx.lineWidth = grid / 200;
        ctx.stroke();
        ctx.closePath();

        ctx.beginPath();
        for (let i = 0; i < count; i++) {
          const point = start.cplus(i).times(grid);
          ctx.moveTo(point.x, start.y * grid);
          ctx.lineTo(point.x, end.y * grid);
          ctx.moveTo(start.x * grid, point.y);
          ctx.lineTo(end.x * grid, point.y);
        }

        ctx.strokeStyle = '#777';
        ctx.lineWidth = grid / 75;
        ctx.stroke();
        ctx.closePath();

        for (let x = 0; x < delta.x; x += 1) {
          for (let y = 0; y < delta.y; y += 1) {
            ctx.beginPath();
            const point = start.cplus(x, y).times(grid);
            ctx.arc(point.x, point.y, grid / 75, 0, PI2);
            ctx.fillStyle = '#999';
            ctx.fill();
            ctx.closePath();
          }
        }
      }}
    />
  );
};