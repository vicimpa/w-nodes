import { Signal, computed, effect, useComputed } from "@preact/signals-react";
import { findInput, inputs, request, status } from "$library/midi";

import { Select } from "./Select";
import s from "../styles.module.sass";

const channels = [
  { value: 0, label: 'Omni' },
  ...Array.from({ length: 16 }, (_, i) => ({ value: i + 1, label: `${i + 1}` })),
];

// Держит выбранное устройство: при промахе по id ищет по имени и запоминает имя
export const followDevice = (device: Signal<string>, name: Signal<string>) => (
  effect(() => {
    const id = device.value;

    if (id === 'all')
      return;

    const found = findInput(inputs.value, id, name.value);

    if (!found)
      return;

    device.value = found.id;
    name.value = found.name;
  })
);

export const MidiDevice = ({ device, name }: { device: Signal<string>; name: Signal<string>; }) => {
  const select = useComputed(() => {
    const id = device.value;
    const variants = [
      { value: 'all', label: 'All devices' },
      ...inputs.value.map(input => ({ value: input.id, label: input.name })),
    ];

    if (!variants.some(variant => variant.value === id))
      variants.push({ value: id, label: `${name.value || id} (offline)` });

    return (
      <Select
        key={variants.map(variant => variant.value).join('\n')}
        label="Device"
        value={device}
        variants={variants}
        shrink
      />
    );
  });

  return <>{select}</>;
};

export const MidiChannel = ({ channel }: { channel: Signal<number>; }) => (
  <Select label="Channel" value={channel} variants={channels} />
);

const messages = {
  idle: null,
  ready: null,
  pending: 'Waiting for MIDI permission…',
  denied: 'MIDI access was denied',
  unsupported: 'Web MIDI is not available in this browser',
};

const message = computed(() => {
  const text = messages[status.value];

  if (status.value === 'ready' && !inputs.value.length)
    return <div className={s.message}>No MIDI devices connected</div>;

  if (!text)
    return null;

  return (
    <div className={s.message} data-error={status.value !== 'pending' || undefined}>
      {text}
      {status.value === 'denied' && <button onClick={() => request()}>Retry</button>}
    </div>
  );
});

export const MidiStatus = () => <>{message}</>;
