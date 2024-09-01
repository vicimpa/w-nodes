import { Type as t } from "@sinclair/typebox";
import { Value as v } from "@sinclair/typebox/value";

const moduleDTO = t.Object({
  default: t.String()
});

export default (
  Object.entries(import.meta.glob("./*.ogg"))
    .reduce((acc, [key, value]) => {
      var result: Promise<AudioBuffer>;

      async function load(ctx: AudioContext) {
        const _module = await value();
        const module = v.Parse(moduleDTO, _module);
        const response = await fetch(module.default);
        return ctx.decodeAudioData(await response.arrayBuffer());
      }

      acc[key] = function (ctx) {
        if (result)
          return result;
        return result = load(ctx);
      };

      return acc;
    }, {} as { [key: string]: (ctx: AudioContext) => Promise<AudioBuffer>; })
);
