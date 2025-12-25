import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface TimelineCardProps {
  title: string;
  date: string;
  type: 'trigger' | 'goal';
  status: string;
  icon: LucideIcon;
  side: 'left' | 'right';
  index: number;
}

const TimelineCard: React.FC<TimelineCardProps> = ({
  title,
  date,
  type,
  status,
  icon: Icon,
  side,
  index,
}) => {
  const isLeft = side === 'left';

  return (
    <motion.div
      className={`relative flex ${isLeft ? 'justify-end pr-12' : 'justify-start pl-12'} w-1/2 ${isLeft ? 'self-start' : 'self-end'}`}
      initial={{ opacity: 0, x: isLeft ? -50 : 50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: index * 0.15 }}
    >
      {/* Connection line to helix */}
      <div
        className={`absolute top-1/2 -translate-y-1/2 h-px w-8 ${isLeft ? 'right-4' : 'left-4'}`}
        style={{
          background: `linear-gradient(${isLeft ? 'to left' : 'to right'}, hsl(var(--bio-cyan)), transparent)`,
        }}
      />

      {/* Glassmorphism card */}
      <motion.div
        className="relative p-4 rounded-xl max-w-[200px] w-full cursor-pointer group"
        style={{
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        }}
        whileHover={{
          scale: 1.05,
          boxShadow: '0 8px 32px rgba(0, 255, 255, 0.2)',
        }}
        transition={{ duration: 0.2 }}
      >
        {/* Glow effect on hover */}
        <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
          style={{
            background: 'linear-gradient(135deg, rgba(0, 255, 255, 0.1), rgba(139, 92, 246, 0.1))',
          }}
        />

        <div className="relative z-10">
          {/* Icon */}
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-bio-cyan/20 to-bio-purple/20 flex items-center justify-center mb-3 border border-bio-cyan/30">
            <Icon className="w-5 h-5 text-bio-cyan" />
          </div>

          {/* Title */}
          <h3 className="font-orbitron font-bold text-foreground text-sm mb-1">{title}</h3>

          {/* Date */}
          <p className="text-xs text-muted-foreground font-exo mb-2">{date}</p>

          {/* Tags */}
          <div className="flex flex-wrap gap-1">
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-exo ${
                type === 'trigger'
                  ? 'bg-bio-purple/20 text-bio-purple border border-bio-purple/30'
                  : 'bg-bio-cyan/20 text-bio-cyan border border-bio-cyan/30'
              }`}
            >
              {type}
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 font-exo">
              {status}
            </span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default TimelineCard;
