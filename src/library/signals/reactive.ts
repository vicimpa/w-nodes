import { signal } from "@preact/signals-react";
import { store } from "$library/store";

const _store = store(() => new Set<string | symbol>());

export const reactive = <T extends object, C extends new (...args: any[]) => T>() => {
  return (target: C) => {
    const { prototype } = target;

    return {
      [target.name]: class extends (target as new (...args: any[]) => any) {
        constructor(...args: any[]) {
          super(...args);
          for (const key of _store(prototype)) {
            const _signal = signal(this[key as any]);
            Object.defineProperty(this, key, {
              get() {
                return _signal.value;
              },
              set(v) {
                _signal.value = v;
              }
            });
          }
        }
      }
    }[target.name] as C;
  };
};

export const prop = <T extends object>(
  target: T,
  key: string | symbol
) => {
  _store(target).add(key);
};