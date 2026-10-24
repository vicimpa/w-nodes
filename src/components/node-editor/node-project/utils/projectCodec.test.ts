import { describe, expect, it } from "vitest";
import { decodeProject, encodeProject } from "./projectCodec";

import { legacyNodeIds } from "$components/audio-context/legacyNodeIds";

const demos = import.meta.glob<string>('/components/audio-context/examples/*.txt', { query: '?raw', import: 'default', eager: true });
const nodeSources = import.meta.glob<string>('/components/audio-context/nodes/*.tsx', { query: '?raw', import: 'default', eager: true });
// Старые демо хранятся в v0, новые — сразу в v1
const legacyDemos = Object.values(demos).filter(text => !text.trim().startsWith('wn1:'));

describe('projectCodec', () => {
  it('reads v0 demos with node types resolved to ids', async () => {
    expect(legacyDemos.length).toBeGreaterThan(0);

    for (const text of legacyDemos) {
      const data = await decodeProject(text, legacyNodeIds);

      expect(data.media).toEqual([]);
      for (const id of data.nodes)
        expect(legacyNodeIds).toContain(id);
    }
  });

  it('round-trips demos through v1', async () => {
    for (const text of Object.values(demos)) {
      const v0 = await decodeProject(text, legacyNodeIds);
      const encoded = await encodeProject(v0);

      expect(encoded.startsWith('wn1:')).toBe(true);
      expect(await decodeProject(encoded)).toEqual(v0);
    }
  });

  it('keeps media bytes', async () => {
    const data = {
      nodes: ['Note'],
      connect: [],
      configs: [{ x: 0, y: 0 }],
      media: [{ hash: 'abc', name: 'kick.wav', mime: 'audio/wav', data: 'AAF/gP8=' }],
    };

    expect(await decodeProject(await encodeProject(data))).toEqual(data);
  });

  it('rejects unknown legacy indices', async () => {
    const [text] = legacyDemos;
    await expect(decodeProject(text, [])).rejects.toThrow(/Unknown legacy node index/);
  });
});

describe('legacyNodeIds', () => {
  it('match the @name of an existing node class', () => {
    const names = Object.values(nodeSources)
      .flatMap(source => [...source.matchAll(/@name\('([^']+)'\)/g)].map(match => match[1]));

    for (const id of legacyNodeIds)
      expect(names).toContain(id);
  });
});
