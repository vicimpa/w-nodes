import { ExprNode, ExpressionError } from "./ast";
import { Scope, expressionScope, helpers } from "./scope";

const literal = (value: number, pos: number) => {
  if (typeof value !== 'number' || Number.isNaN(value) || value < 0)
    throw new ExpressionError('Invalid number literal', pos);

  // 1e999 → Infinity; String() даёт только цифры, '.', 'e', '+', '-'
  return Number.isFinite(value) ? String(value) : 'Infinity';
};

const comparison = new Set(['<', '<=', '>', '>=', '==', '!=']);
const arithmetic = new Set(['+', '-', '*', '/', '%', '**', '&&', '||']);

// Каждый узел оборачивается в скобки, поэтому приоритеты JS не важны
export const generate = (node: ExprNode, scope: Scope = expressionScope): string => {
  switch (node.type) {
    case 'number':
      return literal(node.value, node.pos);

    case 'variable': {
      const local = scope.variables.get(node.name);
      if (local === undefined)
        throw new ExpressionError(`Unknown identifier '${node.name}'`, node.pos);
      return local;
    }

    case 'constant': {
      const value = scope.constants.get(node.name);
      if (value === undefined)
        throw new ExpressionError(`Unknown identifier '${node.name}'`, node.pos);
      return literal(value, node.pos);
    }

    case 'unary': {
      const arg = generate(node.arg, scope);
      if (node.op === '-') return `(-${arg})`;
      if (node.op === '!') return `(+!${arg})`;
      break;
    }

    case 'binary': {
      const left = generate(node.left, scope);
      const right = generate(node.right, scope);

      if (comparison.has(node.op)) {
        const op = node.op === '==' ? '===' : node.op === '!=' ? '!==' : node.op;
        return `(+(${left} ${op} ${right}))`;
      }

      if (arithmetic.has(node.op))
        return `(${left} ${node.op} ${right})`;

      break;
    }

    case 'conditional':
      return `(${generate(node.test, scope)} ? ${generate(node.then, scope)} : ${generate(node.else, scope)})`;

    case 'call': {
      const func = scope.functions.get(node.name);

      if (!func)
        throw new ExpressionError(`Unknown function '${node.name}'`, node.pos);

      if (node.args.length < func.min || node.args.length > func.max)
        throw new ExpressionError(`Wrong number of arguments for ${node.name}()`, node.pos);

      return func.emit(node.args.map(arg => generate(arg, scope)));
    }
  }

  throw new ExpressionError('Unsupported expression', (node as ExprNode).pos ?? 0);
};

// Параметры ядра: входы a–d, время, частота дискретизации и прошлый выходной сэмпл
export const KERNEL_PARAMS = ['a', 'b', 'c', 'd', 't', 'sr', 'y1'] as const;

// JS-выражение, которое вычисляется в функцию (a, b, c, d, t, sr, y1) => number
export const buildKernel = (code: string) => [
  '(function () {',
  '"use strict";',
  helpers,
  `return function (${KERNEL_PARAMS.join(', ')}) {`,
  `return ${code};`,
  '};',
  '})()',
].join('\n');
