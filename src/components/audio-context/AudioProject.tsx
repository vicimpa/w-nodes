import { NodeProject, TExportPurpose } from "$components/node-editor";
import { TMedia, TProjectData } from "$components/node-editor/node-project/utils/projectCodec";
import { collectMediaRefs, getMedia, hashBytes, putMedia } from "$library/media";

import { ReactNode } from "react";
import base64 from "$library/base64";
import _nodes from "./_nodes";
import _ports from "./_ports";
import { legacyNodeIds } from "./legacyNodeIds";
import { provide } from "@vicimpa/react-decorators";

// Сколько байт медиа можно вшить в проект; автосохранение хранит только ссылки — файлы уже в IndexedDB
const embedLimit: Record<TExportPurpose, number> = {
  autosave: 0,
  link: 256 * 1024,
  clipboard: 4 * 1024 ** 2,
  file: Infinity,
};

@provide()
export class AudioProject extends NodeProject {
  nodes = _nodes;
  ports = _ports;
  legacyNodes = legacyNodeIds;

  // Вшивает медиа, на которые ссылается проект; skipped — файлы, не влезшие в лимит
  async exportMedia(data: TProjectData, purpose: TExportPurpose) {
    const media: TMedia[] = [];
    const skipped: string[] = [];
    var total = 0;

    for (const hash of collectMediaRefs(data.configs)) {
      const record = await getMedia(hash);

      if (!record)
        continue;

      if (total + record.size > embedLimit[purpose]) {
        if (purpose !== 'autosave')
          skipped.push(record.name);
        continue;
      }

      total += record.size;
      media.push({ hash, name: record.name, mime: record.mime, data: base64.fromBuffer(record.data) });
    }

    return { data: { ...data, media }, skipped };
  }

  async exportData(data: TProjectData, purpose: TExportPurpose) {
    return (await this.exportMedia(data, purpose)).data;
  }

  async importData(data: TProjectData) {
    for (const { hash, name, mime, data: bytes } of data.media ?? []) {
      if (typeof bytes !== 'string' || typeof hash !== 'string')
        continue;

      var buffer: ArrayBuffer;

      try {
        buffer = base64.toBuffer(bytes);
      } catch {
        continue;
      }

      if (await hashBytes(buffer) !== hash) {
        console.warn(`Media "${name}" does not match its hash, skipped`);
        continue;
      }

      if (!await getMedia(hash))
        await putMedia({ hash, name: `${name}`, mime: `${mime}`, size: buffer.byteLength, data: buffer });
    }

    return data;
  }

  render(): ReactNode {
    return (
      super.render()
    );
  }
}
