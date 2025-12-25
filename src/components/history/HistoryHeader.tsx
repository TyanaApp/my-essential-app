import React from 'react';
import { Plus, Filter, Search } from 'lucide-react';
import { motion } from 'framer-motion';
import ThemeToggle from '@/components/ThemeToggle';

interface HistoryHeaderProps {
  onAddClick: () => void;
  onFilterClick: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  dateRange: 'day' | 'week' | 'month' | 'custom';
  onDateRangeChange: (range: 'day' | 'week' | 'month' | 'custom') => void;
}

const dateRangeOptions = [
  { value: 'day', label: 'День' },
  { value: 'week', label: 'Неделя' },
  { value: 'month', label: 'Месяц' },
  { value: 'custom', label: 'Свой' },
] as const;

const HistoryHeader: React.FC<HistoryHeaderProps> = ({
  onAddClick,
  onFilterClick,
  searchQuery,
  onSearchChange,
  dateRange,
  onDateRangeChange,
}) => {
  return (
    <div className="sticky top-0 z-30 pt-4 pb-3 px-4 bg-background/95 backdrop-blur-sm border-b border-border/50">
      {/* Title row */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={onFilterClick}
          className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors"
          aria-label="Фильтры"
        >
          <Filter className="w-5 h-5 text-foreground" />
        </button>
        
        <h1 className="text-xl font-bold text-foreground">History</h1>
        
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <motion.button
            onClick={onAddClick}
            className="w-10 h-10 rounded-full flex items-center justify-center bg-primary"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            aria-label="Добавить событие"
          >
            <Plus className="w-5 h-5 text-primary-foreground" />
          </motion.button>
        </div>
      </div>

      {/* Date range switcher */}
      <div className="flex gap-1 p-1 bg-muted rounded-xl mb-3">
        {dateRangeOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => onDateRangeChange(option.value)}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
              dateRange === option.value
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Поиск: симптомы, события, лекарства…"
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-muted border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50"
          aria-label="Поиск по событиям"
        />
      </div>
    </div>
  );
};

export default HistoryHeader;
