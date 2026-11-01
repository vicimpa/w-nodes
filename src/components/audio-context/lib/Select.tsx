import { Signal, useComputed, useSignalEffect } from "@preact/signals-react";
import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";

import { ChevronDown } from "lucide-react";
import { Row } from "./Row";
import s from "../styles.module.sass";

export type TSelectVariant<T> = {
  value: T,
  label?: string;
};

type TSelectControlProps<T, V extends TSelectVariant<T>> = {
  variants: V[];
  value: T;
  change: (value: T) => void;
  label?: string;
  groupBy?: (val: V) => string;
  disabled?: boolean;
  placeholder?: string;
  shrink?: boolean;
};

export const SelectControl = <T, const V extends TSelectVariant<T>>({
  variants,
  value,
  change,
  label,
  groupBy,
  disabled,
  placeholder = '',
  shrink,
}: TSelectControlProps<T, V>) => {
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const list = useRef<HTMLDivElement>(null);
  const id = useId();
  const [open, setOpen] = useState(false);
  const [up, setUp] = useState(false);
  const selected = variants.findIndex(variant => variant.value === value);
  const [active, setActive] = useState(Math.max(0, selected));
  const variant = variants[selected];
  const title = variant ? variant.label ?? `${variant.value}` : placeholder;

  useEffect(() => {
    if (!open) return;

    const close = (event: PointerEvent) => {
      if (event.target instanceof Node && !root.current?.contains(event.target))
        setOpen(false);
    };

    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, [open]);

  useEffect(() => {
    if (disabled) setOpen(false);
  }, [disabled]);

  useLayoutEffect(() => {
    if (!open || !trigger.current || !list.current) return;

    const triggerRect = trigger.current.getBoundingClientRect();
    const listRect = list.current.getBoundingClientRect();
    const below = window.innerHeight - triggerRect.bottom;
    const above = triggerRect.top;

    setUp(listRect.height > below && above > below);
  }, [open]);

  useEffect(() => {
    if (open)
      list.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [active, open]);

  const show = () => {
    if (!variants.length) return;
    setActive(Math.max(0, selected));
    setOpen(true);
  };

  const choose = (index: number) => {
    const variant = variants[index];
    if (!variant) return;

    change(variant.value);
    setOpen(false);
    trigger.current?.focus();
  };

  const option = (variant: V) => {
    const index = variants.indexOf(variant);

    return (
      <div
        id={`${id}-${index}`}
        className={s.option}
        data-index={index}
        data-active={active === index || undefined}
        data-selected={selected === index || undefined}
        role="option"
        aria-selected={selected === index}
        key={index}
        onMouseEnter={() => setActive(index)}
        onMouseDown={event => event.preventDefault()}
        onClick={() => choose(index)}
      >
        {variant.label ?? `${variant.value}`}
      </div>
    );
  };

  return (
    <div
      ref={root}
      className={s.dropdown}
      data-open={open || undefined}
      data-shrink={shrink || undefined}
      onKeyDown={event => {
        event.stopPropagation();
        if (disabled) return;

        if (event.key === 'Escape' && open) {
          event.preventDefault();
          setOpen(false);
          return;
        }

        if (!open) {
          if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(event.key)) {
            event.preventDefault();
            show();
          }
          return;
        }

        switch (event.key) {
          case 'ArrowDown':
          case 'ArrowUp': {
            event.preventDefault();
            const direction = event.key === 'ArrowDown' ? 1 : -1;
            setActive(current => (current + direction + variants.length) % variants.length);
            return;
          }
          case 'Home':
          case 'End':
            event.preventDefault();
            setActive(event.key === 'Home' ? 0 : variants.length - 1);
            return;
          case 'Enter':
          case ' ':
            event.preventDefault();
            choose(active);
            return;
          case 'Tab':
            setOpen(false);
        }
      }}
    >
      <button
        ref={trigger}
        type="button"
        className={s.select}
        title={shrink ? title : undefined}
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? id : undefined}
        aria-activedescendant={open && variants[active] ? `${id}-${active}` : undefined}
        disabled={disabled}
        onClick={() => open ? setOpen(false) : show()}
      >
        <span>{title}</span>
        <ChevronDown size={12} />
      </button>
      {open && (
        <div ref={list} id={id} className={s.options} data-up={up || undefined} role="listbox">
          {
            groupBy ? (
              [...Map.groupBy(variants, groupBy)].map(([group, items]) => (
                <div role="group" aria-label={group} key={group}>
                  <div className={s.optionGroup}>{group}</div>
                  {items.map(option)}
                </div>
              ))
            ) : variants.map(option)
          }
        </div>
      )}
    </div>
  );
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
  const control = useComputed(() => (
    <SelectControl
      label={label}
      value={value.value}
      variants={variants}
      groupBy={groupBy}
      shrink={shrink}
      change={next => value.value = next}
    />
  ));

  useSignalEffect(() => {
    change?.(value.value);
  });

  return (
    <Row label={label}>
      <div className={s.field}>
        {control}
      </div>
    </Row>
  );
};
