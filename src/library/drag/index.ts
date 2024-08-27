import { MouseEvent as ReactMouseEvent } from "react";
import { Vec2 } from "$library/vec2";
import { windowEvents } from "$library/events";

export type TDragEvent<T = {}> = {
  start: Vec2;
  current: Vec2;
  delta: Vec2;
  target: EventTarget | null;
  meta?: T;
};

export type TDragStop<T = {}> = (e: TDragEvent<T>) => void;
export type TDragMove<T = {}> = (e: TDragEvent<T>) => void | TDragStop<T>;
export type TDragStart<T = {}> = (e: TDragEvent<T>) => void | TDragMove<T>;

export const makeDrag = <T = {}>(
  dragStart: TDragStart<T>,
  btn = 0,
  fromOffset = false
) => (e: MouseEvent | ReactMouseEvent, meta?: T) => {
  if (e.button !== btn)
    return;

  e.preventDefault();
  e.stopPropagation();

  const start = fromOffset ? Vec2.fromOffsetXY(e as MouseEvent) : Vec2.fromPageXY(e);
  const current = start.clone();
  const delta = new Vec2(0);

  const event = {
    get start() {
      return start.clone();
    },
    get current() {
      return current.clone();
    },
    get delta() {
      return delta.clone();
    },
    get meta() {
      return meta ?? undefined;
    },
    target: e.target
  };

  const update = () => {
    if (!move) return;
    stop = move(event);
  };

  let move = dragStart(event);
  let stop: TDragStop<T> | void;

  update();

  const unsub = [
    windowEvents(['mouseup', 'blur'], (e) => {
      if ('button' in e && e.button !== btn)
        return;

      stop?.(event);
      unsub.forEach(u => u?.());
    }),
    windowEvents('mousemove', (e) => {
      if (fromOffset)
        Vec2.fromOffsetXY(e, current);
      else
        Vec2.fromPageXY(e, current);
      delta.set(start).minus(current);
      update();
    }),
    () => {
      move = undefined;
      stop = undefined;
    }
  ];
};