import { Shield, Zap, Code2, Layers, FileJson, Sparkles, ArrowRight, Github } from 'lucide-react';
import { ParticleBackground } from '../components/ParticleBackground';
import { HeroSection } from '../components/HeroSection';
import { FeatureCard } from '../components/FeatureCard';
import { Playground } from '../components/Playground';

const features = [
  {
    icon: Code2,
    title: 'Java 语法风格',
    description: '完全兼容 Java 基础语法，类、修饰符、循环、异常、泛型、接口、注解照搬 Java 书写形式，熟悉 Java 的开发者零学习成本。',
  },
  {
    icon: Shield,
    title: '静态强类型',
    description: '所有变量、函数参数、返回值必须显式标注类型，无隐式 any。编译时完整类型检查，杜绝运行时类型错误。',
  },
  {
    icon: Zap,
    title: '零运行时依赖',
    description: '编译为标准 ES6+ JavaScript 代码，无需任何额外的运行时类型库，轻量高效，直接运行于浏览器和 Node.js。',
  },
  {
    icon: Layers,
    title: '完整 OOP 体系',
    description: '保留 Java 面向对象编程体系：类、抽象类、接口、继承、方法重写、访问修饰符（public/private/protected）。',
  },
  {
    icon: FileJson,
    title: 'JS 生态兼容',
    description: '剔除 Java JVM 专属特性，替换为 JS 生态等价实现。内置 JS 运行时兼容 API，同时保留 Java 风格工具类。',
  },
  {
    icon: Sparkles,
    title: 'Rollup 构建',
    description: '使用 Rollup 打包编译器，输出 ESM 和 UMD 格式产物，可在浏览器和 Node.js 中直接使用，便于集成到现有项目。',
  },
];

export default function Home() {
  return (
    <div className="relative min-h-screen bg-jajs-bg text-jajs-text overflow-hidden">
      <ParticleBackground />
      <div className="grid-pattern fixed inset-0 pointer-events-none z-0" />

      <div className="relative z-10">
        <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-jajs-bg/50 border-b border-jajs-cyan/10">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-jajs-cyan to-jajs-orange flex items-center justify-center">
                <Code2 className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold font-display">
                <span className="gradient-text">Ja</span>JS
              </span>
            </div>
            <div className="flex items-center gap-6">
              <a href="#features" className="text-sm text-jajs-text-muted hover:text-jajs-text transition-colors">
                特性
              </a>
              <a href="#playground" className="text-sm text-jajs-text-muted hover:text-jajs-text transition-colors">
                Playground
              </a>
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-jajs-card border border-jajs-cyan/20 text-sm hover:border-jajs-cyan/50 transition-all"
              >
                <Github className="w-4 h-4" />
                <span>GitHub</span>
              </a>
            </div>
          </div>
        </nav>

        <HeroSection />

        <section id="features" className="relative py-20 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <span className="inline-block px-4 py-1 rounded-full bg-jajs-orange/10 text-jajs-orange text-sm font-medium mb-4 opacity-0 animate-fade-in">
                核心特性
              </span>
              <h2 className="text-4xl md:text-5xl font-bold font-display mb-4 opacity-0 animate-slide-up">
                为什么选择 <span className="gradient-text">JaJS</span>
              </h2>
              <p className="text-jajs-text-muted text-lg max-w-2xl mx-auto opacity-0 animate-slide-up" style={{ animationDelay: '100ms' }}>
                融合 Java 的严谨与 JavaScript 的灵活，打造现代化的开发体验
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, index) => (
                <FeatureCard
                  key={feature.title}
                  icon={feature.icon}
                  title={feature.title}
                  description={feature.description}
                  delay={200 + index * 100}
                />
              ))}
            </div>
          </div>
        </section>

        <Playground />

        <section className="relative py-20 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <div className="relative p-10 rounded-2xl bg-gradient-to-br from-jajs-cyan/10 via-jajs-purple/10 to-jajs-orange/10 border border-jajs-cyan/20 backdrop-blur-xl overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-full opacity-30 pointer-events-none">
                <div className="absolute top-10 left-10 w-40 h-40 bg-jajs-cyan/20 rounded-full blur-3xl" />
                <div className="absolute bottom-10 right-10 w-40 h-40 bg-jajs-orange/20 rounded-full blur-3xl" />
              </div>

              <div className="relative z-10">
                <h2 className="text-3xl md:text-4xl font-bold font-display mb-4">
                  准备好开始使用 <span className="gradient-text">JaJS</span> 了吗？
                </h2>
                <p className="text-jajs-text-muted text-lg mb-8 max-w-xl mx-auto">
                  立即体验 Java 语法与 JavaScript 生态的完美结合，让你的前端开发更加高效和安全。
                </p>
                <div className="flex flex-wrap items-center justify-center gap-4">
                  <a
                    href="#playground"
                    className="group inline-flex items-center gap-2 px-8 py-3 rounded-lg bg-gradient-to-r from-jajs-cyan to-jajs-orange text-white font-semibold hover:shadow-lg hover:shadow-jajs-cyan/30 hover:scale-105 transition-all duration-300"
                  >
                    立即开始
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </a>
                  <a
                    href="https://github.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-8 py-3 rounded-lg border border-jajs-cyan/30 text-jajs-text font-semibold hover:bg-jajs-cyan/10 hover:border-jajs-cyan/60 transition-all duration-300"
                  >
                    <Github className="w-5 h-5" />
                    查看源码
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        <footer className="relative py-10 px-6 border-t border-jajs-cyan/10">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-jajs-cyan to-jajs-orange flex items-center justify-center">
                <Code2 className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold font-display">
                <span className="gradient-text">Ja</span>JS
              </span>
              <span className="text-jajs-text-muted text-sm ml-2">
                © 2024 All rights reserved.
              </span>
            </div>
            <div className="flex items-center gap-6">
              <span className="text-sm text-jajs-text-muted">
                Built with ❤️ for Java & JavaScript developers
              </span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
