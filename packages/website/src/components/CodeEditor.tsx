import { useEffect, useRef } from 'react';
import { EditorState } from '@codemirror/state';
import { EditorView, keymap, lineNumbers, highlightActiveLine, highlightActiveLineGutter } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { bracketMatching, indentOnInput, foldGutter, foldKeymap, syntaxHighlighting, defaultHighlightStyle } from '@codemirror/language';
import { javascript } from '@codemirror/lang-javascript';
import { oneDark } from '@codemirror/theme-one-dark';

interface CodeEditorProps {
  value: string;
  onChange?: (value: string) => void;
  language: 'jajs' | 'javascript';
  readOnly?: boolean;
  errorLine?: number;
}

const jajsKeywords = [
  'abstract', 'assert', 'boolean', 'break', 'byte', 'case', 'catch', 'char',
  'class', 'const', 'continue', 'default', 'do', 'double', 'else', 'enum',
  'extends', 'final', 'finally', 'float', 'for', 'goto', 'if', 'implements',
  'import', 'instanceof', 'int', 'interface', 'long', 'native', 'new',
  'package', 'private', 'protected', 'public', 'return', 'short', 'static',
  'strictfp', 'super', 'switch', 'synchronized', 'this', 'throw', 'throws',
  'transient', 'try', 'void', 'volatile', 'while', 'function', 'let', 'const',
  'var', 'in', 'of',
];

const jajsTypes = [
  'int', 'long', 'float', 'double', 'boolean', 'char', 'byte', 'short',
  'String', 'void', 'Object', 'Array', 'Number', 'Boolean', 'Error',
  'Console', 'System', 'Math', 'Date', 'JSON', 'Map', 'Set', 'Promise',
];

export function CodeEditor({ value, onChange, language, readOnly = false, errorLine }: CodeEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const updateListener = EditorView.updateListener.of((update) => {
      if (update.docChanged && onChange) {
        onChange(update.state.doc.toString());
      }
    });

    const extensions: any[] = [
      lineNumbers(),
      highlightActiveLineGutter(),
      highlightActiveLine(),
      foldGutter(),
      history(),
      indentOnInput(),
      bracketMatching(),
      oneDark,
      keymap.of([...defaultKeymap, ...historyKeymap, ...foldKeymap]),
      updateListener,
      javascript(),
      syntaxHighlighting(defaultHighlightStyle),
      EditorView.theme({
        '&': {
          height: '100%',
          backgroundColor: 'rgba(10, 14, 39, 0.6) !important',
        },
        '.cm-content': {
          padding: '16px 0',
        },
        '.cm-line': {
          padding: '0 16px',
        },
        '.cm-gutters': {
          backgroundColor: 'rgba(10, 14, 39, 0.8) !important',
          borderRight: '1px solid rgba(0, 212, 255, 0.1) !important',
        },
      }),
    ];

    if (readOnly) {
      extensions.push(EditorView.editable.of(false));
    }

    const state = EditorState.create({
      doc: value,
      extensions,
    });

    const view = new EditorView({
      state,
      parent: containerRef.current,
    });

    viewRef.current = view;

    return () => {
      view.destroy();
    };
  }, [language, readOnly, errorLine]);

  useEffect(() => {
    if (viewRef.current) {
      const currentValue = viewRef.current.state.doc.toString();
      if (currentValue !== value) {
        viewRef.current.dispatch({
          changes: {
            from: 0,
            to: currentValue.length,
            insert: value,
          },
        });
      }
    }
  }, [value]);

  return (
    <div ref={containerRef} className="code-editor-wrapper h-full w-full rounded-lg overflow-hidden border border-jajs-cyan/20" />
  );
}
