type RefKeys<T extends object> = {
  [K in keyof T]: T[K] extends number ? K : never
}[keyof T];

export class RefValue {
  value: number;
  readonly defaultValue: number;
  get minValue() { return Number.MIN_VALUE; };
  get maxValue() { return Number.MAX_VALUE; };

  constructor() {
    throw new Error('Can not construct this object');
  }
}

export function refValue<T extends object>(target: T, key: RefKeys<T>) {
  return Object.setPrototypeOf({
    defaultValue: target[key],
    get value() {
      return target[key];
    },
    set value(v) {
      target[key] = v;
    },
    maxValue: Number.MAX_VALUE,
    minValue: Number.MIN_VALUE,
  }, RefValue.prototype) as RefValue;
}