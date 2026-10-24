import { describe, expect, it } from "vitest";

import type { NodeItem } from "$components/node-editor";
import type { TGraph } from "$library/blockCompiler";

import { checkPorts } from "./ports";

// Нода-заглушка: порты в порядке sortPorts и поля @store
const fake = (ports: { output?: boolean; value?: unknown; }[], fields: Record<string, unknown> = {}) => (
  { ...fields, sortPorts: ports.map(props => ({ props })) } as unknown as NodeItem
);

const graph = (nodes: string[], configs: Record<string, unknown>[]): TGraph => ({ nodes, configs, connect: [] });

describe('checkPorts', () => {
  const a = {}, b = {};

  it('accepts nodes whose ports match the compiler port map', () => {
    const nodes = [
      fake([{ value: a }, { value: b }, { output: true }], { _a: a, _b: b }),
      fake([{ output: true }]),
    ];

    expect(checkPorts(nodes, graph(['Math', 'GroupInput'], [{ _p: 'plus' }, { slot: 'x' }]))).toBeNull();
  });

  it('rejects a different port count', () => {
    const nodes = [fake([{ value: a }, { output: true }], { _a: a, _b: b })];
    expect(checkPorts(nodes, graph(['Math'], [{ _p: 'plus' }]))).toBe('Math has unexpected ports');
  });

  it('rejects inputs bound to other fields', () => {
    const nodes = [fake([{ value: b }, { value: a }, { output: true }], { _a: a, _b: b })];
    expect(checkPorts(nodes, graph(['Math'], [{ _p: 'plus' }]))).toBe('Math has unexpected ports');
  });

  it('rejects an output where an input is expected', () => {
    const nodes = [fake([{ output: true }], {})];
    expect(checkPorts(nodes, graph(['GroupOutput'], [{ slot: 'y' }]))).toBe('GroupOutput has unexpected ports');
  });
});
