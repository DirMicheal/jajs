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
  setJajsCode: (code: string) => void;
  compile: () => void;
  loadExample: (id: string) => void;
}

let debounceTimer: ReturnType<typeof setTimeout> | null = null;

export const usePlaygroundStore = create<PlaygroundState>((set, get) => ({
  jajsCode: EXAMPLES[0].code,
  jsOutput: '',
  errors: [],
  isCompiling: false,
  selectedExampleId: EXAMPLES[0].id,
  compiler: null,

  setJajsCode: (code: string) => {
    set({ jajsCode: code });
    
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
    debounceTimer = setTimeout(() => {
      get().compile();
    }, 500);
  },

  compile: () => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
      debounceTimer = null;
    }
    
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
      });
    }
  },

  loadExample: (id: string) => {
    const example = EXAMPLES.find(e => e.id === id);
    if (example) {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
        debounceTimer = null;
      }
      set({
        jajsCode: example.code,
        selectedExampleId: id,
      });
      get().compile();
    }
  },
}));
