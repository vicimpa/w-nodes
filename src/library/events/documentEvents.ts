export const documentEvents = <K extends keyof DocumentEventMap>(
  event: K | K[],
  listener: (event: DocumentEventMap[K]) => void
) => {
  event = ([] as K[]).concat(event);

  for (const _event of event)
    document.addEventListener(_event, listener);

  return () => {
    for (const _event of event)
      document.removeEventListener(_event, listener);
  };
};