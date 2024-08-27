import { Signal, effect } from "@preact/signals-react";

export type TUnvalue<T extends object> = {
  [K in keyof T]: T[K] extends Signal<infer _V> ? _V : T
};

export const unvalueEffect = <T extends object>(
  object: T,
  func: (_object: TUnvalue<T>) => void | (() => void)
) => (
  effect(() => (
    func(new Proxy(object, {
      get(target, _key) {
        const key = _key as keyof T;

        if (target[key] instanceof Signal)
          return target[key].value;

        return target[key];
      },
      set(target, _key, value) {
        const key = _key as keyof T;

        if (target[key] instanceof Signal) {
          target[key].value = value;
          return true;
        }

        return Reflect.set(target, _key, value);
      }
    }) as TUnvalue<T>)
  ))
);