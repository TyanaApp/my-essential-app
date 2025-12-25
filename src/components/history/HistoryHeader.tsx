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
    <div className="sticky top-0 z-30 pt-2 pb-2 px-3 bg-background/95 backdrop-blur-sm border-b border-border/50">
      {/* Compact header row */}
      <div className="flex items-center justify-between gap-2">
        <button
          onClick={onFilterClick}
          className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors"
          aria-label="Фильтры"
        >
          <Filter className="w-4 h-4 text-foreground" />
        </button>
        
        {/* Date range inline */}
        <div className="flex gap-0.5 p-0.5 bg-muted rounded-lg flex-1 max-w-[200px]">
          {dateRangeOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => onDateRangeChange(option.value)}
              className={`flex-1 py-1 px-2 rounded text-xs font-medium transition-all ${
                dateRange === option.value
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
        
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <motion.button
            onClick={onAddClick}
            className="w-8 h-8 rounded-full flex items-center justify-center bg-primary"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            aria-label="Добавить событие"
          >
            <Plus className="w-4 h-4 text-primary-foreground" />
          </motion.button>
        </div>
      </div>

      {/* Compact search */}
      <div className="relative mt-2">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Поиск..."
          className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-muted border border-border text-foreground placeholder:text-muted-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary/50"
          aria-label="Поиск по событиям"
        />
      </div>
    </div>
  );
};

export default HistoryHeader;
