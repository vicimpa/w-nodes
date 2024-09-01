export function renameClass<T extends (new (...args: any[]) => any)>(target: T, name: string): T {
  return ({ [name]: class extends target { } })[name];
}

export function renameFunction<T extends (...args: any[]) => any>(target: T, name: string): T {
  return ({ [name]: function (...args: any[]) { return target.apply(this, args); } })[name] as T;
}

export const name = <T extends new (...args: any[]) => any>(name: string) => {
  return (target: T) => renameClass(target, name);
};

export const delay = (n = 0) => new Promise<void>(resolve => setTimeout(resolve, n));