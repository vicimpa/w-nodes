import { FC, useRef } from "react";
import { Signal, useSignal, useSignalEffect } from "@preact/signals-react";

import rsp from "@vicimpa/rsp";
import s from "../styles.module.sass";
import { selectText } from "$library/dom";

export type TRangeProps = {
  label: string;
  value: Signal<number>;
  postfix?: string;
  min?: number;
  max?: number;
  accuracy?: number;
  change?: AudioParam | ((v: number) => any);
};

export const Range: FC<TRangeProps> = ({
  label,
  value,
  postfix,
  min = 0,
  max = 100,
  change,
  accuracy = 0
}) => {
  const valueString = useSignal(value.value.toString());
  const ref = useRef<HTMLSpanElement>(null);
  const step = 1 / (10 ** accuracy);

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
      <p>
        <span>
          {label}:
        </span>
        <span data-grow />
        <rsp.span
          ref={ref}
          onDoubleClick={(e) => {
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
      </p>
      <rsp.input
        type="range"
        bind-value={valueString}
        min={min}
        max={max}
        step={step} />
    </div>
  );
};