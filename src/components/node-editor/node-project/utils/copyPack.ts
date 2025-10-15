import { makeDataPack, t } from "@vicimpa/data-pack";

export const copyPack = makeDataPack(
  t.obj({
    nodes: t.array(t.uint()),
    connect: t.array(
      t.tuple(
        t.tuple(t.uint(), t.uint()),
        t.tuple(t.uint(), t.uint()),
      )
    ),
    configs: t.array(t.map())
  })
);