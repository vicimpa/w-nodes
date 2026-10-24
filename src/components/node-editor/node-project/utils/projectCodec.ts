import { makeDataPack, t } from "@vicimpa/data-pack";

import base64 from "$library/base64";
import { copyPack } from "./copyPack";
import gzip from "$library/gzip";

export type TLink = [from: [node: number, port: number], to: [node: number, port: number]];

export type TMedia = {
  hash: string;
  name: string;
  mime: string;
  // base64: строка заметно дешевле массива чисел на больших файлах
  data: string;
};

export type TProjectData = {
  nodes: string[];
  connect: TLink[];
  configs: Record<string, any>[];
  media: TMedia[];
};

const prefix = 'wn1:';

const projectPack = makeDataPack(
  t.obj({
    nodes: t.array(t.str()),
    connect: t.array(
      t.tuple(
        t.tuple(t.uint(), t.uint()),
        t.tuple(t.uint(), t.uint()),
      )
    ),
    configs: t.array(t.map()),
    media: t.array(
      t.obj({
        hash: t.str(),
        name: t.str(),
        mime: t.str(),
        data: t.str(),
      })
    ),
  })
);

export async function encodeProject(data: TProjectData) {
  return prefix + base64.fromBuffer(await gzip.encode(projectPack.write(data)));
}

// v1 — "wn1:" + base64(gzip(pack)), типы нод по строковому id.
// v0 — base64(gzip(pack)) без префикса, типы нод по индексу в legacyNodes.
export async function decodeProject(text: string, legacyNodes: readonly string[] = []): Promise<TProjectData> {
  text = text.trim();

  if (text.startsWith(prefix))
    return projectPack.read(await gzip.decode(base64.toBuffer(text.slice(prefix.length))));

  const { nodes, connect, configs } = copyPack.read(await gzip.decode(base64.toBuffer(text)));

  return {
    nodes: nodes.map(index => {
      if (!(index in legacyNodes))
        throw new Error(`Unknown legacy node index ${index}`);

      return legacyNodes[index];
    }),
    connect,
    configs,
    media: [],
  };
}
