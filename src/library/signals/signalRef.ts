import { Signal, signal } from "@preact/signals-react";

import { createRef } from "react";

export const signalRef = <T = unknown>() => {
  return Object.defineProperty(
    Object.assign(
      signal<T>(),
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
  );
};