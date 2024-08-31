import { Signal, useSignal, useSignalEffect } from "@preact/signals-react";

import rsp from "@vicimpa/rsp";
import s from "../styles.module.sass";
import { useMemo } from "react";

export type TSelectProps<T> = {
  label: string;
  variants: { value: T, label?: string; }[];
  value: Signal<T>;
  change?: ((v: T) => any);
};

export const Select = <T,>({
  label,
  value,
  variants,
  change,
}: TSelectProps<T>) => {
  var id = 0;

  const _variants = useMemo(() => (
    variants.map(({ value, label = `${value}` }) => ({
      id: `val_${id++}`,
      value,
      label
    }))
  ), [variants]);

  const _value = useSignal(_variants.find(e => e.value === value.value)!.id);

  useSignalEffect(() => {
    value.value = _variants.find(e => e.id === _value.value)!.value;
  });

  useSignalEffect(() => {
    _value.value = _variants.find(e => e.value === value.value)!.id;
    change && change(value.value);
  });

  return (
    <div className={s.input}>
      <p>
        <span>
          {label}:
        </span>
      </p>
      <rsp.select bind-value={_value}>
        {_variants.map(e => (
          <option value={e.id} key={e.id}>{e.label}</option>
        ))}
      </rsp.select>
    </div>
  );
};