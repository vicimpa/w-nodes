import { makeStore } from "$library/store";

type Listener = (entry: IntersectionObserverEntry) => void;
const _store = makeStore(() => new Set<Listener>());

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    _store(entry.target)
      .forEach(listener => listener(entry));
  });
}, {
  threshold: 0.1
});

export function intersectionObserver<T extends Element>(target: T | null | undefined, listener: Listener) {
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