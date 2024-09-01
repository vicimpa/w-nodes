import { computed, signal } from "@preact/signals-react";

import { BaseNode } from "../lib/BaseNode";
import { Number } from "../lib/Number";
import { Select } from "../lib/Select";
import { SignalPort } from "../ports/SignalPort";
import { name } from "$library/function";
import { store } from "$library/store";

const math = {
  '+': (a: number, b: number) => a + b,
  '-': (a: number, b: number) => a - b,
  '*': (a: number, b: number) => a * b,
  '/': (a: number, b: number) => a / b,
  '%': (a: number, b: number) => a % b,
  '**': (a: number, b: number) => a ** b,
  '&': (a: number, b: number) => a & b,
  '|': (a: number, b: number) => a | b,
  '^': (a: number, b: number) => a ^ b,
  '>>': (a: number, b: number) => a >> b,
  '<<': (a: number, b: number) => a << b,
} as const;

const operators = Object.keys(math) as (keyof typeof math)[];
const variants = operators.map((value) => ({ value }));


@name('Math')
export default class extends BaseNode {
  @store _a = signal(0);
  @store _b = signal(0);
  @store _p = signal(operators[0]);

  _out = computed(() => math[this._p.value](this._a.value, this._b.value));

  output = (
    <SignalPort value={this._out} output />
  );

  _view = () => (
    <>
      <Select label="Operator" value={this._p} variants={variants} />
      <Number label="a" value={this._a} />
      <Number label="b" value={this._b} />
    </>
  );
}