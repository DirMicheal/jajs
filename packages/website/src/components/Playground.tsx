import { useEffect } from 'react';
import { Copy, Check, AlertCircle, Code2, FileCode, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { CodeEditor } from './CodeEditor';
import { ExampleSelector } from './ExampleSelector';
import { usePlaygroundStore } from '../store/playgroundStore';

export function Playground() {
  const { jajsCode, jsOutput, errors, isCompiling, setJajsCode, compile } = usePlaygroundStore();
  const [copied, setCopied] = useState(false);
  const [errorShake, setErrorShake] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      compile();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (errors.length > 0) {
      setErrorShake(true);
      const timer = setTimeout(() => setErrorShake(false), 500);
      return () => clearTimeout(timer);
    }
  }, [errors.length]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(jsOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const hasErrors = errors.length > 0;

  return (
    <section id="playground" className="relative py-16 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-4xl font-bold font-display mb-4 opacity-0 animate-slide-up">
            <span className="gradient-text">在线 Playground</span>
          </h2>
          <p className="text-jajs-text-muted text-lg max-w-2xl mx-auto opacity-0 animate-slide-up" style={{ animationDelay: '100ms' }}>
            左边输入 JaJS 代码，右边实时查看编译后的 JavaScript
          </p>
        </div>

        <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <ExampleSelector />
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-jajs-card border border-jajs-cyan/20">
              {isCompiling ? (
                <>
                  <Loader2 className="w-4 h-4 text-jajs-cyan animate-spin" />
                  <span className="text-sm text-jajs-text-muted">编译中...</span>
                </>
              ) : hasErrors ? (
                <>
                  <AlertCircle className="w-4 h-4 text-red-400" />
                  <span className="text-sm text-red-400">{errors.length} 个错误</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 text-green-400" />
                  <span className="text-sm text-green-400">编译成功</span>
                </>
              )}
            </div>
          </div>

          <button
            onClick={handleCopy}
            disabled={!jsOutput || hasErrors}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-jajs-card backdrop-blur-md border border-jajs-cyan/20 text-jajs-text hover:border-jajs-cyan/50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-green-400" />
                <span className="text-sm text-green-400">已复制</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-jajs-cyan" />
                <span className="text-sm">复制 JS</span>
              </>
            )}
          </button>
        </div>

        <div className={`relative grid grid-cols-1 lg:grid-cols-2 gap-4 ${errorShake ? 'animate-shake' : ''}`}>
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-jajs-cyan via-jajs-purple to-jajs-cyan rounded-xl opacity-30 group-hover:opacity-60 transition-opacity duration-500 blur-sm" />
            <div className="relative flex flex-col h-[600px] rounded-xl overflow-hidden bg-jajs-bg-secondary/80 backdrop-blur-xl border border-jajs-cyan/20">
              <div className="flex items-center justify-between px-4 py-3 bg-jajs-bg-secondary/90 border-b border-jajs-cyan/20">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-red-500/80" />
                    <span className="w-3 h-3 rounded-full bg-yellow-500/80" />
                    <span className="w-3 h-3 rounded-full bg-green-500/80" />
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Code2 className="w-4 h-4 text-jajs-orange" />
                    <span className="text-sm font-medium text-jajs-text">JaJS 代码</span>
                  </div>
                </div>
                <span className="text-xs text-jajs-text-muted px-2 py-1 rounded bg-jajs-card">
                  .jajs
                </span>
              </div>
              <div className="flex-1 p-0 min-h-0 overflow-hidden">
                <CodeEditor
                  value={jajsCode}
                  onChange={setJajsCode}
                  language="jajs"
                  errorLine={errors[0]?.line}
                />
              </div>
            </div>
          </div>

          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-jajs-orange via-jajs-purple to-jajs-orange rounded-xl opacity-30 group-hover:opacity-60 transition-opacity duration-500 blur-sm" />
            <div className="relative flex flex-col h-[600px] rounded-xl overflow-hidden bg-jajs-bg-secondary/80 backdrop-blur-xl border border-jajs-orange/20">
              <div className="flex items-center justify-between px-4 py-3 bg-jajs-bg-secondary/90 border-b border-jajs-orange/20">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-red-500/80" />
                    <span className="w-3 h-3 rounded-full bg-yellow-500/80" />
                    <span className="w-3 h-3 rounded-full bg-green-500/80" />
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <FileCode className="w-4 h-4 text-jajs-cyan" />
                    <span className="text-sm font-medium text-jajs-text">JavaScript 输出</span>
                  </div>
                </div>
                <span className="text-xs text-jajs-text-muted px-2 py-1 rounded bg-jajs-card">
                  .js
                </span>
              </div>
              <div className="flex-1 flex flex-col">
                {hasErrors ? (
                  <div className="flex-1 overflow-auto p-4 bg-red-500/5">
                    <div className="flex items-start gap-3 mb-3">
                      <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="text-red-400 font-semibold mb-1">编译错误</h4>
                        <div className="space-y-2">
                          {errors.map((error, index) => (
                            <div
                              key={index}
                              className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 font-mono text-sm"
                            >
                              <div className="text-red-400 font-medium">
                                [{error.type}] Line {error.line}, Column {error.column}
                              </div>
                              <div className="text-jajs-text mt-1 break-words">
                                {error.message.replace(/\[[^\]]*\]\s*/g, '')}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 p-0 min-h-0 overflow-hidden">
                    <CodeEditor
                      value={jsOutput}
                      language="javascript"
                      readOnly={true}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
