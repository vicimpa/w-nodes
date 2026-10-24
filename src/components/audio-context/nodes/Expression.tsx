import { MAX_LENGTH, PROCESSOR_INPUTS, STOP_MESSAGE, compile, processorSource } from "$library/expression";
import { ReadonlySignal, Signal, computed, effect, signal, useSignalEffect } from "@preact/signals-react";
import { group, icon } from "../_groups";
import { prop, reactive } from "@vicimpa/decorators";

import { AudioPort } from "../ports/AudioPort";
import { BaseNode } from "../lib/BaseNode";
import { Number } from "../lib/Number";
import { SignalNode } from "../lib/signalNode";
import { SquareFunction } from "lucide-react";
import { ctx } from "../ctx";
import { defineRuntimeWorklet } from "../lib/runtimeWorklet";
import { dispose } from "$library/dispose";
import { name } from "$library/function";
import { pipe } from "../lib/pipe";
import rsp from "@vicimpa/rsp";
import s from "../styles.module.sass";
import { store } from "$components/node-editor";
import { useRef } from "react";

type Program = {
  node: AudioWorkletNode;
  unwire: () => void;
};

const stop = ({ node, unwire }: Program) => {
  unwire();
  node.port.postMessage(STOP_MESSAGE);
};

type TExpressionFieldProps = {
  text: ReadonlySignal<string>;
  draft: Signal<string | null>;
  invalid: ReadonlySignal<true | undefined>;
  onCommit: (value: string) => void;
};

// Поле формулы: Enter или потеря фокуса — применить, Shift+Enter — перенос строки, Esc — отменить
const ExpressionField = ({ text, draft, invalid, onCommit }: TExpressionFieldProps) => {
  const ref = useRef<HTMLTextAreaElement>(null);

  useSignalEffect(() => {
    const value = text.value;

    if (ref.current && document.activeElement !== ref.current)
      ref.current.value = value;
  });

  return (
    <rsp.textarea
      ref={ref}
      className={s.expression}
      data-invalid={invalid}
      defaultValue={text.peek()}
      maxLength={MAX_LENGTH}
      rows={2}
      spellCheck={false}
      placeholder="sin(TAU * a * t) * b"
      onFocus={e => draft.value = e.currentTarget.value}
      onInput={e => draft.value = e.currentTarget.value}
      onKeyDown={e => {
        e.stopPropagation();

        if (e.key === 'Escape') {
          e.currentTarget.value = text.peek();
          e.currentTarget.blur();
        }

        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          e.currentTarget.blur();
        }
      }}
      onBlur={e => {
        onCommit(e.currentTarget.value);
        draft.value = null;
      }} />
  );
};

@name('Expression')
@group('math')
@icon(SquareFunction)
@reactive()
export default class extends BaseNode {
  #out = new GainNode(ctx);
  #program: Program | null = null;
  #version = 0;

  @store _a = new SignalNode(220, { default: 220 });
  @store _b = new SignalNode(0.5, { default: 0.5 });
  @store _c = new SignalNode(0, { default: 0 });
  @store _d = new SignalNode(0, { default: 0 });

  @prop @store expression = 'sin(TAU * a * t) * b';

  // Проект может прийти по ссылке с чем угодно в этом поле
  _text = computed(() => typeof this.expression === 'string' ? this.expression : '');
  _draft = signal<string | null>(null);
  _loadError = signal('');

  _compiled = computed(() => compile(this.expression));

  // Пока поле редактируется — ошибка черновика, иначе — сохранённой формулы или загрузки
  _error = computed(() => {
    const draft = this._draft.value;
    const result = draft !== null ? compile(draft) : this._compiled.value;

    if (!result.ok)
      return `${result.error}`;

    return draft !== null ? '' : this._loadError.value;
  });

  _invalid = computed(() => !!this._error.value || undefined);

  _errorView = computed(() => (
    this._error.value && <div className={s.expressionError}>{this._error.value}</div>
  ));

  async #load(kernel: string) {
    const version = ++this.#version;

    try {
      const processor = await defineRuntimeWorklet(kernel, name => processorSource(name, kernel));

      if (version !== this.#version)
        return;

      const node = new AudioWorkletNode(ctx, processor, {
        numberOfInputs: 0,
        numberOfOutputs: 1,
        outputChannelCount: [1],
      });

      // Сначала подключаем новую программу, потом снимаем старую
      const program: Program = {
        node,
        unwire: dispose(
          ...PROCESSOR_INPUTS.map(key => pipe(this[`_${key}`], node.parameters.get(key)!)),
          pipe(node, this.#out),
        ),
      };

      const old = this.#program;
      this.#program = program;
      if (old) stop(old);

      this._loadError.value = '';
    } catch (error) {
      if (version !== this.#version)
        return;

      console.error(error);
      this._loadError.value = 'Failed to load the compiled expression';
    }
  }

  _connect = () => dispose(
    effect(() => {
      const result = this._compiled.value;

      // С ошибкой разбора продолжает играть последняя рабочая программа
      if (result.ok)
        this.#load(result.kernel);
    }),
    () => {
      this.#version++;
      if (this.#program) stop(this.#program);
      this.#program = null;
    },
  );

  output = (
    <AudioPort value={this.#out} output />
  );

  _view = () => (
    <>
      {PROCESSOR_INPUTS.map(key => (
        <Number key={key} label={key} value={this[`_${key}`]} />
      ))}

      <ExpressionField
        text={this._text}
        draft={this._draft}
        invalid={this._invalid}
        onCommit={value => this.expression = value} />

      {this._errorView}
    </>
  );
}
