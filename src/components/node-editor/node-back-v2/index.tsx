import { Canvas } from "$components/canvas";
import { NodeMap } from "../node-map";
import { useInject } from "@vicimpa/react-decorators";

const background = '#2a2a2a';
const dotColor = '#4a4a4a';
const majorColor = '#5e5e5e';

// Точки ближе этого расстояния на экране не рисуем: шаг удваивается
const minSpacing = 18;
// Каждая major-я точка крупнее — ориентир при большом отдалении
const major = 8;

const mod = (value: number, by: number) => ((value % by) + by) % by;

// Фон карты: точечная сетка. Шаг — степень двойки от базового, подстраивается под зум;
// промежуточные точки плавно проявляются, пока шаг не уменьшится вдвое, поэтому сетка не прыгает.
export const NodeBack2 = () => {
  const map = useInject(NodeMap);

  return (
    <Canvas
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none'
      }}
      draw={(ctx, can) => {
        const { s, rect } = map;
        const dpr = devicePixelRatio || 1;
        const { width, height } = rect;

        if (can.width !== Math.round(width * dpr) || can.height !== Math.round(height * dpr)) {
          can.width = Math.round(width * dpr);
          can.height = Math.round(height * dpr);
        }

        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.fillStyle = background;
        ctx.fillRect(0, 0, width, height);

        if (!width || !height || !s)
          return;

        var step = 20;

        while (step * s < minSpacing)
          step *= 2;

        while (step * s >= minSpacing * 2)
          step /= 2;

        const spacing = step * s;
        // 0 — промежуточные точки ещё не видны, 1 — видны полностью
        const fade = Math.min(Math.max((spacing - minSpacing) / minSpacing, 0), 1);

        // Мировые координаты левого верхнего угла холста
        const origin = map.offset({ pageX: rect.left, pageY: rect.top } as MouseEvent);
        const fromX = Math.floor(origin.x / step);
        const fromY = Math.floor(origin.y / step);
        const countX = Math.ceil(width / spacing) + 1;
        const countY = Math.ceil(height / spacing) + 1;

        const regular = new Path2D();
        const between = new Path2D();
        const big = new Path2D();
        const growing = new Path2D();
        const dot = 1.5;
        const bigDot = 2.5;

        for (let i = 0; i < countX; i++) {
          const ix = fromX + i;
          const x = (ix * step - origin.x) * s;

          for (let j = 0; j < countY; j++) {
            const iy = fromY + j;
            const y = (iy * step - origin.y) * s;

            if (mod(ix, major * 2) === 0 && mod(iy, major * 2) === 0) {
              big.rect(x - bigDot / 2, y - bigDot / 2, bigDot, bigDot);
              continue;
            }

            if (mod(ix, 2) || mod(iy, 2)) {
              between.rect(x - dot / 2, y - dot / 2, dot, dot);
              continue;
            }

            regular.rect(x - dot / 2, y - dot / 2, dot, dot);

            // Станут крупными после следующего уменьшения шага — растут вместе с fade
            if (mod(ix, major) === 0 && mod(iy, major) === 0)
              growing.rect(x - bigDot / 2, y - bigDot / 2, bigDot, bigDot);
          }
        }

        ctx.fillStyle = dotColor;
        ctx.fill(regular);
        ctx.globalAlpha = fade;
        ctx.fill(between);
        ctx.fillStyle = majorColor;
        ctx.fill(growing);
        ctx.globalAlpha = 1;
        ctx.fill(big);
      }}
    />
  );
};
