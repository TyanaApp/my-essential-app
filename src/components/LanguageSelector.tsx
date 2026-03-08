import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, ChevronDown } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface LanguageSelectorProps {
  variant?: 'pills' | 'dropdown' | 'compact';
  showLabel?: boolean;
}

const languages = [
  { code: 'en' as const, label: 'English', short: 'EN' },
  { code: 'ru' as const, label: 'Русский', short: 'RU' },
  { code: 'lv' as const, label: 'Latviešu', short: 'LV' },
  { code: 'uk' as const, label: 'Українська', short: 'UA' },
];

const LanguageSelector: React.FC<LanguageSelectorProps> = ({ 
  variant = 'pills',
  showLabel = false 
}) => {
  const { language, setLanguage } = useLanguage();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const current = languages.find(l => l.code === language) || languages[0];

  if (variant === 'compact') {
    return (
      <div className="relative" ref={ref}>
        <motion.button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-1 px-3 py-1.5 text-xs font-exo font-medium rounded-full bg-surface/50 backdrop-blur-sm border border-border/50 transition-colors hover:bg-surface"
          whileTap={{ scale: 0.95 }}
        >
          <Globe className="w-3.5 h-3.5" />
          <span>{current.short}</span>
          <ChevronDown className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} />
        </motion.button>

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: -4, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-full mt-1 bg-card border border-border rounded-xl shadow-lg overflow-hidden z-50 min-w-[120px]"
            >
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => { setLanguage(lang.code); setOpen(false); }}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-exo font-medium transition-colors ${
                    language === lang.code
                      ? 'bg-primary text-primary-foreground'
                      : 'text-foreground hover:bg-accent'
                  }`}
                >
                  <span className="w-6 text-right opacity-70">{lang.short}</span>
                  <span>{lang.label}</span>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {showLabel && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground font-exo">
          <Globe className="w-4 h-4" />
          <span>{language === 'ru' ? 'Язык' : language === 'lv' ? 'Valoda' : 'Language'}</span>
        </div>
      )}
      <div className="flex gap-2">
        {languages.map((lang) => (
          <motion.button
            key={lang.code}
            onClick={() => setLanguage(lang.code)}
            className={`flex-1 px-4 py-2.5 rounded-[16px] font-exo text-sm font-medium transition-all ${
              language === lang.code
                ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25'
                : 'bg-surface/50 text-muted-foreground hover:bg-surface hover:text-foreground border border-border/50'
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <span className="block text-xs opacity-70 mb-0.5">{lang.short}</span>
            <span>{lang.label}</span>
          </motion.button>
        ))}
      </div>
    </div>
  );
};

export default LanguageSelector;