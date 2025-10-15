import { Component, PropsWithChildren, ReactNode } from "react";
import { TFV, fv } from "$library/fv";
import { prop, reactive } from "@vicimpa/decorators";
import { MouseEvent as ReactMouseEvent } from "react";
import { Vec2 } from "@vicimpa/lib-vec2";
import { connect } from "@vicimpa/react-decorators";
import detectDrag from "./plugins/detectDrag";
import detectResize from "./plugins/detectResize";
import detectWheel from "./plugins/detectWheel";
import { provide } from "@vicimpa/react-decorators";
import s from "./NodeMap.module.sass";
import { signalRef } from "$library/signals";

export interface INodeMapProps extends PropsWithChildren {
  x?: number;
  y?: number;
  s?: number;
}

@connect(
  detectResize,
  detectDrag,
  detectWheel,
)
@reactive()
@provide()
export class NodeMap extends Component<INodeMapProps> {
  div = signalRef<HTMLDivElement>();

  @prop move = false;

  @prop x = this.props.x ?? 0;
  @prop y = this.props.y ?? 0;
  @prop s = this.props.s ?? 1;

  @prop top = 0;
  @prop left = 0;
  @prop width = 0;
  @prop height = 0;

  @prop
  get rect() {
    return new DOMRect(
      this.left,
      this.top,
      this.width,
      this.height
    );
  };

  @prop
  get view() {
    const size = Vec2.fromSize(this.rect).div(this.s);
    const pos = size.cdiv(-2).plus(this);
    return new DOMRect(...pos, ...size);
  };

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
          .cminus(min).minus(this.viewPad).clamp(-this.viewPad * this.viewOver, 0)
          .plus(current.cminus(max).plus(this.viewPad).clamp(0, this.viewPad * this.viewOver))
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