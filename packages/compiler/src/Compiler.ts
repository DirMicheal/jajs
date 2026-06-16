import { Lexer } from './lexer/Lexer';
import { Parser } from './parser/Parser';
import { TypeChecker } from './typechecker/TypeChecker';
import { CodeGenerator } from './codegen/CodeGenerator';

export interface CompileResult {
  success: boolean;
  output?: string;
  errors: CompileError[];
}

export interface CompileError {
  message: string;
  line: number;
  column: number;
  type: 'LexerError' | 'ParserError' | 'TypeCheckerError';
}

export class Compiler {
  public compile(source: string): CompileResult {
    const errors: CompileError[] = [];

    try {
      const lexer = new Lexer(source);
      const tokens = lexer.tokenize();

      const parser = new Parser(tokens);
      const ast = parser.parse();

      const typeChecker = new TypeChecker();
      typeChecker.check(ast);

      const codeGenerator = new CodeGenerator();
      const output = codeGenerator.generate(ast);

      return {
        success: true,
        output,
        errors,
      };
    } catch (e: any) {
      let errorType: CompileError['type'] = 'TypeCheckerError';
      if (e.name === 'LexerError') errorType = 'LexerError';
      else if (e.name === 'ParserError') errorType = 'ParserError';
      else if (e.name === 'TypeCheckerError') errorType = 'TypeCheckerError';

      errors.push({
        message: e.message || String(e),
        line: e.line || 1,
        column: e.column || 1,
        type: errorType,
      });

      return {
        success: false,
        errors,
      };
    }
  }
}
