import { CSSProperties, Component, ReactNode } from "react";
import { computed, effect } from "@preact/signals-react";
import { prop, reactive } from "$library/signals";

import { BaseNode } from "../lib/BaseNode";
import { SignalNode } from "../lib/signalNode";
import { SignalPort } from "../ports/SignalPort";
import { connect } from "$library/connect";
import { dispose } from "$library/dispose";
import { name } from "$library/function";
import rsp from "@vicimpa/rsp";
import { store } from "$library/store";
import { windowEvents } from "$library/events";

@connect((ctx) => {
  dispose(
    (
      ctx.keyboard.items = [
        ...ctx.keyboard.items, ctx
      ],

      () => {
        ctx.keyboard.items = ctx.keyboard.items.filter(e => e !== ctx);
      }
    ),
    windowEvents('keydown', ({ code, ctrlKey, metaKey, shiftKey }) => {
      if (ctrlKey || metaKey || shiftKey)
        return;

      if (ctx.keyboard.keys[ctx.index] !== code)
        return;
      ctx.port.value = 1;
    }),
    windowEvents('keyup', ({ code }) => {
      if (ctx.keyboard.keys[ctx.index] !== code)
        return;

      ctx.port.value = 0;
    }),
    windowEvents('blur', () => {
      ctx.port.value = 0;
    }),
  );
})
class KeyboardItem extends Component<{ index: number; ctx: Keyboard; }> {
  keyboard = this.props.ctx;
  index = this.props.index;
  port = new SignalNode(0, { min: 0, max: 1, default: 0 });

  style = computed<CSSProperties>(() => ({
    padding: 5,
    width: '100%',
    background: this.port.value ? '#060' : '#333'
  }));

  render(): ReactNode {
    const { index, style, keyboard, port } = this;

    return (
      <tr>
        <td>
          {index + 1}
        </td>
        <rsp.td style={style}>
          Key: "{computed(() => keyboard.keys[index] ?? 'press to set')}"
        </rsp.td>
        <td>
          <rsp.button
            onClick={() => keyboard.keys = keyboard.keys.toSpliced(index, 1, null)}
            disabled={computed(() => !keyboard.keys[index])}>
            Change
          </rsp.button>
        </td>
        <td>
          <SignalPort value={port} output />
        </td>
      </tr>
    );
  }
}


@name('Keyboard')
@connect((ctx) => (
  effect(() => {
    const items = ctx.items;
    ctx._anyPress.value = +(items.findIndex(e => e.port.value) !== -1);
  }),
  effect(() => {
    const { activeItems } = ctx;

    for (var item of ctx.items) {
      if (item.port.value && !activeItems.has(item))
        activeItems.add(item);
      if (!item.port.value && activeItems.has(item))
        activeItems.delete(item);
    }

    const active = [...activeItems].at(-1);

    if (active)
      ctx._lastIndex.value = active.index;
  })
))
@reactive()
export default class Keyboard extends BaseNode {
  @prop @store keys: Array<string | null> = [null];

  @prop items: KeyboardItem[] = [];
  activeItems = new Set<KeyboardItem>();

  _anyPress = new SignalNode(0, { min: 0, max: 1, default: 0 });
  _lastIndex = new SignalNode(0, { min: 0, default: 0 });

  _connect = () => (
    dispose(
      windowEvents('keydown', ({ code }) => {
        const index = this.keys.indexOf(null);
        if (index === -1) return;
        this.keys = this.keys.toSpliced(index, 1, code);
      })
    )
  );

  _view = () => (
    <>
      <table style={{ width: 300 }}>
        <tbody>
          <tr>
            <td colSpan={3} style={{ textAlign: 'right', fontSize: '10px', fontFamily: 'monospace' }}>
              <p>anyPress <b style={{ color: 'green' }}>{this._anyPress}</b></p>
            </td>
            <td>
              <SignalPort value={this._anyPress} output />
            </td>
          </tr>
          <tr>
            <td colSpan={3} style={{ textAlign: 'right', fontSize: '10px', fontFamily: 'monospace' }}>
              <p>lastIndex <b style={{ color: 'green' }}>{this._lastIndex}</b></p>
            </td>
            <td>
              <SignalPort value={this._lastIndex} output />
            </td>
          </tr>
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