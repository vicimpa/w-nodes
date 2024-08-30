import { makeStore } from "$library/store";

export const makeEvents = <T extends any[] = []>() => {
  type Listener = (...args: T) => any;
  var store = makeStore(() => new Set<Listener>());

  return {
    sub(target: object, listener: Listener) {
      const _store = store(target);
      _store.add(listener);

      return () => {
        _store.delete(listener);
      };
    }
  };
};