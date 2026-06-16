import { ChevronDown } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { EXAMPLES } from '../data/examples';
import { usePlaygroundStore } from '../store/playgroundStore';

export function ExampleSelector() {
  const { selectedExampleId, loadExample } = usePlaygroundStore();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedExample = EXAMPLES.find(e => e.id === selectedExampleId) || EXAMPLES[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-jajs-card backdrop-blur-md border border-jajs-cyan/20 text-jajs-text hover:border-jajs-cyan/50 transition-all duration-200 min-w-[180px]"
      >
        <span className="text-sm font-medium">{selectedExample.name}</span>
        <ChevronDown className={`w-4 h-4 text-jajs-cyan transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-72 rounded-lg bg-jajs-bg-secondary/95 backdrop-blur-xl border border-jajs-cyan/20 shadow-2xl shadow-black/50 overflow-hidden z-50 animate-fade-in">
          {EXAMPLES.map((example, index) => (
            <button
              key={example.id}
              onClick={() => {
                loadExample(example.id);
                setIsOpen(false);
              }}
              className={`w-full text-left px-4 py-3 hover:bg-jajs-cyan/10 transition-colors duration-150 border-b border-jajs-cyan/10 last:border-b-0 ${
                selectedExampleId === example.id ? 'bg-jajs-cyan/10' : ''
              }`}
              style={{ animationDelay: `${index * 30}ms` }}
            >
              <div className="text-sm font-semibold text-jajs-text flex items-center gap-2">
                {selectedExampleId === example.id && (
                  <span className="w-1.5 h-1.5 rounded-full bg-jajs-cyan animate-pulse" />
                )}
                {example.name}
              </div>
              <div className="text-xs text-jajs-text-muted mt-1 pl-3.5">
                {example.description}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
