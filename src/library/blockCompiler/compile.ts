import { TConfig, TFeature, TPorts, configValue, mathOperation, slotOf, templates } from "./templates";

import { helpers } from "$library/expression";
import { math } from "$library/math";
import { modulation } from "$library/modulation";

export type TLink = [from: [node: number, port: number], to: [node: number, port: number]];

export type TGraph = {
  nodes: string[];
  connect: TLink[];
  configs: TConfig[];
};

// Живой параметр: SignalNode `key` ноды `node` подаётся в параметр процессора `k<index>`
export type TParam = { node: number; key: string; };

export type TCompiled = {
  ok: true;
  // JS-выражение: фабрика (sr) => (ins, outs, ps, n, frame) => void
  source: string;
  // Слоты входов и выходов блока в порядке входов и выходов процессора
  inputs: string[];
  outputs: string[];
  params: TParam[];
  // Вход, соединённый прямо с выходом: идёт мимо процессора, сохраняя стерео
  passthrough: [input: string, output: string][];
  // Ноды, которые читают прошлый сэмпл другой ноды (разрыв петли)
  delayed: number[];
};

export type TCompileResult = TCompiled | { ok: false; reason: string; };

export const MAX_NODES = 1000;

const fail = (reason: string): TCompileResult => ({ ok: false, reason });

// Исходник функции из таблицы для объектного литерала: метод `name(…) {…}` или `"name": функция`
const member = (name: string, func: Function) => {
  const code = func.toString();
  const method = code.startsWith(name) && /^\s*\(/.test(code.slice(name.length));
  return method ? code : `${JSON.stringify(name)}: ${code}`;
};

const table = (entries: [string, Function][]) => (
  `{\n${entries.map(([name, func]) => `  ${member(name, func)}`).join(',\n')}\n}`
);

type TWire = { from: number; delayed: boolean; };

export const compileBlock = (graph: TGraph): TCompileResult => {
  const { nodes, configs } = graph;

  if (!Array.isArray(nodes) || !Array.isArray(graph.connect))
    return fail('Block graph is broken');

  if (nodes.length > MAX_NODES)
    return fail('Block is too large to compile');

  // 1. Порты каждой ноды
  const ports: TPorts[] = [];

  for (let i = 0; i < nodes.length; i++) {
    const type = nodes[i];
    const template = typeof type === 'string' && Object.hasOwn(templates, type) ? templates[type] : null;

    if (!template)
      return fail(`${typeof type === 'string' ? type : 'Node'} is not compilable`);

    const result = template.ports(configs[i]);

    if (typeof result === 'string')
      return fail(result);

    ports.push(result);
  }

  // 2. Провода: у каждой пары один конец — выход, другой — вход
  const wires: TWire[][][] = ports.map(p => p.inputs.map(() => []));
  const seen = new Set<string>();

  const role = ([node, port]: [number, number]) => {
    const p = Number.isInteger(node) && node >= 0 ? ports[node] : undefined;

    if (!p || !Number.isInteger(port) || port < 0)
      return null;

    if (port < p.inputs.length)
      return { node, input: port };

    if (port < p.inputs.length + p.outputs)
      return { node, input: -1 };

    return null;
  };

  for (const link of graph.connect) {
    const a = Array.isArray(link) && Array.isArray(link[0]) ? role(link[0]) : null;
    const b = Array.isArray(link) && Array.isArray(link[1]) ? role(link[1]) : null;

    if (!a || !b || (a.input === -1) === (b.input === -1))
      return fail('Block has an unexpected link');

    const [from, to] = a.input === -1 ? [a, b] : [b, a];
    const key = `${from.node}>${to.node}:${to.input}`;

    // Повторная связь той же пары в Web Audio ничего не добавляет
    if (seen.has(key))
      continue;

    seen.add(key);
    wires[to.node][to.input].push({ from: from.node, delayed: false });
  }

  const roleOf = (i: number) => templates[nodes[i]].role;

  // 3. Слоты
  const inputs: string[] = [];
  const outputs: string[] = [];

  nodes.forEach((_, i) => {
    const slot = slotOf(configs[i]);
    const list = roleOf(i) === 'input' ? inputs : roleOf(i) === 'output' ? outputs : null;

    if (slot && list && !list.includes(slot))
      list.push(slot);
  });

  // 4. Порядок: обход в глубину от выходов блока. Провод к ноде, которая ещё на стеке, —
  // обратная связь: он читает значение этой ноды с прошлого сэмпла.
  const mark = new Map<number, 1 | 2>();
  const order: number[] = [];
  const delayed = new Set<number>();

  const visit = (node: number) => {
    mark.set(node, 1);

    for (const list of wires[node]) {
      for (const wire of list) {
        const state = mark.get(wire.from);

        if (state === 1) {
          wire.delayed = true;
          delayed.add(wire.from);
        } else if (!state) {
          visit(wire.from);
        }
      }
    }

    mark.set(node, 2);
    order.push(node);
  };

  const passthrough: [string, string][] = [];
  const sinks = new Map<string, number[]>(outputs.map(slot => [slot, []]));

  nodes.forEach((_, i) => {
    const slot = slotOf(configs[i]);

    if (roleOf(i) !== 'output' || !slot)
      return;

    for (const wire of wires[i][0] ?? []) {
      const source = slotOf(configs[wire.from]);

      if (roleOf(wire.from) === 'input' && source) {
        if (!passthrough.some(([a, b]) => a === source && b === slot))
          passthrough.push([source, slot]);
        continue;
      }

      sinks.get(slot)!.push(wire.from);

      if (!mark.has(wire.from))
        visit(wire.from);
    }
  });

  // 5. Код
  const features = new Set<TFeature>();
  const state: string[] = [];
  const params: TParam[] = [];
  const body: string[] = [];

  const value = (wire: TWire) => wire.delayed ? `s.d${wire.from}` : `v${wire.from}`;

  const inputExpr = (node: number, index: number) => {
    const list = wires[node][index];

    if (list.length === 1)
      return value(list[0]);

    if (list.length > 1)
      return `F(${list.map(value).join(' + ')})`;

    const key = ports[node].inputs[index];

    if (key === null)
      return '0';

    // Без провода — значение из ноды, живым параметром процессора
    params.push({ node, key });
    return `q${params.length - 1}[i * m${params.length - 1}]`;
  };

  for (const node of order) {
    const type = nodes[node];
    const template = templates[type];

    if (template.role === 'input') {
      body.push(`const v${node} = x${inputs.indexOf(slotOf(configs[node])!)}[i];`);
      continue;
    }

    if (!template.emit || ports[node].outputs !== 1)
      return fail(`${type} cannot be used here`);

    const locals = ports[node].inputs.map((_, k) => `a${node}_${k}`);

    if (locals.length)
      body.push(`const ${locals.map((name, k) => `${name} = ${inputExpr(node, k)}`).join(', ')};`);

    const emitted = template.emit({
      inputs: locals,
      config: configs[node],
      state(name, init) {
        state.push(`n${node}_${name}: ${init}`);
        return `s.n${node}_${name}`;
      },
      local: name => `${name}_${node}`,
      use: feature => features.add(feature),
    });

    if (typeof emitted === 'string')
      return fail(emitted);

    body.push(...emitted.code, `const v${node} = F(${emitted.out});`);
  }

  for (const node of delayed)
    state.push(`d${node}: 0`);

  outputs.forEach((slot, k) => {
    const terms = sinks.get(slot)!.map(from => `v${from}`);
    body.push(`o${k}[i] = ${terms.length ? terms.join(' + ') : '0'};`);
  });

  for (const node of delayed)
    body.push(`s.d${node} = v${node};`);

  // 6. Сборка
  const prelude: string[] = ['const F = Math.fround;'];

  if (features.has('math')) {
    const used = new Set<string | null>(order.filter(node => nodes[node] === 'Math').map(node => mathOperation(configs[node])));
    const entries = Object.entries(math) as [string, Function][];

    // Операции, которые зовут другие через this (remap), тянут за собой всю таблицу
    const all = entries.some(([name, func]) => used.has(name) && func.toString().includes('this.'));
    prelude.push(`const $m = ${table(entries.filter(([name]) => all || used.has(name)))};`);
  }

  if (features.has('modulation'))
    prelude.push(`const $f = ${table(Object.entries(modulation))};`);

  if (features.has('expression'))
    prelude.push(helpers);

  const source = [
    '(function () {',
    '"use strict";',
    ...prelude,
    'return function (sr) {',
    `const s = { ${state.join(', ')} };`,
    'let Z = new Float32Array(128);',
    'return function (ins, outs, ps, n, frame) {',
    'if (Z.length < n) Z = new Float32Array(n);',
    ...inputs.map((_, k) => `const x${k} = ins[${k}] || Z;`),
    ...outputs.map((_, k) => `const o${k} = outs[${k}];`),
    ...params.map((_, k) => `const q${k} = ps[${k}], m${k} = q${k}.length > 1 ? 1 : 0;`),
    'for (let i = 0; i < n; i++) {',
    ...(features.has('time') ? ['const t = (frame + i) / sr;'] : []),
    ...body,
    '}',
    '};',
    '};',
    '})()',
  ].join('\n');

  return {
    ok: true,
    source,
    inputs,
    outputs,
    params,
    passthrough,
    delayed: [...delayed],
  };
};

// Значения параметров из конфигов: на случай, если ноду не нашли. Только конечные числа.
export const paramDefaults = (graph: TGraph, params: TParam[]) => (
  params.map(({ node, key }) => {
    const value = configValue(graph.configs[node], key);
    return typeof value === 'number' && Number.isFinite(value) ? value : 0;
  })
);
