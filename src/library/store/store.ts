import { makeStore } from "./makeStore";

const keys = makeStore(() => new Set<string | symbol>());

export const store = <T extends object>(
  target: T,
  key: string | symbol
) => {
  keys(target).add(key);
};

export const collectStore = (obj: object | null) => {
  const store = new Set<string | symbol>();
  while (obj) {
    obj = Object.getPrototypeOf(obj);

    obj && keys(obj).forEach(key => store.add(key));
  }

  return [...store];
};