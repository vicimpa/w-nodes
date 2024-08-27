import { signal } from "@preact/signals-react";
import { store } from "$library/store";

const _store = store(() => store(() => signal()));

export const reactive = <T extends object>(
  target: T,
  key: string | symbol
) => {
  const _key = { key };

  Object.defineProperty(target, key, {
    get() {
      return _store(target)(_key).value;
    },
    set(value) {
      _store(target)(_key).value = value;
    }
  });
};