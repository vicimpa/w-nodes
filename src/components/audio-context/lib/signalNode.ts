import { ReadonlySignal, Signal, computed, signal } from "@preact/signals-react";

export type SignalNode = ReadonlySignal<number> & {
  connect(signal: Signal<number>): void;
  disconnect(signal: Signal<number>): void;
  connected(): boolean;
};

export const signalNode = (defaultValue: number | Signal<number>): SignalNode => {
  const _read = signal<Signal<number>[]>([]);

  return Object.assign(
    computed(() => (
      _read.value.length ? (
        _read.value.reduce((a, b) => a + b.value, 0)
      ) : (defaultValue instanceof Signal ? (
        defaultValue.value
      ) : defaultValue)
    )),
    {
      connect(signal: Signal<number>) {
        if (!signal)
          throw new Error('No port to connect');
        const array = _read.peek();
        const index = array.indexOf(signal);

        if (index !== -1)
          throw new Error('Already connect');

        _read.value = [...array, signal];
      },
      disconnect(signal: Signal<number>) {
        const array = _read.peek();
        const index = array.indexOf(signal);

        if (index !== -1)
          _read.value = array.toSpliced(index, 1);
      },
      connected() {
        return !!_read.value.length;
      },
    }
  );
};