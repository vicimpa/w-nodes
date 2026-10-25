import { Component, ReactNode } from "react";
import { NumberInput, Row, TextInput } from "../lib/Row";
import { batch, computed, effect, signal } from "@preact/signals-react";
import { prop, reactive } from "@vicimpa/decorators";

import { BaseNode } from "../lib/BaseNode";
import { Canvas } from "$components/canvas";
import { Gauge } from "lucide-react";
import { Select } from "../lib/Select";
import { SignalNode } from "../lib/signalNode";
import { accentOf } from "../lib/accent";
import { group, icon } from "../_groups";
import { name } from "$library/function";
import rsp from "@vicimpa/rsp";
import s from "../styles.module.sass";
import { store } from "$components/node-editor";

export type TWidgetType = 'number' | 'gauge' | 'bar' | 'lamp';

export type TWidget = {
  type: TWidgetType;
  label: string;
  min: number;
  max: number;
  // Начало красной зоны у стрелочного прибора и полосы
  red: number;
  unit: string;
  digits: number;
};

const widgetTypes: { value: TWidgetType; label: string; }[] = [
  { value: 'number', label: 'Number' },
  { value: 'gauge', label: 'Gauge' },
  { value: 'bar', label: 'Bar' },
  { value: 'lamp', label: 'Lamp' },
];

const defaultWidget: TWidget = { type: 'number', label: 'Value', min: 0, max: 1, red: 1, unit: '', digits: 2 };

// Проект может прийти по ссылке с чем угодно в настройках
export const normalizeWidget = (value: unknown): TWidget => {
  const w = (value && typeof value === 'object' ? value : {}) as Partial<Record<keyof TWidget, unknown>>;
  const num = (v: unknown, def: number) => typeof v === 'number' && Number.isFinite(v) ? v : def;
  const str = (v: unknown, def: string) => typeof v === 'string' ? v.slice(0, 64) : def;

  return {
    type: widgetTypes.some(t => t.value === w.type) ? w.type as TWidgetType : defaultWidget.type,
    label: str(w.label, defaultWidget.label),
    min: num(w.min, defaultWidget.min),
    max: num(w.max, defaultWidget.max),
    red: num(w.red, defaultWidget.red),
    unit: str(w.unit, defaultWidget.unit),
    digits: Math.min(Math.max(Math.round(num(w.digits, defaultWidget.digits)), 0), 6),
  };
};

export const formatValue = (value: number, digits: number) => (
  Number.isFinite(value) ? value.toFixed(digits) : '—'
);

// Доля шкалы 0..1
const ratio = (value: number, min: number, max: number) => (
  max === min ? 0 : Math.min(Math.max((value - min) / (max - min), 0), 1)
);

// Шаг делений шкалы: 1, 2 или 5 × 10^n, примерно 10 делений
const tickStep = (range: number) => {
  const raw = Math.abs(range) / 10 || 1;
  const pow = 10 ** Math.floor(Math.log10(raw));
  const k = raw / pow;
  return pow * (k < 1.5 ? 1 : k < 3.5 ? 2 : k < 7.5 ? 5 : 10);
};

// Стрелка ходит по дуге 270° снизу слева направо
const START = Math.PI * 0.75;
const SWEEP = Math.PI * 1.5;

const GaugeView = ({ value, widget }: { value: SignalNode; widget: TWidget; }) => (
  <Canvas
    width={200}
    height={170}
    loop={({ can, ctx }) => {
      const { width, height } = can;
      const { min, max, red, unit, digits } = widget;
      const cx = width / 2, cy = 92, r = 80;
      const style = getComputedStyle(can);
      const accent = accentOf(can);
      const muted = style.getPropertyValue('--text-muted').trim() || '#888';
      const danger = style.getPropertyValue('--danger').trim() || '#ff8282';
      const text = style.getPropertyValue('--text').trim() || '#fff';
      const angle = (v: number) => START + SWEEP * ratio(v, min, max);

      ctx.clearRect(0, 0, width, height);
      ctx.lineCap = 'butt';

      ctx.lineWidth = 6;
      ctx.strokeStyle = muted + '40';
      ctx.beginPath();
      ctx.arc(cx, cy, r, START, START + SWEEP);
      ctx.stroke();

      if (red < max) {
        ctx.strokeStyle = danger;
        ctx.beginPath();
        ctx.arc(cx, cy, r, angle(red), START + SWEEP);
        ctx.stroke();
      }

      // Деления и подписи: числа больше 1000 подписываются в тысячах, как на тахометре
      const step = tickStep(max - min);
      const thousands = Math.max(Math.abs(min), Math.abs(max)) >= 1000;
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      for (let v = Math.ceil(min / step) * step, n = 0; v <= max + step * 1e-6 && n < 50; v += step, n++) {
        const a = angle(v);
        const cos = Math.cos(a), sin = Math.sin(a);

        ctx.lineWidth = 2;
        ctx.strokeStyle = v >= red ? danger : text;
        ctx.beginPath();
        ctx.moveTo(cx + cos * (r - 10), cy + sin * (r - 10));
        ctx.lineTo(cx + cos * (r - 3), cy + sin * (r - 3));
        ctx.stroke();

        ctx.fillStyle = v >= red ? danger : muted;
        ctx.fillText(`${+(thousands ? v / 1000 : v).toFixed(2)}`, cx + cos * (r - 20), cy + sin * (r - 20));
      }

      const v = value.value;
      const a = angle(v);

      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.strokeStyle = v >= red ? danger : accent;
      ctx.beginPath();
      ctx.moveTo(cx - Math.cos(a) * 10, cy - Math.sin(a) * 10);
      ctx.lineTo(cx + Math.cos(a) * (r - 6), cy + Math.sin(a) * (r - 6));
      ctx.stroke();

      ctx.fillStyle = text;
      ctx.beginPath();
      ctx.arc(cx, cy, 5, 0, Math.PI * 2);
      ctx.fill();

      ctx.font = '20px sans-serif';
      ctx.fillStyle = v >= red ? danger : accent;
      ctx.fillText(formatValue(v, digits), cx, cy + 46);

      ctx.font = '10px sans-serif';
      ctx.fillStyle = muted;
      ctx.fillText(thousands ? `×1000 ${unit}`.trim() : unit, cx, cy + 66);
    }} />
);

class WidgetItem extends Component<{ id: number; ctx: Dashboard; }> {
  main = this.props.ctx;
  input = new SignalNode(0, { default: 0 });

  get id() {
    return this.props.id;
  }

  widget = computed(() => normalizeWidget(this.main.widgets[this.props.id]));

  update(patch: Partial<TWidget>) {
    const { id, main } = this;
    main.widgets = main.widgets.toSpliced(id, 1, normalizeWidget({ ...this.widget.peek(), ...patch }));
  }

  delete() {
    batch(() => {
      this.main.widgets = this.main.widgets.toSpliced(this.id, 1);
    });
  }

  // Подпись строки с портом: значение числом справа
  numberView = computed(() => {
    const { digits, unit } = this.widget.value;
    return `${formatValue(this.input.value, digits)}${unit ? ` ${unit}` : ''}`;
  });

  view = computed(() => {
    const widget = this.widget.value;
    const { input } = this;

    switch (widget.type) {
      case 'number':
        return (
          <rsp.div className={s.dashNumber}>{this.numberView}</rsp.div>
        );

      case 'gauge':
        return (
          <GaugeView value={input} widget={widget} />
        );

      case 'bar':
        return (
          <div className={s.dashBar}>
            <rsp.div
              className={s.dashBarFill}
              data-red={computed(() => input.value >= widget.red || undefined)}
              style={computed(() => ({ width: `${ratio(input.value, widget.min, widget.max) * 100}%` }))} />
            <rsp.span>{this.numberView}</rsp.span>
          </div>
        );

      case 'lamp':
        return (
          <rsp.div className={s.dashLamp} data-on={computed(() => input.value > 0.5 || undefined)} />
        );
    }
  });

  // Поля редактора подписываются на сигнал один раз при монтировании,
  // поэтому сигналы постоянные, а не создаются заново на каждую версию виджета
  #text = (key: 'label' | 'unit' | 'min' | 'max' | 'red' | 'digits') => (
    computed(() => `${this.widget.value[key]}`)
  );

  texts = {
    label: this.#text('label'),
    unit: this.#text('unit'),
    min: this.#text('min'),
    max: this.#text('max'),
    red: this.#text('red'),
    digits: this.#text('digits'),
  };

  type = signal(this.widget.peek().type);

  // Пока Select не трогали, тип следует за сохранённым виджетом
  componentDidMount() {
    this.#unsync = effect(() => {
      this.type.value = this.widget.value.type;
    });
  }

  componentWillUnmount() {
    this.#unsync?.();
  }

  #unsync?: () => void;

  #field = (label: string, key: 'min' | 'max' | 'red' | 'digits') => (
    <Row label={label}>
      <div className={s.field}>
        <NumberInput text={this.texts[key]} onCommit={v => this.update({ [key]: v })} />
      </div>
    </Row>
  );

  // Зависит только от режима и типа: правка значения не пересобирает поля
  #kind = computed(() => this.widget.value.type);

  editor = computed(() => {
    if (!this.main.edit)
      return null;

    const kind = this.#kind.value;

    return (
      <div className={s.dashEditor}>
        <Select label="Type" value={this.type} variants={widgetTypes} change={type => type !== this.widget.peek().type && this.update({ type })} />
        <Row label="Label">
          <div className={s.field}>
            <TextInput text={this.texts.label} allowEmpty onCommit={label => this.update({ label })} />
          </div>
        </Row>
        {kind !== 'lamp' && (
          <>
            <Row label="Unit">
              <div className={s.field}>
                <TextInput text={this.texts.unit} allowEmpty onCommit={unit => this.update({ unit })} />
              </div>
            </Row>
            {this.#field('Digits', 'digits')}
          </>
        )}
        {(kind === 'gauge' || kind === 'bar') && (
          <>
            {this.#field('Min', 'min')}
            {this.#field('Max', 'max')}
            {this.#field('Red from', 'red')}
          </>
        )}
        <button onClick={() => this.delete()}>Delete</button>
      </div>
    );
  });

  render(): ReactNode {
    return (
      <div className={s.dashWidget}>
        <Row label={computed(() => this.widget.value.label)} port={this.input} />
        <rsp.div>{this.view}</rsp.div>
        <rsp.div>{this.editor}</rsp.div>
      </div>
    );
  }
}

// Приборная панель: несколько отображателей, у каждого свой вход
@name('Dashboard')
@group('monitor')
@icon(Gauge)
@reactive()
export default class Dashboard extends BaseNode {
  @prop @store widgets: TWidget[] = [{ ...defaultWidget }];

  @prop edit = false;

  _view = () => (
    <div className={s.dash}>
      {computed(() => this.widgets.map((_, i) => (
        <WidgetItem key={i} id={i} ctx={this} />
      )))}
      <div className={s.dashButtons}>
        <rsp.button onClick={() => this.edit = !this.edit}>
          {computed(() => this.edit ? 'Done' : 'Edit')}
        </rsp.button>
        <button onClick={() => batch(() => {
          this.widgets = [...this.widgets, { ...defaultWidget }];
          this.edit = true;
        })}>
          Add
        </button>
      </div>
    </div>
  );
}
