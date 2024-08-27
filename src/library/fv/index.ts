export type TFV<T, A extends any[] = []> = T | ((...args: A) => T);
export const fv = <T, A extends any[]>(v: TFV<T, A>, ...args: A) => (
  v instanceof Function ? v(...args) : v
);