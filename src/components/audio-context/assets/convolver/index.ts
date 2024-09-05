import { TypeValue } from "$library/datapack/lib/defineType";
import { t } from "$library/datapack";

const moduleDTO = t.obj({
  default: t.str()
});

export default (
  Object.entries(import.meta.glob("./*.ogg"))
    .reduce((acc, [key, value]) => {
      var result: Promise<AudioBuffer>;

      async function load(ctx: AudioContext) {
        const _module = await value();
        if (!moduleDTO.equal(_module)) {
          throw new Error('Error');
        }
        const module = _module as TypeValue<typeof moduleDTO>;
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
