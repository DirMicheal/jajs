import { useEffect, useCallback } from 'react';
import { Copy, Check, AlertCircle, Code2, FileCode, Loader2, Play, RotateCcw, Terminal, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { CodeEditor } from './CodeEditor';
import { ExampleSelector } from './ExampleSelector';
import { usePlaygroundStore, RunOutput } from '../store/playgroundStore';

type RightPanelTab = 'js' | 'output';

function OutputLine({ item }: { item: RunOutput }) {
  const colorMap: Record<RunOutput['type'], string> = {
    log: 'text-jajs-text',
    error: 'text-red-400',
    warn: 'text-yellow-400',
    info: 'text-jajs-cyan',
    result: 'text-green-400',
  };

  const prefixMap: Record<RunOutput['type'], string> = {
    log: '›',
    error: '✕',
    warn: '⚠',
    info: 'ℹ',
    result: '←',
  };

  const bgMap: Record<RunOutput['type'], string> = {
    log: 'bg-transparent',
    error: 'bg-red-500/5',
    warn: 'bg-yellow-500/5',
    info: 'bg-jajs-cyan/5',
    result: 'bg-green-500/5',
  };

  return (
    <div className={`px-3 py-2 font-mono text-sm border-b border-jajs-cyan/10 ${bgMap[item.type]} last:border-b-0`}>
      <div className="flex gap-2 min-w-0">
        <span className={`${colorMap[item.type]} flex-shrink-0 w-5 text-center select-none`}>
          {prefixMap[item.type]}
        </span>
        <span className={`${colorMap[item.type]} break-words whitespace-pre-wrap flex-1`}>
          {item.content}
        </span>
      </div>
    </div>
  );
}

export function Playground() {
  const { jajsCode, jsOutput, errors, isCompiling, isRunning, runOutput, hasCompiled, hasRun, setJajsCode, compile, run, compileAndRun, clearRunOutput } = usePlaygroundStore();
  const [copied, setCopied] = useState(false);
  const [errorShake, setErrorShake] = useState(false);
  const [rightTab, setRightTab] = useState<RightPanelTab>('js');

  useEffect(() => {
    compile();
  }, []);

  useEffect(() => {
    if (errors.length > 0) {
      setErrorShake(true);
      const timer = setTimeout(() => setErrorShake(false), 500);
      return () => clearTimeout(timer);
    }
  }, [errors.length]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      if (e.shiftKey) {
        compileAndRun();
      } else {
        compile();
      }
    }
  }, [compile, compileAndRun]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(jsOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    setJajsCode('public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, JaJS!");\n    }\n}\n');
  };

  const hasErrors = errors.length > 0;
  const isEmptyOutput = !hasCompiled && !jsOutput;
  const isEmptyRunOutput = !hasRun || runOutput.length === 0;

  return (
    <section id="playground" className="relative py-16 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-4xl font-bold font-display mb-4 opacity-0 animate-slide-up">
            <span className="gradient-text">在线 Playground</span>
          </h2>
          <p className="text-jajs-text-muted text-lg max-w-2xl mx-auto opacity-0 animate-slide-up" style={{ animationDelay: '100ms' }}>
            左边输入 JaJS 代码，点击 <kbd className="px-2 py-0.5 rounded bg-jajs-card border border-jajs-cyan/30 text-jajs-cyan text-sm font-mono">Ctrl + Enter</kbd> 编译
            <span className="mx-1">或</span>
            <kbd className="px-2 py-0.5 rounded bg-jajs-card border border-jajs-orange/30 text-jajs-orange text-sm font-mono">Ctrl + Shift + Enter</kbd> 编译运行
          </p>
        </div>

        <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <ExampleSelector />
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-jajs-card border border-jajs-cyan/20">
              {isCompiling || isRunning ? (
                <>
                  <Loader2 className="w-4 h-4 text-jajs-cyan animate-spin" />
                  <span className="text-sm text-jajs-text-muted">
                    {isCompiling ? '编译中...' : '运行中...'}
                  </span>
                </>
              ) : hasErrors ? (
                <>
                  <AlertCircle className="w-4 h-4 text-red-400" />
                  <span className="text-sm text-red-400">{errors.length} 个错误</span>
                </>
              ) : hasCompiled ? (
                <>
                  <Check className="w-4 h-4 text-green-400" />
                  <span className="text-sm text-green-400">编译成功</span>
                </>
              ) : (
                <>
                  <Code2 className="w-4 h-4 text-jajs-text-muted" />
                  <span className="text-sm text-jajs-text-muted">未编译</span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-jajs-card backdrop-blur-md border border-jajs-cyan/20 text-jajs-text hover:border-jajs-cyan/50 transition-all duration-200"
              title="重置代码"
            >
              <RotateCcw className="w-4 h-4" />
              <span className="text-sm">重置</span>
            </button>
            <button
              onClick={compile}
              disabled={isCompiling || isRunning}
              className="flex items-center gap-2 px-5 py-2 rounded-lg bg-gradient-to-r from-jajs-cyan to-jajs-purple text-white font-semibold hover:shadow-lg hover:shadow-jajs-cyan/30 hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {isCompiling ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Code2 className="w-4 h-4" />
              )}
              <span className="text-sm">编译</span>
            </button>
            <button
              onClick={compileAndRun}
              disabled={isCompiling || isRunning}
              className="flex items-center gap-2 px-5 py-2 rounded-lg bg-gradient-to-r from-jajs-orange to-jajs-purple text-white font-semibold hover:shadow-lg hover:shadow-jajs-orange/30 hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              title="编译并运行 (Ctrl+Shift+Enter)"
            >
              {isRunning ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Play className="w-4 h-4" />
              )}
              <span className="text-sm">运行</span>
            </button>
            {rightTab === 'js' ? (
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
            ) : (
              <button
                onClick={clearRunOutput}
                disabled={runOutput.length === 0}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-jajs-card backdrop-blur-md border border-jajs-orange/20 text-jajs-text hover:border-jajs-orange/50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                title="清空输出"
              >
                <Trash2 className="w-4 h-4 text-jajs-orange" />
                <span className="text-sm">清空</span>
              </button>
            )}
          </div>
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
                    <button
                      onClick={() => setRightTab('js')}
                      className={`flex items-center gap-2 px-3 py-1 rounded-md transition-all duration-200 ${
                        rightTab === 'js'
                          ? 'bg-jajs-orange/20 text-jajs-orange'
                          : 'text-jajs-text-muted hover:text-jajs-text'
                      }`}
                    >
                      <FileCode className="w-4 h-4" />
                      <span className="text-sm font-medium">JavaScript</span>
                    </button>
                    <button
                      onClick={() => setRightTab('output')}
                      className={`flex items-center gap-2 px-3 py-1 rounded-md transition-all duration-200 ${
                        rightTab === 'output'
                          ? 'bg-jajs-orange/20 text-jajs-orange'
                          : 'text-jajs-text-muted hover:text-jajs-text'
                      }`}
                    >
                      <Terminal className="w-4 h-4" />
                      <span className="text-sm font-medium">运行结果</span>
                    </button>
                  </div>
                </div>
                <span className="text-xs text-jajs-text-muted px-2 py-1 rounded bg-jajs-card">
                  {rightTab === 'js' ? '.js' : 'output'}
                </span>
              </div>
              <div className="flex-1 p-0 min-h-0 overflow-hidden">
                {rightTab === 'js' ? (
                  hasErrors ? (
                    <div className="h-full overflow-auto p-4 bg-red-500/5">
                      <div className="flex items-start gap-3 mb-3">
                        <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <h4 className="text-red-400 font-semibold mb-1">编译错误</h4>
                          <div className="space-y-2">
                            {errors.map((error, index) => (
                              <div
                                key={index}
                                className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 font-mono text-sm break-words"
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
                  ) : isEmptyOutput ? (
                    <div className="h-full flex items-center justify-center">
                      <div className="text-center">
                        <FileCode className="w-12 h-12 text-jajs-text-muted/30 mx-auto mb-3" />
                        <p className="text-jajs-text-muted text-sm">点击编译按钮或按 Ctrl+Enter 查看输出</p>
                      </div>
                    </div>
                  ) : (
                    <CodeEditor
                      value={jsOutput}
                      language="javascript"
                      readOnly={true}
                    />
                  )
                ) : (
                  <div className="h-full overflow-auto bg-jajs-bg-secondary">
                    {isEmptyRunOutput ? (
                      <div className="h-full flex items-center justify-center">
                        <div className="text-center">
                          <Terminal className="w-12 h-12 text-jajs-text-muted/30 mx-auto mb-3" />
                          <p className="text-jajs-text-muted text-sm">点击运行按钮或按 Ctrl+Shift+Enter 执行代码</p>
                        </div>
                      </div>
                    ) : (
                      <div className="py-2">
                        {runOutput.map((item, index) => (
                          <OutputLine key={index} item={item} />
                        ))}
                      </div>
                    )}
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
