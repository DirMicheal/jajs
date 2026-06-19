import { create } from 'zustand';
import { Compiler, CompileResult, CompileError } from '@jajs/compiler';
import { EXAMPLES } from '../data/examples';

export interface RunOutput {
  type: 'log' | 'error' | 'warn' | 'info' | 'result';
  content: string;
  timestamp: number;
}

interface PlaygroundState {
  jajsCode: string;
  jsOutput: string;
  errors: CompileError[];
  isCompiling: boolean;
  isRunning: boolean;
  runOutput: RunOutput[];
  selectedExampleId: string;
  compiler: Compiler | null;
  hasCompiled: boolean;
  hasRun: boolean;
  setJajsCode: (code: string) => void;
  compile: () => void;
  run: () => void;
  compileAndRun: () => void;
  clearRunOutput: () => void;
  loadExample: (id: string) => void;
}

export const usePlaygroundStore = create<PlaygroundState>((set, get) => ({
  jajsCode: EXAMPLES[0].code,
  jsOutput: '',
  errors: [],
  isCompiling: false,
  isRunning: false,
  runOutput: [],
  selectedExampleId: EXAMPLES[0].id,
  compiler: null,
  hasCompiled: false,
  hasRun: false,

  setJajsCode: (code: string) => {
    set({ jajsCode: code, hasCompiled: false, hasRun: false });
  },

  compile: () => {
    const { jajsCode } = get();
    let compiler = get().compiler;

    if (!compiler) {
      compiler = new Compiler();
      set({ compiler });
    }

    set({ isCompiling: true });

    try {
      const result: CompileResult = compiler.compile(jajsCode);
      set({
        jsOutput: result.output || '',
        errors: result.errors,
        isCompiling: false,
        hasCompiled: true,
      });
    } catch (e: any) {
      set({
        jsOutput: '',
        errors: [{
          message: e.message || 'Unknown error',
          line: 1,
          column: 1,
          type: 'TypeCheckerError',
        }],
        isCompiling: false,
        hasCompiled: true,
      });
    }
  },

  run: () => {
    const { jsOutput, errors } = get();

    if (errors.length > 0 || !jsOutput) {
      set({
        runOutput: [{
          type: 'error',
          content: '代码存在编译错误，无法运行。请先修复错误。',
          timestamp: Date.now(),
        }],
        hasRun: true,
      });
      return;
    }

    set({ isRunning: true, runOutput: [] });

    const runOutput: RunOutput[] = [];

    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;
    const originalInfo = console.info;

    const formatArgs = (args: any[]): string => {
      return args.map(arg => {
        if (typeof arg === 'object' && arg !== null) {
          try {
            return JSON.stringify(arg, null, 2);
          } catch {
            return String(arg);
          }
        }
        return String(arg);
      }).join(' ');
    };

    console.log = (...args: any[]) => {
      runOutput.push({ type: 'log', content: formatArgs(args), timestamp: Date.now() });
    };
    console.error = (...args: any[]) => {
      runOutput.push({ type: 'error', content: formatArgs(args), timestamp: Date.now() });
    };
    console.warn = (...args: any[]) => {
      runOutput.push({ type: 'warn', content: formatArgs(args), timestamp: Date.now() });
    };
    console.info = (...args: any[]) => {
      runOutput.push({ type: 'info', content: formatArgs(args), timestamp: Date.now() });
    };

    try {
      const executableCode = jsOutput
        .replace(/^export\s+/gm, '');
      const fn = new Function(executableCode);
      const result = fn();
      if (result !== undefined) {
        runOutput.push({ type: 'result', content: String(result), timestamp: Date.now() });
      }
    } catch (e: any) {
      runOutput.push({
        type: 'error',
        content: `运行时错误: ${e.message || String(e)}`,
        timestamp: Date.now(),
      });
    } finally {
      console.log = originalLog;
      console.error = originalError;
      console.warn = originalWarn;
      console.info = originalInfo;
    }

    set({
      runOutput,
      isRunning: false,
      hasRun: true,
    });
  },

  compileAndRun: () => {
    const { compile, run } = get();
    compile();
    setTimeout(() => {
      const { errors } = get();
      if (errors.length === 0) {
        run();
      }
    }, 100);
  },

  clearRunOutput: () => {
    set({ runOutput: [] });
  },

  loadExample: (id: string) => {
    const example = EXAMPLES.find(e => e.id === id);
    if (example) {
      set({
        jajsCode: example.code,
        selectedExampleId: id,
        jsOutput: '',
        errors: [],
        runOutput: [],
        hasCompiled: false,
        hasRun: false,
      });
    }
  },
}));
