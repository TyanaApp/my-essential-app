import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { motion } from 'framer-motion';

interface ThemeToggleProps {
  className?: string;
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = '' }) => {
  const { theme, setTheme } = useTheme();
  const isDark = theme === 'dark';

  const toggleTheme = () => {
    setTheme(isDark ? 'light' : 'dark');
  };

  return (
    <button
      onClick={toggleTheme}
      className={`relative w-14 h-8 rounded-full p-1 transition-colors duration-300 ${
        isDark 
          ? 'bg-slate-700 border border-slate-600' 
          : 'bg-slate-200 border border-slate-300'
      } ${className}`}
      aria-label={isDark ? 'Включить светлую тему' : 'Включить тёмную тему'}
    >
      <motion.div
        layout
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        className={`w-6 h-6 rounded-full flex items-center justify-center ${
          isDark 
            ? 'bg-slate-900 ml-auto' 
            : 'bg-white ml-0'
        }`}
        style={{
          boxShadow: isDark 
            ? '0 0 10px rgba(139, 92, 246, 0.3)' 
            : '0 2px 4px rgba(0, 0, 0, 0.1)'
        }}
      >
        {isDark ? (
          <Moon className="w-3.5 h-3.5 text-violet-400" />
        ) : (
          <Sun className="w-3.5 h-3.5 text-amber-500" />
        )}
      </motion.div>
    </button>
  );
};

export default ThemeToggle;
