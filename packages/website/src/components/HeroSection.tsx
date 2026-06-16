import { useEffect, useState } from 'react';
import { Code2, Sparkles, Zap } from 'lucide-react';

export function HeroSection() {
  const [displayText, setDisplayText] = useState('');
  const fullText = 'Java 语法，JavaScript 运行时';

  useEffect(() => {
    let index = 0;
    const timer = setInterval(() => {
      if (index <= fullText.length) {
        setDisplayText(fullText.slice(0, index));
        index++;
      } else {
        clearInterval(timer);
      }
    }, 80);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="relative pt-24 pb-20 px-6 overflow-hidden">
      <div className="absolute top-20 left-1/4 w-96 h-96 bg-jajs-cyan/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '0s' }} />
      <div className="absolute top-40 right-1/4 w-80 h-80 bg-jajs-orange/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
      <div className="absolute bottom-20 left-1/3 w-64 h-64 bg-jajs-purple/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '4s' }} />

      <div className="relative z-10 max-w-6xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-jajs-card backdrop-blur-md border border-jajs-cyan/30 mb-8 opacity-0 animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <Sparkles className="w-4 h-4 text-jajs-cyan" />
          <span className="text-sm text-jajs-text-muted">全新编程语言 · 静态强类型 · 编译到 ES6+</span>
        </div>

        <div className="mb-6 opacity-0 animate-fade-in" style={{ animationDelay: '0.4s' }}>
          <div className="inline-flex items-center justify-center gap-3 mb-4">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-jajs-cyan to-jajs-orange rounded-2xl blur-xl opacity-50 animate-pulse-glow" />
              <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-jajs-bg-secondary to-jajs-bg border border-jajs-cyan/30 flex items-center justify-center">
                <Code2 className="w-10 h-10 text-jajs-cyan" />
              </div>
            </div>
            <h1 className="text-6xl md:text-7xl font-bold font-display">
              <span className="gradient-text">Ja</span>
              <span className="text-jajs-text">JS</span>
            </h1>
          </div>
        </div>

        <h2 className="text-2xl md:text-3xl font-semibold text-jajs-text mb-4 min-h-[2.5rem] opacity-0 animate-fade-in" style={{ animationDelay: '0.6s' }}>
          <span className={displayText.length < fullText.length ? 'typing-cursor' : ''}>
            {displayText}
          </span>
        </h2>

        <p className="text-lg text-jajs-text-muted max-w-2xl mx-auto mb-10 opacity-0 animate-slide-up" style={{ animationDelay: '1s' }}>
          使用熟悉的 Java 语法编写代码，享受 JavaScript 生态的强大能力。
          <br />
          完全静态类型检查，无任何运行时类型依赖。
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 opacity-0 animate-slide-up" style={{ animationDelay: '1.2s' }}>
          <a
            href="#playground"
            className="group relative px-8 py-3 rounded-lg bg-gradient-to-r from-jajs-cyan to-jajs-orange text-white font-semibold overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-jajs-cyan/30 hover:scale-105"
          >
            <span className="relative z-10 flex items-center gap-2">
              <Zap className="w-5 h-5" />
              立即体验
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-jajs-orange to-jajs-purple opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </a>
          <a
            href="#features"
            className="px-8 py-3 rounded-lg border border-jajs-cyan/30 text-jajs-text font-semibold hover:bg-jajs-cyan/10 hover:border-jajs-cyan/60 transition-all duration-300 hover:scale-105"
          >
            了解特性
          </a>
        </div>
      </div>
    </section>
  );
}
