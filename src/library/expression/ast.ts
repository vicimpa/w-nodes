export type UnaryOperator = '-' | '!';

export type BinaryOperator =
  | '+' | '-' | '*' | '/' | '%' | '**'
  | '<' | '<=' | '>' | '>=' | '==' | '!='
  | '&&' | '||';

export type NumberNode = { type: 'number'; value: number; pos: number; };
export type VariableNode = { type: 'variable'; name: string; pos: number; };
export type ConstantNode = { type: 'constant'; name: string; pos: number; };
export type UnaryNode = { type: 'unary'; op: UnaryOperator; arg: ExprNode; pos: number; };
export type BinaryNode = { type: 'binary'; op: BinaryOperator; left: ExprNode; right: ExprNode; pos: number; };
export type ConditionalNode = { type: 'conditional'; test: ExprNode; then: ExprNode; else: ExprNode; pos: number; };
export type CallNode = { type: 'call'; name: string; args: ExprNode[]; pos: number; };

export type ExprNode =
  | NumberNode
  | VariableNode
  | ConstantNode
  | UnaryNode
  | BinaryNode
  | ConditionalNode
  | CallNode;

export class ExpressionError extends Error {
  pos: number;

  constructor(message: string, pos: number) {
    super(message);
    this.pos = pos;
    this.name = 'ExpressionError';
  }

  toString() {
    return `${this.message} (at ${this.pos + 1})`;
  }
}

export const children = (node: ExprNode): ExprNode[] => {
  switch (node.type) {
    case 'unary': return [node.arg];
    case 'binary': return [node.left, node.right];
    case 'conditional': return [node.test, node.then, node.else];
    case 'call': return node.args;
    default: return [];
  }
};

export const depthOf = (node: ExprNode): number => (
  1 + children(node).reduce((max, child) => Math.max(max, depthOf(child)), 0)
);
