import { ReadonlySignal, useSignalEffect } from "@preact/signals-react";
import { ReactNode, useRef } from "react";

import { SignalNode } from "./signalNode";
import { SignalPort } from "../ports/SignalPort";
import rsp from "@vicimpa/rsp";
import s from "../styles.module.sass";

export type TRowProps = {
  label: ReactNode;
  port?: SignalNode;
  linked?: ReadonlySignal<boolean>;
  children?: ReactNode;
};

// Строка ноды: [порт] подпись | контрол
export const Row = ({ label, port, linked, children }: TRowProps) => (
  <rsp.div
    className={s.row}
    data-port={port ? '' : undefined}
    data-linked={linked?.value || undefined}
  >
    {port && <SignalPort value={port} bare />}
    <label title={typeof label === 'string' ? label : undefined}>{label}</label>
    {children}
  </rsp.div>
);

export type TNumberInputProps = {
  text: ReadonlySignal<string>;
  disabled?: ReadonlySignal<boolean> | boolean;
  onCommit: (value: number) => void;
};

// Поле числа: показывает text, пока не в фокусе; Enter или потеря фокуса — применить, Esc — отменить
export const NumberInput = ({ text, disabled, onCommit }: TNumberInputProps) => {
  const ref = useRef<HTMLInputElement>(null);

  useSignalEffect(() => {
    const value = text.value;

    if (ref.current && document.activeElement !== ref.current)
      ref.current.value = value;
  });

  return (
    <rsp.input
      ref={ref}
      className={s.number}
      defaultValue={text.peek()}
      disabled={disabled}
      spellCheck={false}
      onFocus={e => e.currentTarget.select()}
      onKeyDown={e => {
        e.stopPropagation();

        if (e.key === 'Escape')
          e.currentTarget.value = text.peek();

        if (e.key === 'Enter' || e.key === 'Escape')
          e.currentTarget.blur();
      }}
      onBlur={e => {
        const input = e.currentTarget;
        const value = +input.value;

        if (input.value.trim() !== '' && !isNaN(value))
          onCommit(value);

        input.value = text.peek();
      }} />
  );
};

export type TTextInputProps = {
  text: ReadonlySignal<string>;
  onCommit: (value: string) => void;
  // Разрешить сохранить пустую строку
  allowEmpty?: boolean;
};

// Текстовое поле с тем же поведением, что у NumberInput
export const TextInput = ({ text, onCommit, allowEmpty }: TTextInputProps) => {
  const ref = useRef<HTMLInputElement>(null);

  useSignalEffect(() => {
    const value = text.value;

    if (ref.current && document.activeElement !== ref.current)
      ref.current.value = value;
  });

  return (
    <input
      ref={ref}
      className={s.number}
      style={{ textAlign: 'left' }}
      defaultValue={text.peek()}
      spellCheck={false}
      onFocus={e => e.currentTarget.select()}
      onKeyDown={e => {
        e.stopPropagation();

        if (e.key === 'Escape')
          e.currentTarget.value = text.peek();

        if (e.key === 'Enter' || e.key === 'Escape')
          e.currentTarget.blur();
      }}
      onBlur={e => {
        const value = e.currentTarget.value.trim();

        if ((value || allowEmpty) && value !== text.peek())
          onCommit(value);

        e.currentTarget.value = text.peek();
      }} />
  );
};
