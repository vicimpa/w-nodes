import { Signal, useSignal, useSignalEffect } from "@preact/signals-react";

import rsp from "@vicimpa/rsp";
import s from "../styles.module.sass";
import { useMemo } from "react";

export type TSelectVariant<T> = {
  value: T,
  label?: string;
};

export type TSelectProps<T, V extends TSelectVariant<T>> = {
  label: string;
  variants: V[];
  value: Signal<T>;
  groupBy?: (val: V) => string;
  change?: ((v: T) => any);
};

export const Select = <T, const V extends TSelectVariant<T>>({
  label,
  value,
  variants,
  groupBy,
  change,
}: TSelectProps<T, V>) => {
  const _variants = useMemo(() => (
    variants.map((variant, id) => ({ variant, id: `value-${id}`, label: `${variant.label ?? variant.value}` }))
  ), [variants]);

  const _value = useSignal(_variants.find(({ variant: e }) => e.value === value.value)?.id ?? '');

  useSignalEffect(() => {
    const find = _variants.find(({ id }) => id === _value.value);
    if (!find) return;
    value.value = find.variant.value;
  });

  useSignalEffect(() => {
    const find = _variants.find(({ variant: e }) => e.value === value.value);
    if (!find) return;

    _value.value = find.id;
    change && change(value.value);
  });

  return (
    <div className={s.input}>
      <div className={s.type}>
        <span>
          {label}:
        </span>
      </div>
      <rsp.select bind-value={_value} onKeyDown={e => e.preventDefault()} onChange={e => e.currentTarget.blur()}>
        {
          groupBy ? (
            [
              ...Map.groupBy(_variants, ({ variant }) => groupBy(variant))
            ].map(([group, variants], index) => (
              <optgroup key={index} label={group}>
                {
                  variants.map(({ label, id }) => (
                    <option value={id} key={id}>{label}</option>
                  ))
                }
              </optgroup>
            ))
          ) : (
            _variants.map(({ id, label }) => (
              <option value={id} key={id}>{label}</option>
            ))
          )
        }
      </rsp.select>
    </div>
  );
};