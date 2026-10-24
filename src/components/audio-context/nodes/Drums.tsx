import { CSSProperties, Component, ReactNode } from "react";
import { batch, computed, effect, signal, untracked } from "@preact/signals-react";
import { prop, reactive } from "@vicimpa/decorators";

import { AudioPort } from "../ports/AudioPort";
import { BaseNode } from "../lib/BaseNode";
import ImpulseProcessor from "../worklet/ImpulseProcessor";
import { Select } from "../lib/Select";
import { SignalNode } from "../lib/signalNode";
import { SignalPort } from "../ports/SignalPort";
import { connect } from "@vicimpa/react-decorators";
import { ctx } from "../ctx";
import { dispose } from "$library/dispose";
import drums from "../assets/drums";
import { decodeMedia, mediaList, mediaRef, parseMediaRef } from "$library/media";
import { group, icon } from "../_groups";
import { Drum } from "lucide-react";
import { name } from "$library/function";
import { pipe } from "../lib/pipe";
import rsp from "@vicimpa/rsp";
import { store } from "$components/node-editor";

const drumsNames = Object.keys(drums);
const drumsVariants: { group: string, label: string, value: number | string; }[] = [
  {
    group: '',
    label: 'No Select',
    value: -1
  },
  ...drumsNames.map((name, index) => {
    name = name.split('/').at(-1) ?? '';
    name = name.replace(/\.mp3$/g, '');

    return {
      group: name.split(/\s+/)[0] ?? 'unknow',
      label: name,
      value: index
    };
  })
];

@connect(_ctx => (
  _ctx._gain.gain.value = 100,
  dispose(
    pipe(_ctx.input, _ctx._impulse.value),
    pipe(_ctx._impulse, _ctx._gain),
    pipe(_ctx._gain, _ctx._src),
    effect(() => {
      const drums = untracked(() => _ctx.main.drums);
      if (typeof drums[_ctx.id] === 'undefined')
        return;

      untracked(() => _ctx.main.drums)[_ctx.id] = _ctx.value.value;
    }),
    effect(() => {
      _ctx.value.value = _ctx.main.drums[_ctx.id];
    }),
    effect(() => {
      const { value } = _ctx.value;
      const hash = parseMediaRef(value);
      var cancelled = false;

      _ctx._src.buffer = null;

      // Свой файл (local:<hash>) ждёт появления в медиатеке; число — встроенный сэмпл
      const load = hash ? (
        mediaList.value.some(item => item.hash === hash) ? decodeMedia(hash, ctx) : null
      ) : drums[drumsNames[value as number]]?.(ctx);

      load?.then(buff => {
        if (!cancelled)
          _ctx._src.buffer = buff;
      }).catch(console.error);

      return () => {
        cancelled = true;
      };
    }),
    () => _ctx._impulse.destroy()
  )
))
class DrumsItem extends Component<{ id: number; ctx: Drums; }> {
  id = this.props.id;
  main = this.props.ctx;
  input = new SignalNode(0, { min: 0, max: 1, default: 0 });
  value = signal(this.main.drums[this.id]);

  _impulse = new ImpulseProcessor();
  _gain = ctx.createGain();
  _src = ctx.createConvolver();

  style = computed<CSSProperties>(() => ({
    padding: 5,
    width: '100%',
    background: this.input.value ? 'color-mix(in srgb, var(--accent) 35%, transparent)' : 'var(--bg-field)'
  }));

  delete() {
    batch(() => {
      this.main.drums = this.main.drums.toSpliced(this.id, 1);
    });
  }

  render(): ReactNode {
    const { style, input, value } = this;
    const { id } = this.props;

    this.id = id;

    return (
      <tr>
        <td>
          <SignalPort value={input} />
        </td>
        <rsp.td style={style}>
          {computed(() => (
            <Select
              key={mediaList.value.length}
              label="Type"
              value={value}
              variants={[
                ...drumsVariants,
                ...mediaList.value.map(item => ({ group: 'My files', label: item.name, value: mediaRef(item.hash) as number | string })),
              ]}
              groupBy={e => e.group}
            />
          ))}
        </rsp.td>
        <td>
          <button onClick={() => this.delete()}>Delete</button>
        </td>
        <td>
          <AudioPort value={this._src} output />
        </td>
      </tr>
    );
  }
};

@name('Drums')
@group('sequence')
@icon(Drum)
@reactive()
export default class Drums extends BaseNode {
  // Номер встроенного сэмпла или ссылка local:<hash> на файл из медиатеки
  @prop @store drums: Array<number | string> = [-1];

  append() {
    batch(() => {
      this.drums = [...this.drums, -1];
    });
  }

  _view = () => (
    <>
      <table style={{ width: 350 }}>
        <tbody>
          {
            computed(() => this.drums.map((_, i) => (
              <DrumsItem key={i} id={i} ctx={this} />
            )))
          }
        </tbody>
      </table>
      <button onClick={() => this.append()}>Add</button>
    </>
  );
}