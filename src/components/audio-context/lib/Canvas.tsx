import { Component, ReactNode } from "react";
import { computed, effect } from "@preact/signals-react";
import { prop, reactive, signalRef } from "$library/signals";

import { connect } from "$library/connect";
import { frames } from "$library/frames";

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

@connect((can) => (
  effect(() => {
    if (!can.ref.value || !can.ctx.value)
      return;

    const _ctx: TCanvasCtx = {
      can: can.ref.value,
      ctx: can.ctx.value,
      dtime: 0,
      time: 0
    };

    can.props.draw?.(_ctx.ctx, _ctx.can);

    if (!can.loop)
      return;

    const _loop = can.loop;

    return frames((dtime, time) => {
      _ctx.dtime = dtime;
      _ctx.time = time;
      _loop(_ctx);
    });
  })
))
@reactive()
export class Canvas extends Component<TCanvasProps> {
  ref = signalRef<HTMLCanvasElement>();
  ctx = computed(() => this.ref.value?.getContext('2d'));

  @prop draw?: (ctx: CanvasRenderingContext2D, can: HTMLCanvasElement) => any;
  @prop loop?: (_ctx: TCanvasCtx) => any;

  render(): ReactNode {
    const { draw, loop, ...props } = this.props;
    if (draw !== this.draw)
      this.draw = draw;
    if (loop !== this.loop)
      this.loop = loop;
    return (
      <canvas ref={this.ref} {...props} />
    );
  }
}