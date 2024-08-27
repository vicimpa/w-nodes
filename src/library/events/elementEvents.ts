export const elementEvents = <
  K extends keyof HTMLElementEventMap,
  T extends HTMLElement
>(
  element: T | null | undefined,
  event: K | K[],
  listener: (event: HTMLElementEventMap[K], current: T) => void
) => {
  if (!element)
    return () => { };

  event = ([] as K[]).concat(event);

  const listenerCustom = (event: HTMLElementEventMap[K]) => {
    listener(event, element);
  };

  for (const _event of event)
    element.addEventListener(_event, listenerCustom);

  return () => {
    for (const _event of event)
      element.removeEventListener(_event, listenerCustom);
  };
};