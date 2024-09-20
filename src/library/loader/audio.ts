import { TypeValue, t } from "@vicimpa/data-pack";

const moduleDTO = t.obj({
  default: t.str()
});

export function audioLoader(glob: Record<string, () => Promise<unknown>>) {
  return Object.entries(glob)
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
    }, {} as { [key: string]: (ctx: AudioContext) => Promise<AudioBuffer>; });
}