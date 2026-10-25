import { CSSProperties, Component, ReactNode } from "react";
import { computed, effect } from "@preact/signals-react";
import { prop, reactive } from "@vicimpa/decorators";

import { BaseNode } from "../lib/BaseNode";
import { SignalNode } from "../lib/signalNode";
import { SignalPort } from "../ports/SignalPort";
import { connect } from "@vicimpa/react-decorators";
import { dispose } from "$library/dispose";
import { group, icon } from "../_groups";
import { Keyboard as KeyboardIcon, X } from "lucide-react";
import { name } from "$library/function";
import rsp from "@vicimpa/rsp";
import { store } from "$components/node-editor";
import { windowEvents } from "@vicimpa/events";

@connect((ctx) => (
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

      if (ctx.keyboard.keys[ctx.id] !== code)
        return;

      ctx.port.value = 1;
    }),
    windowEvents('keyup', ({ code }) => {
      if (ctx.keyboard.keys[ctx.id] !== code)
        return;

      ctx.port.value = 0;
    }),
    windowEvents('blur', () => {
      ctx.port.value = 0;
    }),
  )
))
class KeyboardItem extends Component<{ id: number; ctx: Keyboard; }> {
  keyboard = this.props.ctx;
  id = this.props.id;
  port = new SignalNode(0, { min: 0, max: 1, default: 0 });

  style = computed<CSSProperties>(() => ({
    padding: 5,
    width: '100%',
    background: this.port.value ? 'color-mix(in srgb, var(--accent) 35%, transparent)' : 'var(--bg-field)'
  }));

  delete() {
    this.keyboard.keys = this.keyboard.keys.toSpliced(this.id, 1);
  }

  render(): ReactNode {
    const { style, keyboard, port } = this;
    const { id } = this.props;

    this.id = id;

    return (
      <tr>
        <td>
          {id + 1}
        </td>
        <rsp.td style={style}>
          Key: "{computed(() => keyboard.keys[id] ?? 'press to set')}"
        </rsp.td>
        <td>
          <rsp.button
            onClick={() => keyboard.keys = keyboard.keys.toSpliced(id, 1, null)}
            disabled={computed(() => !keyboard.keys[id])}>
            Change
          </rsp.button>
        </td>
        <td>
          <button
            title="Delete"
            onClick={() => this.delete()}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <X size={14} />
          </button>
        </td>
        {/* У порта отрицательный отступ: без паддинга он заезжает на кнопку */}
        <td style={{ paddingLeft: 'var(--pad)' }}>
          <SignalPort value={port} output />
        </td>
      </tr>
    );
  }
}


@name('Keyboard')
@group('control')
@icon(KeyboardIcon)
@connect((ctx) => (
  effect(() => {
    const { activeItems } = ctx;

    for (var item of ctx.items) {
      if (item.port.value && !activeItems.has(item))
        activeItems.add(item);
      if (!item.port.value && activeItems.has(item))
        activeItems.delete(item);
    }

    ctx._activeKey.value = ([...activeItems].at(-1)?.id ?? -1) + 1;
  })
))
@reactive()
export default class Keyboard extends BaseNode {
  @prop @store keys: Array<string | null> = [null];

  id = 0;

  @prop items: KeyboardItem[] = [];
  activeItems = new Set<KeyboardItem>();

  _activeKey = new SignalNode(0, { min: 0, default: 0 });

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
      <table style={{ width: 350 }}>
        <tbody>
          <tr>
            <td colSpan={4} style={{ textAlign: 'right', color: 'var(--text-muted)' }}>
              <p>Last key <b style={{ color: 'var(--accent)' }}>{this._activeKey}</b></p>
            </td>
            <td style={{ paddingLeft: 'var(--pad)' }}>
              <SignalPort value={this._activeKey} output />
            </td>
          </tr>
          {
            computed(() => this.keys.map((_, i) => (
              <KeyboardItem key={i} id={i} ctx={this} />
            )))
          }
        </tbody>
      </table>
      <button onClick={() => this.keys = [...this.keys, null]}>Add</button>
    </>
  );
}