import { CSSProperties, useMemo, useRef } from "react";
import { Signal, computed, useComputed, useSignal, useSignalEffect } from "@preact/signals-react";

import { SignalPort } from "../ports/SignalPort";
import rsp from "@vicimpa/rsp";
import s from "../styles.module.sass";
import { selectText } from "$library/dom";
import { signalNode } from "./signalNode";

export type TNumberProps = {
  label: string;
  value: Signal<number>;
  change?: ((v: number) => any);
  noPort?: boolean;
  readonly?: boolean;
};

export const Number = ({
  label,
  value,
  change,
  noPort,
  readonly,
}: TNumberProps) => {
  const valueString = useSignal(value.value.toString());

  const ref = useRef<HTMLSpanElement>(null);
  const port = useMemo(() => signalNode(0), []);
  const isConnected = useComputed(() => readonly || port.connected());

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
      target.innerText = value.value.toString();
    }
    target.contentEditable = 'false';
  };

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
      ref.current.innerText = value.value.toString();

    if (change) change(value.value);
  });

  useSignalEffect(() => {
    if (port.connected())
      value.value = port.value;
  });

  const style = useComputed<CSSProperties>(() => ({
    cursor: 'pointer',
    display: 'inline-block',
    fontFamily: 'monospace',
    width: '100%',
    height: '100%',
    opacity: isConnected.value ? .5 : 1, overflow: 'hidden'
  }));

  return (
    <div className={s.input}>
      <div className={s.type}>
        {!noPort && <SignalPort value={port} />}
        <span>
          {label}:
        </span>
      </div>

      <table style={{ border: '1px solid #999', minWidth: 250, backgroundColor: '#111' }}>
        <tbody>
          <tr>
            <td style={{ background: '#444', padding: .25 }}>
              {computed(() => isConnected.value ? 'Signal' : 'Value')}:

            </td>
            <td style={{ width: '100%', textAlign: 'right' }}>
              <rsp.span
                ref={ref}
                style={style}
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
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};