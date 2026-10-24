import { batch, effect, signal, untracked } from "@preact/signals-react";

import { NodePort } from "../NodePort";
import { dispose } from "$library/dispose";
import { intersectionObserver } from "@vicimpa/observers";

// Позиция порта = угол ноды + смещение порта внутри неё.
// Смещение меряется по offsetLeft/offsetTop (не зависят от масштаба и сдвига карты)
// только при появлении порта, изменении размера ноды и когда порт становится видимым.
// Двигать ноду или камеру после этого — чистая арифметика без чтения DOM.
export default (ctx: NodePort) => (
  effect(() => {
    const { value: port } = ctx.port;
    const { value: box } = ctx.item.viewDivRef;

    if (!port || !box)
      return;

    const local = signal<{ x: number, y: number; } | null>(null);

    const measure = () => {
      var x = port.offsetWidth / 2;
      var y = port.offsetHeight / 2;
      var elem: Element | null = port;

      while (elem instanceof HTMLElement && elem !== box) {
        x += elem.offsetLeft;
        y += elem.offsetTop;
        elem = elem.offsetParent;
      }

      // Не дошли до ноды: порт скрыт (display: none), измерим, когда станет видим
      if (elem !== box)
        return;

      const prev = local.peek();

      if (!prev || prev.x !== x || prev.y !== y)
        local.value = { x, y };
    };

    return dispose(
      intersectionObserver(port, measure),
      effect(() => {
        ctx.item.width;
        ctx.item.height;
        untracked(measure);
      }),
      effect(() => {
        const offset = local.value;

        if (!offset)
          return;

        const { item } = ctx;
        const x = Math.round(item.x) - item.width / 2 + offset.x;
        const y = Math.round(item.y) - item.height / 2 + offset.y;

        if (untracked(() => ctx.x !== x || ctx.y !== y)) {
          batch(() => {
            ctx.x = x;
            ctx.y = y;
          });
        }
      })
    );
  })
);
