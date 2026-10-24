import { describe, expect, it } from "vitest";

import { decodeProject } from "$components/node-editor/node-project/utils/projectCodec";
import { legacyNodeIds } from "../legacyNodeIds";

const files = import.meta.glob<string>('./*.txt', { query: '?raw', import: 'default', eager: true });
const sources = import.meta.glob<string>(['../nodes/*.tsx', '../blocks/*.tsx'], { query: '?raw', import: 'default', eager: true });

const decode = (text: string) => decodeProject(text, legacyNodeIds);

const keysOf = (config: unknown) => (
  config instanceof Map ? [...config.keys()] : Object.keys(config ?? {})
);

// Поля @store каждого класса ноды по её @name: что демо может сохранить
const storedFields = (() => {
  const fields: Record<string, Set<string>> = {};

  for (const source of Object.values(sources)) {
    for (const part of source.split(/(?=@name\(')/).slice(1)) {
      const name = /^@name\('([^']+)'\)/.exec(part)![1];
      const keys = [...part.matchAll(/@store\s+(?:@\w+\s+)*(?:get\s+)?([\w$]+)/g)].map(match => match[1]);
      fields[name] = new Set(['x', 'y', ...keys]);
    }
  }

  return fields;
})();

describe('demo projects', () => {
  it('are present', () => {
    expect(Object.keys(files).length).toBeGreaterThan(0);
  });

  for (const [path, text] of Object.entries(files)) {
    it(`${path} decodes into a consistent graph`, async () => {
      const { nodes, connect, configs } = await decode(text);

      expect(configs).toHaveLength(nodes.length);

      for (const [[from], [to]] of connect) {
        expect(from).toBeLessThan(nodes.length);
        expect(to).toBeLessThan(nodes.length);
      }

      nodes.forEach((type, i) => {
        expect(storedFields[type], `node type ${type}`).toBeDefined();
        expect(keysOf(configs[i])).toEqual(expect.arrayContaining(['x', 'y']));

        for (const key of keysOf(configs[i]))
          expect(storedFields[type].has(key), `${type}.${key}`).toBe(true);
      });
    });
  }

  it('keep the stored fields that node classes rely on', async () => {
    const usage: Record<string, Set<string>> = {};

    for (const text of Object.values(files)) {
      const { nodes, configs } = await decode(text);

      nodes.forEach((type, i) => {
        const set = usage[type] ??= new Set();
        keysOf(configs[i]).forEach(key => set.add(key));
      });
    }

    const sorted = Object.fromEntries(
      Object.entries(usage)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([type, keys]) => [type, [...keys].sort()])
    );

    expect(sorted).toMatchSnapshot();
  });
});
