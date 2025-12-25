import React from 'react';
import { motion } from 'framer-motion';
import { Plus, Smile, Sparkles } from 'lucide-react';

interface EmptyTimelineProps {
  onAddEvent: () => void;
  onCheckIn: () => void;
}

const EmptyTimeline: React.FC<EmptyTimelineProps> = ({ onAddEvent, onCheckIn }) => {
  return (
    <motion.div
      className="flex flex-col items-center justify-center py-16 px-8 text-center"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-bio-purple/20 to-bio-cyan/20 flex items-center justify-center mb-6">
        <Sparkles className="w-10 h-10 text-bio-cyan" />
      </div>
      
      <h2 className="text-xl font-semibold text-white mb-3">
        Здесь будет память твоего тела
      </h2>
      
      <p className="text-gray-400 text-sm leading-relaxed mb-8 max-w-xs">
        Добавь 1–2 события или отметь самочувствие — и мы начнём находить связи.
      </p>
      
      <div className="flex gap-3">
        <motion.button
          onClick={onCheckIn}
          className="flex items-center gap-2 px-5 py-3 rounded-xl bg-white/10 text-white font-medium hover:bg-white/20 transition-colors"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Smile className="w-4 h-4" />
          Отметить самочувствие
        </motion.button>
        
        <motion.button
          onClick={onAddEvent}
          className="flex items-center gap-2 px-5 py-3 rounded-xl text-white font-medium transition-opacity hover:opacity-90"
          style={{
            background: 'linear-gradient(135deg, hsl(var(--bio-purple)), hsl(var(--bio-cyan)))',
          }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Plus className="w-4 h-4" />
          Добавить событие
        </motion.button>
      </div>
    </motion.div>
  );
};

export default EmptyTimeline;
