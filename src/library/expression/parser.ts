import { BinaryOperator, ExprNode, ExpressionError, depthOf } from "./ast";
import { Scope, arityText, expressionScope } from "./scope";
import { Token, tokenize } from "./tokenizer";

export const MAX_LENGTH = 512;
export const MAX_DEPTH = 100;

export type ParseOptions = {
  scope?: Scope;
  maxLength?: number;
  maxDepth?: number;
};

// Сила связывания инфиксных операторов, как в JS; '**' сильнее унарного минуса: -2**2 = -4
const binary: Record<BinaryOperator, { lbp: number; rbp: number; }> = {
  '||': { lbp: 2, rbp: 2 },
  '&&': { lbp: 3, rbp: 3 },
  '==': { lbp: 4, rbp: 4 },
  '!=': { lbp: 4, rbp: 4 },
  '<': { lbp: 5, rbp: 5 },
  '<=': { lbp: 5, rbp: 5 },
  '>': { lbp: 5, rbp: 5 },
  '>=': { lbp: 5, rbp: 5 },
  '+': { lbp: 6, rbp: 6 },
  '-': { lbp: 6, rbp: 6 },
  '*': { lbp: 7, rbp: 7 },
  '/': { lbp: 7, rbp: 7 },
  '%': { lbp: 7, rbp: 7 },
  '**': { lbp: 9, rbp: 8 },
};

const TERNARY_BP = 1;
const UNARY_BP = 8;

const isBinary = (text: string): text is BinaryOperator => Object.hasOwn(binary, text);

const describe = (token: Token) => (
  token.type === 'eof' ? 'end of expression' : `'${token.text}'`
);

class Parser {
  #index = 0;
  #depth = 0;
  #tokens: Token[];
  scope: Scope;
  maxDepth: number;

  constructor(tokens: Token[], scope: Scope, maxDepth: number) {
    this.#tokens = tokens;
    this.scope = scope;
    this.maxDepth = maxDepth;
  }

  peek() {
    return this.#tokens[this.#index];
  }

  next() {
    return this.#tokens[this.#index++];
  }

  isOp(text: string) {
    return this.peek().type === 'op' && this.peek().text === text;
  }

  expect(text: string) {
    if (!this.isOp(text))
      throw new ExpressionError(`Expected '${text}' but found ${describe(this.peek())}`, this.peek().pos);

    return this.next();
  }

  parseProgram() {
    if (this.peek().type === 'eof')
      throw new ExpressionError('Expression is empty', 0);

    const node = this.parseExpression(0);

    if (this.peek().type !== 'eof')
      throw new ExpressionError(`Unexpected ${describe(this.peek())}`, this.peek().pos);

    return node;
  }

  parseExpression(minBp: number): ExprNode {
    if (++this.#depth > this.maxDepth)
      throw new ExpressionError('Expression is too deeply nested', this.peek().pos);

    try {
      var left = this.parsePrefix();

      while (true) {
        const token = this.peek();

        if (token.type !== 'op')
          break;

        if (token.text === '?') {
          if (TERNARY_BP <= minBp) break;
          this.next();
          const then = this.parseExpression(0);
          this.expect(':');
          const otherwise = this.parseExpression(TERNARY_BP - 1);
          left = { type: 'conditional', test: left, then, else: otherwise, pos: token.pos };
          continue;
        }

        if (!isBinary(token.text))
          break;

        const { lbp, rbp } = binary[token.text];

        if (lbp <= minBp)
          break;

        this.next();
        const right = this.parseExpression(rbp);
        left = { type: 'binary', op: token.text, left, right, pos: token.pos };
      }

      return left;
    } finally {
      this.#depth--;
    }
  }

  parsePrefix(): ExprNode {
    const token = this.next();

    if (token.type === 'number')
      return { type: 'number', value: token.value!, pos: token.pos };

    if (token.type === 'ident')
      return this.parseIdentifier(token);

    if (token.type === 'op') {
      if (token.text === '(') {
        const node = this.parseExpression(0);
        this.expect(')');
        return node;
      }

      if (token.text === '-' || token.text === '!') {
        const arg = this.parseExpression(UNARY_BP);
        return { type: 'unary', op: token.text, arg, pos: token.pos };
      }
    }

    throw new ExpressionError(`Unexpected ${describe(token)}`, token.pos);
  }

  parseIdentifier(token: Token): ExprNode {
    const { variables, constants, functions } = this.scope;
    const name = token.text;

    if (this.isOp('(')) {
      const func = functions.get(name);

      if (!func) {
        throw new ExpressionError(
          variables.has(name) || constants.has(name) ? (
            `'${name}' is not a function`
          ) : `Unknown function '${name}'`,
          token.pos
        );
      }

      this.next();
      const args: ExprNode[] = [];

      if (!this.isOp(')')) {
        do {
          args.push(this.parseExpression(0));
        } while (this.isOp(',') && this.next());
      }

      this.expect(')');

      if (args.length < func.min || args.length > func.max) {
        throw new ExpressionError(
          `${name}() expects ${arityText(func)} argument${func.max === 1 ? '' : 's'}, got ${args.length}`,
          token.pos
        );
      }

      return { type: 'call', name, args, pos: token.pos };
    }

    if (variables.has(name))
      return { type: 'variable', name, pos: token.pos };

    if (constants.has(name))
      return { type: 'constant', name, pos: token.pos };

    if (functions.has(name))
      throw new ExpressionError(`'${name}' is a function, call it like ${name}(…)`, token.pos);

    throw new ExpressionError(`Unknown identifier '${name}'`, token.pos);
  }
}

export const parse = (src: string, options: ParseOptions = {}): ExprNode => {
  const {
    scope = expressionScope,
    maxLength = MAX_LENGTH,
    maxDepth = MAX_DEPTH,
  } = options;

  if (typeof src !== 'string')
    throw new ExpressionError('Expression must be a string', 0);

  if (src.length > maxLength)
    throw new ExpressionError(`Expression is too long (max ${maxLength} characters)`, maxLength);

  const ast = new Parser(tokenize(src), scope, maxDepth).parseProgram();

  if (depthOf(ast) > maxDepth)
    throw new ExpressionError('Expression is too deeply nested', ast.pos);

  return ast;
};
