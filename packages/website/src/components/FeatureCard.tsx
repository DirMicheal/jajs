import { LucideIcon } from 'lucide-react';

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  delay?: number;
}

export function FeatureCard({ icon: Icon, title, description, delay = 0 }: FeatureCardProps) {
  return (
    <div
      className="group relative p-6 rounded-xl bg-jajs-card backdrop-blur-md border border-jajs-cyan/20 card-hover opacity-0 animate-slide-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-jajs-cyan/5 via-transparent to-jajs-orange/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      <div className="absolute -inset-px rounded-xl bg-gradient-to-br from-jajs-cyan/0 via-jajs-purple/0 to-jajs-orange/0 group-hover:from-jajs-cyan/30 group-hover:via-jajs-purple/20 group-hover:to-jajs-orange/30 transition-all duration-500 opacity-0 group-hover:opacity-100 pointer-events-none -z-10 blur-sm" />

      <div className="relative z-10">
        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-jajs-cyan/20 to-jajs-orange/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
          <Icon className="w-6 h-6 text-jajs-cyan group-hover:text-jajs-orange transition-colors duration-300" />
        </div>
        <h3 className="text-xl font-bold text-jajs-text mb-2 font-display group-hover:shine-text transition-all duration-300">
          {title}
        </h3>
        <p className="text-jajs-text-muted text-sm leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  );
}
