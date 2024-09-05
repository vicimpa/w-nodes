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
    variants.map((variant, id) => ({ variant, id: `value-${id}` }))
  ), [variants]);

  const _value = useSignal(_variants.find(({ variant: e }) => e.value === value.value)!.id);

  useSignalEffect(() => {
    value.value = _variants.find(({ id }) => id === _value.value)!.variant.value;
  });

  useSignalEffect(() => {
    _value.value = _variants.find(({ variant: e }) => e.value === value.value)!.id;
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
                  variants.map(({ variant, id }) => (
                    <option value={id} key={id}>{variant.label}</option>
                  ))
                }
              </optgroup>
            ))
          ) : (
            _variants.map(({ variant, id }) => (
              <option value={id} key={id}>{variant.label}</option>
            ))
          )
        }
      </rsp.select>
    </div>
  );
};