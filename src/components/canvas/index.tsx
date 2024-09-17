import { effect, useComputed } from "@preact/signals-react";
import { useEffect, useMemo } from "react";

import { frames } from "$library/frames";
import { signalRef } from "$library/signals";

export type TCanvasCtx = {
  can: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  dtime: number;
  time: number;
};

export type TCanvasProps = {
  draw?: (ctx: CanvasRenderingContext2D, can: HTMLCanvasElement) => any;
  loop?: (ctx: TCanvasCtx) => any;
} & Omit<JSX.IntrinsicElements['canvas'], 'ref'>;

export const Canvas = ({ draw, loop, ...props }: TCanvasProps) => {
  const ref = useMemo(() => signalRef<HTMLCanvasElement | null>(), []);
  const ctx = useComputed(() => ref.value?.getContext('2d'));

  useEffect(() => (
    effect(() => {
      if (!ref.value || !ctx.value)
        return;

      draw?.(ctx.value, ref.value);

      if (!loop)
        return;

      const _loop = loop;

      const _ctx: TCanvasCtx = {
        can: ref.value,
        ctx: ctx.value,
        dtime: 0,
        time: 0
      };

      return frames((dtime, time) => {
        _ctx.dtime = dtime;
        _ctx.time = time;
        _loop(_ctx);
      });
    })
  ), [draw, loop]);

  return (
    <canvas ref={(instance) => ref.value = instance} {...props} />
  );
};