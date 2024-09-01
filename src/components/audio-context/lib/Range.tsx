import { FC, useMemo, useRef } from "react";
import { Signal, useComputed, useSignal, useSignalEffect } from "@preact/signals-react";

import { SignalPort } from "../ports/SignalPort";
import rsp from "@vicimpa/rsp";
import s from "../styles.module.sass";
import { selectText } from "$library/dom";
import { signalNode } from "./signalNode";

export type TRangeProps = {
  label: string;
  value: Signal<number>;
  postfix?: string;
  min?: number;
  max?: number;
  default?: number;
  accuracy?: number;
  change?: AudioParam | ((v: number) => any);
  onChange?: (v: number) => any;
};

const or = <T,>(val: AudioParam | ((v: number) => any) | undefined, fn: (p: AudioParam) => T) => {
  if (val && (val instanceof AudioParam)) return fn(val);
};

export const Range: FC<TRangeProps> = ({
  label,
  value,
  postfix,
  change,
  onChange,
  default: defaultValue = or(change, v => v.defaultValue) ?? undefined,
  min = or(change, v => v.minValue) ?? 0,
  max = or(change, v => v.maxValue) ?? 100,
  accuracy = 0,
}) => {
  const valueString = useSignal(value.value.toString());
  const ref = useRef<HTMLSpanElement>(null);
  const step = 1 / (10 ** accuracy);
  const port = useMemo(() => signalNode(0), []);
  const isConnected = useComputed(() => port.connected());

  useSignalEffect(() => {
    const val = +valueString.value;

    if (isNaN(val)) {
      valueString.value = value.peek().toString();
    } else {
      value.value = val;
    }
  });

  useSignalEffect(() => {
    valueString.value = value.value.toString();
    if (ref.current)
      ref.current.innerText = value.value.toFixed(accuracy);

    if (change) {
      if (change instanceof Function)
        change(value.value);
      else
        change.value = value.value;
    }

    onChange?.(value.value);
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

  useSignalEffect(() => {
    if (port.connected())
      value.value = port.value;
  });

  return (
    <div className={s.input}>
      <div className={s.type}>
        <span>
          <SignalPort value={port} />
          {label}:
        </span>
        <span data-grow />
        <rsp.span
          ref={ref}
          style={{ cursor: 'pointer' }}
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
        min={min}
        max={max}
        onContextMenu={e => {
          e.preventDefault();
          value.value = defaultValue ?? value.value;
        }}
        step={step} />
    </div>
  );
};