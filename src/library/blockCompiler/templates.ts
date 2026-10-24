import { compile, expressionScope } from "$library/expression";

import { constantCode } from "$library/constants";
import { lfoShapes } from "$library/modulation";
import { math } from "$library/math";

export type TConfig = Record<string, unknown> | Map<string, unknown> | null | undefined;

// Порты ноды в порядке sortPorts: сначала входы, потом выходы.
// Вход — ключ @store с SignalNode (его значение берётся, пока к входу нет провода) или null (аудиовход без значения).
export type TPorts = {
  inputs: (string | null)[];
  outputs: number;
};

export type TEmitContext = {
  // JS-выражения входов: уже вычисленные локальные переменные
  inputs: string[];
  config: TConfig;
  // Поле состояния экземпляра: объявляет его с начальным значением, возвращает обращение к нему
  state(name: string, init: string): string;
  // Уникальное имя локальной переменной для этой ноды
  local(name: string): string;
  // Какие общие куски кода нужны: таблица Math, функции модуляции, помощники Expression, время t
  use(feature: TFeature): void;
};

export type TFeature = 'math' | 'modulation' | 'expression' | 'time';

export type TEmitted = {
  code: string[];
  out: string;
};

export type TTemplate = {
  ports(config: TConfig): TPorts | string;
  // Ключи @store, от которых зависит сгенерированный код (их смена требует перекомпиляции)
  structural: string[];
  // Особые ноды: вход и выход блока
  role?: 'input' | 'output';
  emit?(ctx: TEmitContext): TEmitted | string;
};

export class CompileError extends Error { }

export const configValue = (config: TConfig, key: string): unknown => {
  if (config instanceof Map)
    return config.get(key);

  if (config && typeof config === 'object' && Object.hasOwn(config, key))
    return config[key];

  return undefined;
};

// Слот блока: непустая строка. Сам id в код не попадает, только в списки входов/выходов.
export const slotOf = (config: TConfig) => {
  const slot = configValue(config, 'slot');
  return typeof slot === 'string' && slot ? slot : null;
};

const mathInputs = ['_a', '_b', '_c', '_d', '_e'];
const identifier = /^[A-Za-z_][A-Za-z0-9_]*$/;

// Операция Math из конфига, только если она есть в таблице
export const mathOperation = (config: TConfig) => {
  const op = configValue(config, '_p');
  return typeof op === 'string' && Object.hasOwn(math, op) && identifier.test(op) ? op as keyof typeof math : null;
};

const simple = (inputs: string[]): TTemplate['ports'] => () => ({ inputs, outputs: 1 });

const passthrough: TTemplate['emit'] = ({ inputs }) => ({ code: [], out: inputs[0] });

export const templates: Record<string, TTemplate> = {
  GroupInput: {
    role: 'input',
    structural: ['slot'],
    ports: config => slotOf(config) ? { inputs: [], outputs: 1 } : { inputs: [], outputs: 0 },
  },

  GroupOutput: {
    role: 'output',
    structural: ['slot'],
    ports: config => slotOf(config) ? { inputs: [null], outputs: 0 } : { inputs: [], outputs: 0 },
  },

  Math: {
    structural: ['_p'],
    ports(config) {
      const op = mathOperation(config);

      if (!op)
        return 'Math has an unknown operation';

      return { inputs: mathInputs.slice(0, math[op].length), outputs: 1 };
    },
    emit({ inputs, config, use }) {
      const op = mathOperation(config);

      if (!op)
        return 'Math has an unknown operation';

      use('math');
      return { code: [], out: `$m.${op}(${inputs.join(', ')})` };
    },
  },

  Expression: {
    structural: ['expression'],
    ports: simple(['_a', '_b', '_c', '_d']),
    emit({ inputs, config, state, local, use }) {
      const source = configValue(config, 'expression');
      const names = ['a', 'b', 'c', 'd'];
      const y1 = state('y1', '0');
      const variables = new Map(expressionScope.variables);

      names.forEach((name, i) => variables.set(name, inputs[i]));
      variables.set('y1', y1);

      // Формула проходит только через парсер и генератор library/expression
      const result = compile(typeof source === 'string' ? source : '', {
        scope: { ...expressionScope, variables },
      });

      if (!result.ok)
        return `Expression: ${result.error}`;

      use('expression');
      use('time');

      const y = local('y');

      return {
        code: [
          `let ${y} = ${result.code};`,
          // Как в процессоре Expression: NaN и бесконечность — в 0
          `if (!Number.isFinite(${y})) ${y} = 0;`,
          `${y1} = ${y};`,
        ],
        out: y,
      };
    },
  },

  Memory: {
    structural: [],
    ports: simple(['_value', '_write']),
    emit({ inputs: [value, write], state }) {
      const mem = state('mem', '0');

      // У параметра write minValue = 0: отрицательное значение не пишет
      return { code: [`if (${write} > 0) ${mem} = F(${value});`], out: mem };
    },
  },

  Slider: {
    structural: [],
    ports: simple(['_value']),
    emit: passthrough,
  },

  Constant: {
    structural: ['_constant', '_number'],
    ports: () => ({ inputs: [], outputs: 1 }),
    emit({ config }) {
      const code = constantCode(configValue(config, '_constant'), configValue(config, '_number'));
      return code ? { code: [], out: code } : 'Constant has an unknown value';
    },
  },

  Toggle: {
    structural: [],
    ports: simple(['_toggle']),
    emit: passthrough,
  },

  LFO: {
    structural: ['_shape'],
    ports: simple(['_rate', '_depth', '_offset', '_phase', '_sync']),
    emit({ inputs: [rate, depth, offset, phase, sync], config, state, local, use }) {
      const value = configValue(config, '_shape');
      // В код идёт строка из нашего списка, не из конфига; неизвестная форма — синус, как в процессоре
      const shape = lfoShapes.find(item => item === value) ?? 'sine';
      const p = state('phase', '0');
      const s = state('sync', '0');
      const held = state('held', 'Math.random() * 2 - 1');
      const inc = local('inc');
      const out = local('out');

      use('modulation');

      return {
        code: [
          `if ($f.rising(${s}, ${sync})) { ${p} = 0; ${held} = Math.random() * 2 - 1; }`,
          `${s} = ${sync};`,
          `const ${out} = ${offset} + ${depth} * $f.lfoShape(${JSON.stringify(shape)}, ${p} + ${phase}, ${held});`,
          `const ${inc} = ${rate} / sr;`,
          `if ($f.lfoWrapped(${p}, ${inc}, ${phase})) ${held} = Math.random() * 2 - 1;`,
          `${p} = $f.wrap(${p} + ${inc});`,
        ],
        out,
      };
    },
  },

  ADSR: {
    structural: [],
    ports: simple(['_gate', '_attack', '_decay', '_sustain', '_release', '_peak']),
    emit({ inputs, state, use }) {
      const env = state('env', '{ gate: 0, stage: 0, level: 0, from: 0 }');

      use('modulation');
      return { code: [], out: `$f.adsrStep(${env}, ${inputs.join(', ')}, 1 / sr)` };
    },
  },

  Counter: {
    structural: [],
    ports: simple(['_trigger', '_step', '_reset', '_modulo']),
    emit({ inputs: [trigger, step, reset, modulo], state, use }) {
      const t = state('trigger', '0');
      const r = state('reset', '0');
      const count = state('count', '0');

      use('modulation');

      return {
        code: [
          // Сброс важнее счёта на том же сэмпле
          `if ($f.rising(${r}, ${reset})) ${count} = 0;`,
          `else if ($f.rising(${t}, ${trigger})) ${count} = $f.counterStep(${count}, ${step}, ${modulo});`,
          `${t} = ${trigger};`,
          `${r} = ${reset};`,
        ],
        out: count,
      };
    },
  },

  Random: {
    structural: [],
    ports: simple(['_trigger', '_from', '_to', '_step']),
    emit({ inputs: [trigger, from, to, step], state, use }) {
      const t = state('trigger', '0');
      const value = state('value', '0');
      const fired = state('fired', 'false');

      use('modulation');

      return {
        code: [
          `if ($f.rising(${t}, ${trigger})) { ${value} = $f.randomIn(Math.random(), ${from}, ${to}, ${step}); ${fired} = true; }`,
          `${t} = ${trigger};`,
        ],
        out: `(${fired} ? ${value} : ${from})`,
      };
    },
  },
};

export const isCompilable = (type: string) => Object.hasOwn(templates, type);
