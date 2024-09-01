import { ReadonlySignal, Signal, computed, signal } from "@preact/signals-react";

export type SignalNode = ReadonlySignal<number> & {
  connect(signal: Signal<number>): void;
  disconnect(signal: Signal<number>): void;
  connected(): boolean;
};

export const signalNode = (defaultValue: number | Signal<number>) => {
  const _read = signal<Signal<number> | null>(null);

  return Object.assign(
    computed(() => _read.value?.value ?? (defaultValue instanceof Signal ? defaultValue.value : defaultValue)),
    {
      connect(signal: Signal<number>) {
        if (!signal)
          throw new Error('No port to connect');

        if (_read.peek())
          throw new Error('Alerdy connected');

        _read.value = signal;
      },
      disconnect(signal: Signal<number>) {
        if (_read.peek() !== signal)
          throw new Error('No connected');

        _read.value = null;
      },
      connected() {
        return !!_read.value;
      },
    }
  );
};