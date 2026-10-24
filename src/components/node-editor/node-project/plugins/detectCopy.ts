import { NodeProject, TConnect } from "../NodeProject";
import { NodePort } from "../../node-port";
import { TProjectData, encodeProject } from "../utils/projectCodec";

import { Vec2 } from "@vicimpa/lib-vec2";
import { dispose } from "$library/dispose";
import { isFocused } from "../../node-map";
import { windowEvents } from "@vicimpa/events";

type TClip = {
  text: string;
  data: TProjectData;
  external: TConnect[];
  lines: NodeProject['lines'];
};

// Последнее скопированное в этой вкладке: при вставке той же строки
// восстанавливаем ещё и связи с нодами вне выделения.
var clip: TClip | null = null;

// Связи с нодами вне выделения: только с живыми портами этого же редактора
const liveExternal = (ctx: NodeProject, external: TConnect[]) => (
  external.filter(([, port]) => (
    port instanceof NodePort && port.lines === ctx.lines && !!port.port.value?.isConnected
  ))
);

const offset = (data: TProjectData, delta: number) => {
  for (const config of data.configs) {
    if ('x' in config && 'y' in config)
      new Vec2(config as Vec2).plus(delta).toObject(config as Vec2);
  }

  return data;
};

const hotkey = (ctx: NodeProject, code: string, callback: (e: KeyboardEvent) => unknown) => (
  windowEvents('keydown', e => {
    if (!(e.metaKey || e.ctrlKey) || e.code !== code || !isFocused(ctx.map))
      return;

    e.preventDefault();
    Promise.resolve(callback(e)).catch(console.error);
  })
);

export default (ctx: NodeProject) => {
  const copy = async (e: KeyboardEvent) => {
    const { data, external } = ctx.serialize([...ctx.selection.select]);
    const text = await encodeProject(await ctx.exportData(offset(data, 10), 'clipboard'));

    clip = { text, data, external: e.shiftKey ? [] : external, lines: ctx.lines };
    await navigator.clipboard.writeText(text);
  };

  return dispose(
    hotkey(ctx, 'KeyC', copy),
    hotkey(ctx, 'KeyX', e => {
      const nodes = [...ctx.selection.select];
      const copied = copy(e);
      ctx.destroy(...nodes);
      return copied;
    }),
    hotkey(ctx, 'KeyV', async e => {
      const text = await navigator.clipboard.readText();

      if (clip && text === clip.text)
        return ctx.load(clip.data, e.shiftKey || clip.lines !== ctx.lines ? [] : liveExternal(ctx, clip.external));

      return ctx.paste(text);
    }),
    hotkey(ctx, 'KeyD', e => {
      const { data, external } = ctx.serialize([...ctx.selection.select]);
      return ctx.load(offset(data, 10), e.shiftKey ? [] : liveExternal(ctx, external));
    }),
  );
};
