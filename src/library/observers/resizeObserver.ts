import { store } from "$library/store";

type Listener = (entry: ResizeObserverEntry) => void;
const _store = store(() => new Set<Listener>());

const observer = new ResizeObserver((entries) => {
  entries.forEach(entry => {
    _store(entry.target)
      .forEach(listener => listener(entry));
  });
});

export function resizeObserver<T extends Element>(target: T | null | undefined, listener: Listener) {
  if (!target)
    return () => { };

  const list = _store(target);
  const size = list.size;

  list.add(listener);

  if (!size)
    observer.observe(target);

  return () => {
    list.delete(listener);

    if (!list.size)
      observer.unobserve(target);
  };
}