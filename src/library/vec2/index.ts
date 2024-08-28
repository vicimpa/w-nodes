import { Signal, batch } from "@preact/signals-react";
import { abs, cos, hypot, iters, max, min, rem, rems, sign, sin } from "$library/math";

export type TMutation = (x: number, y: number) => any;
export type TPointVec2 = { x: number, y: number; };
export type TTupleVec2 = [x: number, y: number];
export type TSizeVec2 = { width: number, height: number; };
export type TPageXY = { pageX: number, pageY: number; };
export type TOffsetXY = { offsetX: number, offsetY: number; };
export type TDeltaXY = { deltaX: number, deltaY: number; };
export type TRect2 = [
  ...([x: number, y: number] | [xy: Vec2]),
  ...([w: number, h: number] | [wh: Vec2])
];

export type TParameter = (
  never
  | []
  | [vec: Vec2]
  | [xy: TPointVec2]
  | [xy: number]
  | [xy: Signal<number>]
  | [x: Signal<number>, y: Signal<number>]
  | TTupleVec2
);

export function mutation<F extends TMutation>(args: TParameter, mutation: F): ReturnType<F> {
  var first = args[0] ?? 0;

  if (typeof first === 'number') {
    if (typeof args[1] === 'number')
      return mutation.call(null, first, args[1]);
    return mutation.call(null, first, first);
  }

  if (first instanceof Signal) {
    if (args[1] instanceof Signal)
      return mutation.call(null, first.peek(), args[1].peek());

    return mutation.call(null, first.peek(), first.peek());
  }

  if (first && ('x' in first) && ('y' in first))
    return mutation.call(null, first.x, first.y);

  throw new Error('Unknown format');
}

export class Vec2 {
  read = false;
  x: number = 0;
  y: number = 0;

  *[Symbol.iterator]() {
    yield this.x;
    yield this.y;
  }

  [Symbol.toStringTag]() {
    return this.toString();
  }

  toString() {
    return `${this.x} ${this.y}`;
  }

  get tuple(): TTupleVec2 {
    return [this.x, this.y];
  }

  get size(): TSizeVec2 {
    return {
      width: this.x,
      height: this.y
    };
  }

  get point(): TPointVec2 {
    return {
      x: this.x,
      y: this.y
    };
  }

  constructor(...args: TParameter) {
    this.set(...args);
  }

  equal(...args: TParameter) {
    return mutation(args, (x, y) => {
      return x === this.x && y === this.y;
    });
  }

  inRect(...args: TRect2) {
    const [x, y, w, h] = args.reduce<number[]>((acc, e) => (
      e instanceof Vec2 ? (
        acc.concat(e.x, e.y)
      ) : (
        acc.concat(e)
      )
    ), []);

    return (
      this.x >= x &&
      this.y >= y &&
      this.x <= w + x &&
      this.y <= h + y);
  }

  cropMin(...args: TParameter) {
    mutation(args, (x, y) => {
      this.x = max(this.x, x);
      this.y = max(this.y, y);
    });
    return this;
  }

  cropMax(...args: TParameter) {
    mutation(args, (x, y) => {
      this.x = min(this.x, x);
      this.y = min(this.y, y);
    });
    return this;
  }

  set(...args: TParameter) {
    mutation(args, (x, y) => {
      this.x = x;
      this.y = y;
    });
    return this;
  }

  plus(...args: TParameter) {
    mutation(args, (x, y) => {
      this.x += x;
      this.y += y;
    });
    return this;
  }

  minus(...args: TParameter) {
    mutation(args, (x, y) => {
      this.x -= x;
      this.y -= y;
    });
    return this;
  }

  times(...args: TParameter) {
    mutation(args, (x, y) => {
      this.x *= x;
      this.y *= y;
    });
    return this;
  }

  div(...args: TParameter) {
    mutation(args, (x, y) => {
      this.x /= x;
      this.y /= y;
    });
    return this;
  }

  rem(...args: TParameter) {
    mutation(args, (x, y) => {
      this.x = rem(this.x, x);
      this.y = rem(this.y, y);
    });
    return this;
  }

  rems(...args: TParameter) {
    mutation(args, (x, y) => {
      this.x = rems(this.x, x);
      this.y = rems(this.y, y);
    });
    return this;
  }

  inverse() {
    [this.x, this.y] = [this.y, this.x];
    return this;
  }

  iters(to: Vec2, i: number) {
    this.x = iters(this.x, to.x, i);
    this.y = iters(this.y, to.y, i);
    return this;
  }

  sign() {
    this.x = sign(this.x);
    this.y = sign(this.y);
    return this;
  }

  abs() {
    this.x = abs(this.x);
    this.y = abs(this.y);
    return this;
  }

  clone() {
    return new Vec2(this);
  }

  cplus(...args: TParameter) {
    return this.clone().plus(...args);
  }

  cminus(...args: TParameter) {
    return this.clone().minus(...args);
  }

  ctimes(...args: TParameter) {
    return this.clone().times(...args);
  }

  cdiv(...args: TParameter) {
    return this.clone().div(...args);
  }

  crem(...args: TParameter) {
    return this.clone().rem(...args);
  }

  crems(...args: TParameter) {
    return this.clone().rems(...args);
  }

  cinverse() {
    return this.clone().inverse();
  }

  cnormalize() {
    return this.clone().normalize();
  }

  citers(to: Vec2, i: number) {
    return this.clone().iters(to, i);
  }

  csign() {
    return this.clone().sign();
  }

  cabs() {
    return this.clone().abs();
  }

  length() {
    return hypot(...this);
  }

  distance(...args: TParameter) {
    return this.cminus(...args).length();
  }

  normalize() {
    return this.div(this.length());
  }

  min() {
    return min(...this);
  }

  max() {
    return max(...this);
  }

  toSignals(x: Signal<number>, y: Signal<number>) {
    return batch(() => {
      x.value = this.x;
      y.value = this.y;
      return this;
    });
  }

  toObject(o: { x: number, y: number; }) {
    return batch(() => {
      o.x = this.x;
      o.y = this.y;
      return this;
    });
  }

  toRect(...args: TParameter) {
    return mutation(args, (x, y) => {
      const xRect = min(this.x, x);
      const yRect = min(this.y, y);
      const wRect = abs(max(this.x, x) - xRect);
      const hRect = abs(max(this.y, y) - yRect);
      return new DOMRect(xRect, yRect, wRect, hRect);
    });
  }

  static fromAngle(d: number, vec = new this()) {
    return vec.set(sin(d), cos(d));
  }

  static fromPoint(point: TPointVec2, vec = new this()) {
    return vec.set(point.x, point.y);
  }

  static fromSize(size: TSizeVec2, vec = new this()) {
    return vec.set(size.width, size.height);
  }

  static fromDeltaXY(page: TDeltaXY, vec = new this()) {
    return vec.set(page.deltaX, page.deltaY);
  }

  static fromPageXY(page: TPageXY, vec = new this()) {
    return vec.set(page.pageX, page.pageY);
  }

  static fromSignals(x: Signal<number>, y: Signal<number>, vec = new this()) {
    return vec.set(x.value, y.value);
  }

  static fromOffsetXY(offset: TOffsetXY, vec = new this()) {
    return vec.set(offset.offsetX, offset.offsetY);
  }

  static fromOffsetSize(elem: HTMLElement, vec = new this()) {
    return vec.set(elem.offsetWidth, elem.offsetHeight);
  }

  static fromSvgLength(x: SVGAnimatedLength, y: SVGAnimatedLength, vec = new this()) {
    return vec.set(x.baseVal.value, y.baseVal.value);
  }
}