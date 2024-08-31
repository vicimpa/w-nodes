export const makeStore = <T>(init: () => T, name = 'store') => {
  const symbol = Symbol(name);
  const stored = new WeakMap<object, T>();

  return (obj: object & { [symbol]?: T; }) => (
    stored.get(obj) ?? (
      stored.set(obj, init()),
      stored.get(obj)!
    )
  );
};