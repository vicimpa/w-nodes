import { ExprNode, ExpressionError } from "./ast";
import { ParseOptions, parse } from "./parser";
import { buildKernel, generate } from "./codegen";

export * from "./ast";
export * from "./scope";
export * from "./tokenizer";
export * from "./parser";
export * from "./codegen";
export * from "./processor";

export type CompileResult =
  | { ok: true; ast: ExprNode; code: string; kernel: string; }
  | { ok: false; error: ExpressionError; };

// Текст → AST → JS. Пользовательский текст в результат не попадает, только узлы AST.
export const compile = (src: string, options?: ParseOptions): CompileResult => {
  try {
    const ast = parse(src, options);
    const code = generate(ast, options?.scope);
    return { ok: true, ast, code, kernel: buildKernel(code) };
  } catch (error) {
    if (error instanceof ExpressionError)
      return { ok: false, error };

    // переполнение стека и прочее — тоже просто ошибка выражения
    return { ok: false, error: new ExpressionError('Invalid expression', 0) };
  }
};
