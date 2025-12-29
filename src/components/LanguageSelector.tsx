import React from 'react';
import { motion } from 'framer-motion';
import { Globe } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface LanguageSelectorProps {
  variant?: 'pills' | 'dropdown' | 'compact';
  showLabel?: boolean;
}

const languages = [
  { code: 'en' as const, label: 'English', short: 'EN' },
  { code: 'ru' as const, label: 'Русский', short: 'RU' },
  { code: 'lv' as const, label: 'Latviešu', short: 'LV' },
];

const LanguageSelector: React.FC<LanguageSelectorProps> = ({ 
  variant = 'pills',
  showLabel = false 
}) => {
  const { language, setLanguage } = useLanguage();

  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-1.5">
        {showLabel && (
          <Globe className="w-4 h-4 text-muted-foreground" />
        )}
        <div className="flex rounded-full bg-surface/50 backdrop-blur-sm border border-border/50 p-0.5">
          {languages.map((lang) => (
            <motion.button
              key={lang.code}
              onClick={() => setLanguage(lang.code)}
              className={`relative px-2.5 py-1 text-xs font-exo font-medium rounded-full transition-colors ${
                language === lang.code
                  ? 'text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              whileTap={{ scale: 0.95 }}
            >
              {language === lang.code && (
                <motion.div
                  className="absolute inset-0 bg-primary rounded-full pointer-events-none"
                  layoutId="language-indicator"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <span className="relative z-10">{lang.short}</span>
            </motion.button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {showLabel && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground font-exo">
          <Globe className="w-4 h-4" />
          <span>Language</span>
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