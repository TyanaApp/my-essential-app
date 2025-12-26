import { motion } from 'framer-motion';
import { TrendingUp, Target, AlertTriangle, ChevronRight, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

export type EventType = 'trigger' | 'goal' | 'stress_peak';

export interface GlassEventCardProps {
  id: string;
  title: string;
  date: string;
  type: EventType;
  status?: string;
  side: 'left' | 'right';
  index: number;
  isSelected?: boolean;
  onClick: () => void;
}

const typeConfig = {
  trigger: {
    icon: TrendingUp,
    label: 'Trigger',
    gradient: 'from-rose-500/20 to-orange-500/20',
    borderColor: 'border-rose-500/40',
    glowColor: 'shadow-rose-500/20',
    iconBg: 'bg-rose-500/30',
    textColor: 'text-rose-300',
  },
  goal: {
    icon: Target,
    label: 'Goal',
    gradient: 'from-emerald-500/20 to-teal-500/20',
    borderColor: 'border-emerald-500/40',
    glowColor: 'shadow-emerald-500/20',
    iconBg: 'bg-emerald-500/30',
    textColor: 'text-emerald-300',
  },
  stress_peak: {
    icon: AlertTriangle,
    label: 'Stress Peak',
    gradient: 'from-amber-500/20 to-yellow-500/20',
    borderColor: 'border-amber-500/40',
    glowColor: 'shadow-amber-500/20',
    iconBg: 'bg-amber-500/30',
    textColor: 'text-amber-300',
  },
};

const GlassEventCard = ({
  id,
  title,
  date,
  type,
  status,
  side,
  index,
  isSelected,
  onClick,
}: GlassEventCardProps) => {
  const config = typeConfig[type];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, x: side === 'left' ? -50 : 50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{ scale: 1.02, x: side === 'left' ? 5 : -5 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        'relative cursor-pointer group',
        'p-4 rounded-2xl',
        'backdrop-blur-xl',
        'bg-gradient-to-br',
        config.gradient,
        'border',
        config.borderColor,
        'shadow-lg',
        config.glowColor,
        isSelected && 'ring-2 ring-white/50',
        'transition-all duration-300'
      )}
    >
      {/* Glass highlight effect */}
      <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
      </div>

      <div className="relative z-10 flex items-start gap-3">
        {/* Icon */}
        <div className={cn(
          'flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center',
          config.iconBg,
          'backdrop-blur-sm'
        )}>
          <Icon className={cn('w-5 h-5', config.textColor)} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={cn(
              'text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-full',
              config.iconBg,
              config.textColor
            )}>
              {config.label}
            </span>
          </div>
          
          <h3 className="text-white font-medium text-sm truncate mb-1 group-hover:text-white/90">
            {title}
          </h3>
          
          <div className="flex items-center gap-1 text-white/50 text-xs">
            <Calendar className="w-3 h-3" />
            <span>{date}</span>
          </div>
          
          {status && (
            <p className="text-white/40 text-xs mt-1 truncate">{status}</p>
          )}
        </div>

        {/* Arrow indicator */}
        <ChevronRight className={cn(
          'w-4 h-4 text-white/30 transition-all duration-300',
          'group-hover:text-white/60 group-hover:translate-x-1'
        )} />
      </div>

      {/* Animated border glow on hover */}
      <motion.div
        className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{
          background: `linear-gradient(90deg, transparent, ${type === 'trigger' ? 'rgba(244,63,94,0.2)' : type === 'goal' ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.2)'}, transparent)`,
        }}
      />
    </motion.div>
  );
};

export default GlassEventCard;
