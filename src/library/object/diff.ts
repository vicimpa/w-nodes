import { unique } from "$library/array";

export type TDiff<T extends object> = {
  [K in keyof T]?: T[K]
};

export const diff = <T extends object>(a: T, b: T) => {
  var output: TDiff<T> = {};

  for (const key of unique([...Object.keys(a), ...Object.keys(b)] as [keyof T])) {
    if (a[key] !== b[key])
      output[key] = b[key];
  }

  return output;
};