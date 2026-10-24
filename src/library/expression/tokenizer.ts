import { ExpressionError } from "./ast";

export type TokenType = 'number' | 'ident' | 'op' | 'eof';

export type Token = {
  type: TokenType;
  text: string;
  pos: number;
  value?: number;
};

// Длинные операторы раньше коротких: '**' прежде '*', '<=' прежде '<'
const operators = [
  '**', '<=', '>=', '==', '!=', '&&', '||',
  '+', '-', '*', '/', '%', '<', '>', '!', '?', ':', '(', ')', ',',
];

const comparisons = ['==', '!=', '<=', '>='];

const isDigit = (ch: string) => ch >= '0' && ch <= '9';
const isIdentStart = (ch: string) => /^[A-Za-z_]$/.test(ch);
const isIdentPart = (ch: string) => /^[A-Za-z0-9_]$/.test(ch);
const isSpace = (ch: string) => ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r';

const readNumber = (src: string, start: number) => {
  var i = start;

  while (isDigit(src[i] ?? '')) i++;

  if (src[i] === '.') {
    i++;
    while (isDigit(src[i] ?? '')) i++;
  }

  if (src[i] === 'e' || src[i] === 'E') {
    var j = i + 1;
    if (src[j] === '+' || src[j] === '-') j++;

    if (!isDigit(src[j] ?? ''))
      throw new ExpressionError('Malformed number exponent', i);

    i = j;
    while (isDigit(src[i] ?? '')) i++;
  }

  return i;
};

const explain = (src: string, i: number): string => {
  const ch = src[i];

  if (ch === '"' || ch === "'" || ch === '`')
    return 'Strings are not allowed';
  if (ch === '.')
    return "Member access ('.') is not allowed";
  if (ch === '[' || ch === ']')
    return 'Brackets [] are not allowed';
  if (ch === '{' || ch === '}')
    return 'Braces {} are not allowed';
  if (ch === '=')
    return 'Assignment is not allowed';
  if (ch === '^')
    return "Unknown operator '^', use ** for power";
  if (ch === '&' || ch === '|')
    return 'Bitwise operators are not supported, use && or ||';
  if (ch === ';')
    return 'Only a single expression is allowed';

  return `Unexpected character '${ch}'`;
};

export const tokenize = (src: string): Token[] => {
  const tokens: Token[] = [];
  var i = 0;

  while (i < src.length) {
    const ch = src[i];

    if (isSpace(ch)) {
      i++;
      continue;
    }

    if (isDigit(ch) || (ch === '.' && isDigit(src[i + 1] ?? ''))) {
      const end = readNumber(src, i);

      if (isIdentPart(src[end] ?? '') || src[end] === '.')
        throw new ExpressionError(`Unexpected '${src[end]}' after number`, end);

      const text = src.slice(i, end);
      tokens.push({ type: 'number', text, pos: i, value: +text });
      i = end;
      continue;
    }

    if (isIdentStart(ch)) {
      var end = i + 1;
      while (isIdentPart(src[end] ?? '')) end++;
      tokens.push({ type: 'ident', text: src.slice(i, end), pos: i });
      i = end;
      continue;
    }

    const op = operators.find(op => src.startsWith(op, i));

    // '===', '!==', '<==' — лишний '='
    if (op && comparisons.includes(op) && src[i + op.length] === '=')
      throw new ExpressionError(`Unknown operator '${op}='`, i);

    if (op) {
      tokens.push({ type: 'op', text: op, pos: i });
      i += op.length;
      continue;
    }

    throw new ExpressionError(explain(src, i), i);
  }

  tokens.push({ type: 'eof', text: '', pos: src.length });
  return tokens;
};
