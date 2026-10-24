import type { TSlot } from "./state";

export type TPair<N> = [from: N, to: N];

export type TRoutingIO<N> = {
  connect(from: N, to: N): void;
  disconnect(from: N, to: N): void;
};

// Набор соединений «узел → узел», который приводится к нужному списку: лишние снимаются, новые
// подключаются, общие не трогаются (в Web Audio повторный connect той же пары ничего не добавляет,
// а один disconnect снял бы её целиком)
export class Routing<N> {
  #pairs: TPair<N>[] = [];
  #io: TRoutingIO<N>;

  constructor(io: TRoutingIO<N>) {
    this.#io = io;
  }

  get pairs(): readonly TPair<N>[] {
    return this.#pairs;
  }

  set(pairs: TPair<N>[]) {
    const has = (list: TPair<N>[], [a, b]: TPair<N>) => list.some(([c, d]) => a === c && b === d);
    const next: TPair<N>[] = [];

    for (const pair of pairs)
      if (!has(next, pair)) next.push(pair);

    for (const pair of this.#pairs)
      if (!has(next, pair)) this.#io.disconnect(...pair);

    for (const pair of next)
      if (!has(this.#pairs, pair)) this.#io.connect(...pair);

    this.#pairs = next;
  }

  clear() {
    this.set([]);
  }
}

// Мосты между внешним и внутренним GainNode слота: так блок звучит без компиляции
export const bridgePairs = <N,>(slots: TSlot[], outer: (id: string) => N, inner: (id: string) => N): TPair<N>[] => (
  slots.map(({ id, kind }) => kind === 'in' ? [outer(id), inner(id)] : [inner(id), outer(id)])
);
