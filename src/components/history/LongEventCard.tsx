import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, ChevronRight, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface EventPhase {
  name: string;
  startDate: string;
  endDate: string;
  status: 'completed' | 'active' | 'upcoming';
  impact?: 'positive' | 'negative' | 'neutral';
}

interface LongEventCardProps {
  title: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  currentDay?: number;
  phases: EventPhase[];
  overallImpact: 'positive' | 'negative' | 'neutral';
  onClick: () => void;
}

const LongEventCard: React.FC<LongEventCardProps> = ({
  title,
  startDate,
  endDate,
  totalDays,
  currentDay,
  phases,
  overallImpact,
  onClick,
}) => {
  const progress = currentDay ? (currentDay / totalDays) * 100 : 100;
  
  const impactConfig = {
    positive: { icon: TrendingUp, color: 'text-green-400', bgColor: 'bg-green-500/20' },
    negative: { icon: TrendingDown, color: 'text-red-400', bgColor: 'bg-red-500/20' },
    neutral: { icon: Minus, color: 'text-gray-400', bgColor: 'bg-gray-500/20' },
  };

  const ImpactIcon = impactConfig[overallImpact].icon;

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="w-full text-left bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-sm hover:bg-white/10 transition-colors"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center">
            <Calendar className="w-5 h-5 text-violet-400" />
          </div>
          <div>
            <h4 className="text-white font-medium text-sm">{title}</h4>
            <p className="text-gray-500 text-xs">{startDate} — {endDate}</p>
          </div>
        </div>
        
        <div className={`p-1.5 rounded-lg ${impactConfig[overallImpact].bgColor}`}>
          <ImpactIcon className={`w-4 h-4 ${impactConfig[overallImpact].color}`} />
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-xs text-gray-400 mb-1.5">
          <span>Прогресс</span>
          <span>{currentDay ? `День ${currentDay} из ${totalDays}` : `${totalDays} дней`}</span>
        </div>
        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
            className="h-full bg-gradient-to-r from-violet-500 to-cyan-500 rounded-full"
          />
        </div>
      </div>

      {/* Phases */}
      <div className="space-y-2">
        <p className="text-gray-400 text-xs">Фазы события:</p>
        {phases.map((phase, index) => (
          <div
            key={index}
            className={`flex items-center justify-between p-2 rounded-lg ${
              phase.status === 'active' 
                ? 'bg-violet-500/20 border border-violet-500/30' 
                : 'bg-white/5'
            }`}
          >
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${
                phase.status === 'completed' 
                  ? 'bg-green-400' 
                  : phase.status === 'active'
                  ? 'bg-violet-400 animate-pulse'
                  : 'bg-gray-500'
              }`} />
              <span className={`text-xs ${
                phase.status === 'active' ? 'text-white' : 'text-gray-400'
              }`}>
                {phase.name}
              </span>
            </div>
            <span className="text-gray-500 text-xs">
              {phase.startDate} — {phase.endDate}
            </span>
          </div>
        ))}
      </div>

      {/* View Details */}
      <div className="flex items-center justify-end gap-1 mt-3 text-gray-400">
        <span className="text-xs">Подробнее</span>
        <ChevronRight className="w-3 h-3" />
      </div>
    </motion.button>
  );
};

export default LongEventCard;
