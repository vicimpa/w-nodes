import { Component, PropsWithChildren, ReactNode } from "react";
import { TFV, fv } from "$library/fv";
import { prop, reactive, signalRef } from "$library/signals";

import { MouseEvent as ReactMouseEvent } from "react";
import { Vec2 } from "$library/vec2";
import { connect } from "$library/connect";
import detectDrag from "./plugins/detectDrag";
import detectResize from "./plugins/detectResize";
import detectView from "./plugins/detectView";
import detectWheel from "./plugins/detectWheel";
import { provide } from "$library/provider";
import s from "./NodeMap.module.sass";

export interface INodeMapProps extends PropsWithChildren {
  x?: number;
  y?: number;
  s?: number;
}

@provide()
@connect(
  detectResize,
  detectView,
  detectDrag,
  detectWheel,
)
@reactive()
export class NodeMap extends Component<INodeMapProps> {
  div = signalRef<HTMLDivElement>();
  svg = signalRef<SVGSVGElement>();

  @prop move = false;

  @prop x = this.props.x ?? 0;
  @prop y = this.props.y ?? 0;
  @prop s = this.props.s ?? 1;

  @prop rect = new DOMRect();
  @prop view = new DOMRect();

  private viewPad = 50;
  private viewOver = 4;

  offset(vec: Vec2 | MouseEvent | ReactMouseEvent): Vec2 {
    if (!(vec instanceof Vec2))
      return this.offset(Vec2.fromPageXY(vec));

    return vec.cminus(this.rect).div(this.s).plus(this.view);
  }

  toScale(newScale: TFV<number, [old: number]>, vec = new Vec2(this.rect).div(2)) {
    const start = this.offset(vec);
    this.s = fv(newScale, this.s);
    const end = this.offset(vec);
    start.minus(end).plus(this).toObject(this);
  }

  calcViewTransitionVec(current: Vec2, dtime: number) {
    const min = new Vec2(this.rect);
    const max = Vec2.fromSize(this.rect).plus(min);
    return new Vec2(this)
      .plus(
        current
          .cminus(min).minus(this.viewPad).cropMax(0).cropMin(-this.viewPad * this.viewOver)
          .plus(current.cminus(max).plus(this.viewPad).cropMin(0).cropMax(this.viewPad * this.viewOver))
          .times(dtime * .01 / this.s)
      );
  }

  render(): ReactNode {
    return (
      <>
        <div ref={this.div} className={s.map}>
          {this.props.children}
        </div>
      </>
    );
  }
}