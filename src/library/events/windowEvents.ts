export const windowEvents = <K extends keyof WindowEventMap>(
  event: K[] | K,
  listener: (event: WindowEventMap[K]) => void
) => {
  event = ([] as K[]).concat(event);

  for (const _event of event)
    addEventListener(_event, listener);

  return () => {
    for (const _event of event)
      removeEventListener(_event, listener);
  };
};