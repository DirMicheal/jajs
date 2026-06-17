import { create } from 'zustand';
import { Compiler, CompileResult, CompileError } from '@jajs/compiler';
import { EXAMPLES } from '../data/examples';

interface PlaygroundState {
  jajsCode: string;
  jsOutput: string;
  errors: CompileError[];
  isCompiling: boolean;
  selectedExampleId: string;
  compiler: Compiler | null;
  hasCompiled: boolean;
  setJajsCode: (code: string) => void;
  compile: () => void;
  loadExample: (id: string) => void;
}

export const usePlaygroundStore = create<PlaygroundState>((set, get) => ({
  jajsCode: EXAMPLES[0].code,
  jsOutput: '',
  errors: [],
  isCompiling: false,
  selectedExampleId: EXAMPLES[0].id,
  compiler: null,
  hasCompiled: false,

  setJajsCode: (code: string) => {
    set({ jajsCode: code, hasCompiled: false });
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

  loadExample: (id: string) => {
    const example = EXAMPLES.find(e => e.id === id);
    if (example) {
      set({
        jajsCode: example.code,
        selectedExampleId: id,
        jsOutput: '',
        errors: [],
        hasCompiled: false,
      });
    }
  },
}));
