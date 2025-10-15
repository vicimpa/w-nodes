import { Signal, signal } from "@preact/signals-react";

import { createRef, RefObject } from "react";

export type SignalRef<T> = Signal<T | null> & RefObject<T>;

export const signalRef = <T = unknown>() => {
  return Object.defineProperty(
    Object.assign(
      signal<T | null>(),
      createRef<T>()
    ),
    'current',
    {
      get(this: Signal<T>) {
        return this.value;
      },
      set(this: Signal<T>, v: T) {
        this.value = v;
      },
    }
  ) as SignalRef<T>;
};