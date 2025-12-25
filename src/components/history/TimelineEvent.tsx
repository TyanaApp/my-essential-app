import React, { useState } from 'react';
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { LucideIcon, Trash2, Star, TrendingUp, TrendingDown, Minus, CheckCircle, HelpCircle, AlertCircle } from 'lucide-react';

export type EventType = 'trigger' | 'symptom' | 'cycle' | 'medication' | 'appointment' | 'goal' | 'intervention' | 'outcome';

export interface TimelineEventData {
  id?: string;
  title: string;
  date: string;
  type: EventType;
  status: string;
  icon: LucideIcon;
  iconName: string;
  side: 'left' | 'right';
  impact?: string;
  confidence?: 'high' | 'medium' | 'low';
  isImportant?: boolean;
}

interface TimelineEventProps extends TimelineEventData {
  index: number;
  onClick: () => void;
  onDelete?: (id: string) => void;
  onLongPress?: () => void;
}

const typeColors: Record<EventType, string> = {
  trigger: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  symptom: 'bg-red-500/20 text-red-400 border-red-500/30',
  cycle: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
  medication: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  appointment: 'bg-green-500/20 text-green-400 border-green-500/30',
  goal: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  intervention: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  outcome: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
};

const typeLabels: Record<EventType, string> = {
  trigger: 'Триггер',
  symptom: 'Симптом',
  cycle: 'Цикл',
  medication: 'Лекарство',
  appointment: 'Визит',
  goal: 'Цель',
  intervention: 'Интервенция',
  outcome: 'Результат',
};

const ConfidenceIcon = ({ confidence }: { confidence?: 'high' | 'medium' | 'low' }) => {
  if (confidence === 'high') return <CheckCircle className="w-3 h-3 text-green-400" />;
  if (confidence === 'medium') return <HelpCircle className="w-3 h-3 text-yellow-400" />;
  if (confidence === 'low') return <AlertCircle className="w-3 h-3 text-orange-400" />;
  return null;
};

const ImpactTrend = ({ impact }: { impact?: string }) => {
  if (!impact) return null;
  const isUp = impact.includes('↑');
  const isDown = impact.includes('↓');
  
  return (
    <div className="flex items-center gap-1 text-[10px] text-gray-400">
      {isUp && <TrendingUp className="w-3 h-3 text-red-400" />}
      {isDown && <TrendingDown className="w-3 h-3 text-blue-400" />}
      {!isUp && !isDown && <Minus className="w-3 h-3" />}
      <span>{impact}</span>
    </div>
  );
};

const TimelineEvent: React.FC<TimelineEventProps> = ({
  id,
  title,
  date,
  type,
  status,
  icon: Icon,
  side,
  index,
  impact,
  confidence,
  isImportant,
  onClick,
  onDelete,
  onLongPress,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const x = useMotionValue(0);
  const deleteOpacity = useTransform(x, side === 'left' ? [-100, -50] : [50, 100], [0, 1]);
  const cardOpacity = useTransform(x, side === 'left' ? [-150, 0] : [0, 150], side === 'left' ? [0.5, 1] : [1, 0.5]);

  const handleDragEnd = (_: any, info: PanInfo) => {
    setIsDragging(false);
    const threshold = 100;
    const offset = info.offset.x;

    if ((side === 'left' && offset < -threshold) || (side === 'right' && offset > threshold)) {
      if (id && onDelete) {
        onDelete(id);
      }
    }
  };

  const canSwipeDelete = !!id && !!onDelete;
  const longPressTimeout = React.useRef<NodeJS.Timeout>();

  const handlePointerDown = () => {
    if (onLongPress) {
      longPressTimeout.current = setTimeout(onLongPress, 500);
    }
  };

  const handlePointerUp = () => {
    if (longPressTimeout.current) {
      clearTimeout(longPressTimeout.current);
    }
  };

  return (
    <div className={`relative ${side === 'right' ? 'ml-auto' : 'mr-auto'}`}>
      {canSwipeDelete && (
        <motion.div
          className={`absolute inset-0 flex items-center ${side === 'left' ? 'justify-start pl-2' : 'justify-end pr-2'}`}
          style={{ opacity: deleteOpacity }}
        >
          <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
            <Trash2 className="w-5 h-5 text-red-400" />
          </div>
        </motion.div>
      )}

      <motion.div
        className="cursor-pointer relative"
        initial={{ opacity: 0, x: side === 'left' ? -30 : 30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: index * 0.05 }}
        style={{ x, opacity: cardOpacity }}
        drag={canSwipeDelete ? 'x' : false}
        dragConstraints={{ left: side === 'left' ? -150 : 0, right: side === 'left' ? 0 : 150 }}
        dragElastic={0.2}
        onDragStart={() => setIsDragging(true)}
        onDragEnd={handleDragEnd}
        onClick={() => !isDragging && onClick()}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        whileHover={!isDragging ? { scale: 1.02 } : {}}
        whileTap={!isDragging ? { scale: 0.98 } : {}}
      >
        <div
          className="relative p-3 rounded-2xl shadow-lg w-[140px] transition-shadow hover:shadow-xl"
          style={{
            background: 'linear-gradient(180deg, #FFFFFF 0%, #F8F6F4 100%)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          }}
        >
          {isImportant && (
            <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-yellow-400 flex items-center justify-center">
              <Star className="w-3 h-3 text-white" fill="white" />
            </div>
          )}

          <div className="flex flex-col items-center text-center gap-0.5">
            <div className="w-8 h-8 flex items-center justify-center mb-1">
              <Icon className="w-6 h-6 text-gray-700" strokeWidth={1.5} />
            </div>

            <h3 className="font-semibold text-gray-900 text-xs leading-tight line-clamp-2">{title}</h3>

            <span className={`text-[9px] px-1.5 py-0.5 rounded-full border ${typeColors[type]}`}>
              {typeLabels[type]}
            </span>

            <span className="text-lg font-bold text-gray-900 mt-1">{date}</span>

            {impact && <ImpactTrend impact={impact} />}

            <div className="flex items-center gap-1 mt-0.5">
              <span className="text-[10px] text-gray-500">{status}</span>
              <ConfidenceIcon confidence={confidence} />
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default TimelineEvent;
