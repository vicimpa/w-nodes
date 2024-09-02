import { computed, signal } from "@preact/signals-react";

import { BaseNode } from "../lib/BaseNode";
import { Number } from "../lib/Number";
import { Select } from "../lib/Select";
import { SignalPort } from "../ports/SignalPort";
import { max } from "$library/math";
import { name } from "$library/function";
import { store } from "$library/store";

const math = {
  'a + b': (a: number, b: number) => a + b,
  'a - b': (a: number, b: number) => a - b,
  'a * b': (a: number, b: number) => a * b,
  'a / b': (a: number, b: number) => a / b,
  'a % b': (a: number, b: number) => a % b,
  'a ** b': (a: number, b: number) => a ** b,
  'a & b': (a: number, b: number) => a & b,
  'a | b': (a: number, b: number) => a | b,
  'a ^ b': (a: number, b: number) => a ^ b,
  'a >> b': (a: number, b: number) => a >> b,
  'a << b': (a: number, b: number) => a << b,
  'a > b': (a: number, b: number) => +(a > b),
  'a < b': (a: number, b: number) => +(a < b),
  'a && b': (a: number, b: number) => a && b,
  'a || b': (a: number, b: number) => a || b,
  'min(a, b)': (a: number, b: number) => max(a, b),
  'max(a, b)': (a: number, b: number) => max(a, b),
} as const;

const operators = Object.keys(math) as (keyof typeof math)[];
const variants = operators.map((value) => ({ value }));


@name('Operation')
export default class extends BaseNode {
  @store _a = signal(0);
  @store _b = signal(0);
  @store _p = signal(operators[0]);

  _out = computed(() => math[this._p.value](this._a.value, this._b.value));
  _val = signal(this._out.value);

  _connect = () => (
    this._out.subscribe(val => {
      this._val.value = val;
    })
  );

  output = (
    <SignalPort value={this._out} output />
  );

  _view = () => (
    <>
      <Number label="Result" value={this._val} readonly noPort />
      <Select label="Operator" value={this._p} variants={variants} />
      <Number label="a" value={this._a} />
      <Number label="b" value={this._b} />
    </>
  );
}