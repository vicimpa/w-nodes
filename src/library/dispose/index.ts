export type TDispose = (() => void) | null | undefined;

export function dispose(...args: TDispose[]) {
  return () => {
    args.forEach((_dispose) => {
      try {
        _dispose?.();
      } catch (e) {
        console.error(e);
      }
    });
  };
}