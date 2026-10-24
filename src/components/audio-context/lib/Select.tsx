import { Signal, useComputed, useSignalEffect } from "@preact/signals-react";

import { Row } from "./Row";
import rsp from "@vicimpa/rsp";
import s from "../styles.module.sass";

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
  // Не растягивать ноду под самый длинный пункт
  shrink?: boolean;
};

export const Select = <T, const V extends TSelectVariant<T>>({
  label,
  value,
  variants,
  groupBy,
  change,
  shrink,
}: TSelectProps<T, V>) => {
  const index = useComputed(() => `${variants.findIndex(variant => variant.value === value.value)}`);
  const title = useComputed(() => {
    const variant = variants[+index.value];
    return variant ? variant.label ?? `${variant.value}` : '';
  });

  useSignalEffect(() => {
    change?.(value.value);
  });

  const option = (variant: V) => {
    const i = variants.indexOf(variant);
    return <option value={i} key={i}>{variant.label ?? `${variant.value}`}</option>;
  };

  return (
    <Row label={label}>
      <div className={s.field}>
        <rsp.select
          value={index}
          data-shrink={shrink || undefined}
          title={shrink ? title : undefined}
          onKeyDown={e => e.preventDefault()}
          onChange={e => {
            const variant = variants[+e.currentTarget.value];
            if (variant) value.value = variant.value;
            e.currentTarget.blur();
          }}
        >
          {
            groupBy ? (
              [...Map.groupBy(variants, groupBy)].map(([group, items]) => (
                <optgroup key={group} label={group}>
                  {items.map(option)}
                </optgroup>
              ))
            ) : variants.map(option)
          }
        </rsp.select>
      </div>
    </Row>
  );
};
