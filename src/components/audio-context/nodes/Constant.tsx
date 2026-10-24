import { NUMBER, constantValue, constants, findConstant } from "$library/constants";
import { NumberInput, Row } from "../lib/Row";
import { computed, effect, signal } from "@preact/signals-react";
import { group, icon } from "../_groups";

import { BaseNode } from "../lib/BaseNode";
import { Pi } from "lucide-react";
import { Select } from "../lib/Select";
import { SignalNode } from "../lib/signalNode";
import { SignalPort } from "../ports/SignalPort";
import { ctx } from "../ctx";
import { name } from "$library/function";
import s from "../styles.module.sass";
import { store } from "$components/node-editor";

const variants = [
  ...constants.map(item => ({ value: item.id, label: `${item.symbol} — ${item.label}`, group: item.group })),
  { value: NUMBER, label: '# — Number', group: 'Custom' },
];

const format = (value: number) => (
  value % 1 === 0 ? `${value}` : `${+value.toPrecision(10)}`
);

// Постоянный сигнал: математическая или звуковая константа либо своё число.
// Выход у ноды один при любом выборе — порядок портов входит в формат сохранения.
@name('Constant')
@group('math')
@icon(Pi)
export default class extends BaseNode {
  @store _constant = signal('PI');
  @store _number = signal(1);

  _out = new SignalNode(0);

  value = computed(() => constantValue(this._constant.value, this._number.value, ctx.sampleRate) ?? 0);
  numberText = computed(() => format(this._number.value));

  _connect = () => effect(() => {
    this._out.value = this.value.value;
  });

  output = (
    <SignalPort value={this._out} output />
  );

  _view = () => (
    <>
      <div style={{
        display: 'flex',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        gap: 12,
        minWidth: 200,
        padding: '8px 10px',
        borderRadius: 'var(--radius-field)',
        background: 'var(--bg-field)',
      }}>
        <span style={{ color: 'var(--accent)', fontSize: 22, fontFamily: 'var(--font-title)', fontWeight: 800 }}>
          {computed(() => this._constant.value === NUMBER ? '#' : findConstant(this._constant.value)?.symbol ?? '?')}
        </span>
        <span style={{ fontSize: 14 }}>
          {computed(() => format(this.value.value))}
        </span>
      </div>
      <Select
        label="Constant"
        value={this._constant}
        variants={variants}
        groupBy={variant => variant.group} />
      {computed(() => this._constant.value === NUMBER && (
        <Row label="Value">
          <div className={s.field}>
            <NumberInput text={this.numberText} onCommit={v => this._number.value = v} />
          </div>
        </Row>
      ))}
    </>
  );
}
