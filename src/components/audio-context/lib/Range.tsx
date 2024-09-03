import { FC, useRef } from "react";
import { useComputed, useSignal, useSignalEffect } from "@preact/signals-react";

import { SignalNode } from "./signalNode";
import { SignalPort } from "../ports/SignalPort";
import { minMax } from "$library/math";
import rsp from "@vicimpa/rsp";
import s from "../styles.module.sass";
import { selectText } from "$library/dom";

export type TRangeProps = {
  label: string;
  value: SignalNode;
  postfix?: string;
  accuracy?: number;
  readonly?: boolean;
  strict?: boolean;
  noPort?: boolean;
  onChange?: (v: number) => any;
};


export const Range: FC<TRangeProps> = ({
  label,
  value,
  postfix,
  onChange,
  readonly,
  strict,
  noPort = false,
  accuracy = 0,
}) => {
  const valueString = useSignal(value.value.toString());
  const ref = useRef<HTMLSpanElement>(null);
  const step = 1 / (10 ** accuracy);
  const isConnected = useComputed(() => readonly || value.connected);
  const getValue = (val: number) => {
    return strict ? minMax(val, value.min ?? -Infinity, value.max ?? Infinity) : val;
  };

  useSignalEffect(() => {
    const val = +valueString.value;

    if (isNaN(val)) {
      valueString.value = value.peek().toString();
    } else {
      value.value = getValue(val);
    }
  });

  useSignalEffect(() => {
    valueString.value = value.value.toString();
    if (ref.current)
      ref.current.innerText = value.value.toFixed(accuracy);
    onChange?.(getValue(value.value));
  });

  const on = (target: HTMLSpanElement) => {
    target.contentEditable = 'plaintext-only';
    target.focus();
    selectText(target);
  };

  const off = (target: HTMLSpanElement) => {
    var val = +target.innerText;
    if (!isNaN(val)) {
      value.value = val;
    } else {
      target.innerText = value.value.toFixed(accuracy);
    }
    target.contentEditable = 'false';
  };

  return (
    <div className={s.input}>
      <div className={s.type}>
        <span>
          {!noPort && <SignalPort value={value} />}
          {label}:
        </span>
        <span data-grow />
        <rsp.span
          ref={ref}
          style={{ cursor: 'pointer', fontFamily: 'monospace' }}
          onDoubleClick={(e) => {
            if (isConnected.value)
              return;
            on(e.currentTarget);
          }}
          onKeyDown={e => {
            if (e.code !== 'Enter')
              return;
            e.preventDefault();
            e.stopPropagation();
            off(e.currentTarget);
          }}
          onBlur={e => {
            e.preventDefault();
            e.stopPropagation();
            off(e.currentTarget);
          }}
        />
        <small>
          {postfix}
        </small>
      </div>
      <rsp.input
        type="range"
        bind-value={valueString}
        disabled={isConnected}
        onKeyDown={e => e.preventDefault()}
        min={value.min}
        max={value.max}
        onContextMenu={e => {
          e.preventDefault();
          value.value = value.default ?? value.value;
        }}
        step={step} />
    </div>
  );
};