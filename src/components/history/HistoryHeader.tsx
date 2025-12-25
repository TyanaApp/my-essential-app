import React from 'react';
import { Plus, Filter, Search } from 'lucide-react';
import { motion } from 'framer-motion';

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
    <div className="sticky top-0 z-30 pt-4 pb-3 px-4" style={{ background: 'linear-gradient(180deg, #1a1a2e 0%, rgba(26,26,46,0.95) 100%)' }}>
      {/* Title row */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={onFilterClick}
          className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
        >
          <Filter className="w-5 h-5 text-white" />
        </button>
        
        <h1 className="text-xl font-bold text-white">History</h1>
        
        <motion.button
          onClick={onAddClick}
          className="w-10 h-10 rounded-full flex items-center justify-center"
          style={{
            background: 'linear-gradient(135deg, hsl(var(--bio-purple)), hsl(var(--bio-cyan)))',
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Plus className="w-5 h-5 text-white" />
        </motion.button>
      </div>

      {/* Date range switcher */}
      <div className="flex gap-1 p-1 bg-white/5 rounded-xl mb-3">
        {dateRangeOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => onDateRangeChange(option.value)}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
              dateRange === option.value
                ? 'bg-bio-purple text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Поиск: симптомы, события, лекарства…"
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-gray-500 text-sm focus:outline-none focus:border-bio-purple/50"
        />
      </div>
    </div>
  );
};

export default HistoryHeader;
