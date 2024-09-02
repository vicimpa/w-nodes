import { CSSProperties, FC, useEffect } from "react";
import { computed, useComputed, useSignal } from "@preact/signals-react";
import { prop, reactive } from "$library/signals";

import { BaseNode } from "../lib/BaseNode";
import { SignalPort } from "../ports/SignalPort";
import { connect } from "$library/connect";
import { dispose } from "$library/dispose";
import { name } from "$library/function";
import { provide } from "$library/provider";
import rsp from "@vicimpa/rsp";
import { store } from "$library/store";
import { windowEvents } from "$library/events";

const KeyboardItem: FC<{ index: number; ctx: Keyboard; }> = ({ index, ctx }) => {
  const port = useSignal(0);

  useEffect(() => (
    dispose(
      windowEvents('keydown', ({ code, ctrlKey, metaKey, shiftKey }) => {
        if (ctrlKey || metaKey || shiftKey)
          return;

        if (ctx.keys[index] !== code)
          return;
        port.value = 1;
      }),
      windowEvents('keyup', ({ code }) => {
        if (ctx.keys[index] !== code)
          return;

        port.value = 0;
      }),
      windowEvents('blur', () => {
        port.value = 0;
      }),
    )
  ), []);

  const style = useComputed<CSSProperties>(() => ({
    padding: 5,
    width: '100%',
    background: port.value ? '#060' : '#333'
  }));

  return (
    <tr>
      <td>
        {index + 1}
      </td>
      <rsp.td style={style}>
        Key: "{computed(() => ctx.keys[index] ?? 'press to set')}"
      </rsp.td>
      <td>
        <rsp.button onClick={() => ctx.keys = ctx.keys.toSpliced(index, 1, null)} disabled={computed(() => !ctx.keys[index])}>Change</rsp.button>
      </td>
      <td>
        <SignalPort value={port} output />
      </td>
    </tr>
  );
};

@name('Keyboard')
@provide()
@connect(ctx => (
  dispose(
    windowEvents('keydown', ({ code }) => {
      const index = ctx.keys.indexOf(null);
      if (index === -1) return;
      ctx.keys = ctx.keys.toSpliced(index, 1, code);
    })
  )
))
@reactive()
export default class Keyboard extends BaseNode {
  @prop @store keys: Array<string | null> = [];
  _view = () => (
    <>
      <table style={{ width: 300 }}>
        <tbody>
          {
            computed(() => this.keys.map((_, i) => (
              <KeyboardItem key={i} index={i} ctx={this} />
            )))
          }
        </tbody>
      </table>
      <button onClick={() => this.keys = [...this.keys, null]}>Add</button>
    </>
  );
}