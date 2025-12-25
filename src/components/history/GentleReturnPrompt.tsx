import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Heart, X } from 'lucide-react';

interface GentleReturnPromptProps {
  isVisible: boolean;
  daysMissed: number;
  onDismiss: () => void;
  onCheckIn: () => void;
}

const GentleReturnPrompt: React.FC<GentleReturnPromptProps> = ({
  isVisible,
  daysMissed,
  onDismiss,
  onCheckIn,
}) => {
  const getMessage = () => {
    if (daysMissed <= 2) {
      return 'С возвращением! Как ты себя чувствуешь сегодня?';
    } else if (daysMissed <= 5) {
      return `Рада тебя видеть! Прошло ${daysMissed} дней. Готова продолжить?`;
    } else if (daysMissed <= 14) {
      return 'Привет! Без давления — просто отметь, как ты, когда будет удобно.';
    } else {
      return 'Здорово, что ты вернулась! Начнём с чистого листа?';
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="mx-4 mb-4"
        >
          <div
            className="p-4 rounded-2xl border border-violet-500/20"
            style={{
              background: 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(6,182,212,0.1))',
            }}
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500/30 to-cyan-500/30 flex items-center justify-center shrink-0">
                <Heart className="w-5 h-5 text-violet-400" />
              </div>
              
              <div className="flex-1">
                <p className="text-white text-sm leading-relaxed mb-3">
                  {getMessage()}
                </p>
                
                <div className="flex gap-2">
                  <button
                    onClick={onCheckIn}
                    className="px-4 py-2 rounded-full bg-gradient-to-r from-violet-500/30 to-cyan-500/30 text-white text-sm font-medium hover:from-violet-500/40 hover:to-cyan-500/40 transition-colors border border-violet-500/30"
                  >
                    Отметить самочувствие
                  </button>
                  <button
                    onClick={onDismiss}
                    className="px-4 py-2 rounded-full bg-white/5 text-gray-400 text-sm hover:bg-white/10 transition-colors"
                  >
                    Позже
                  </button>
                </div>
              </div>
              
              <button
                onClick={onDismiss}
                className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
              >
                <X className="w-3 h-3 text-gray-400" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default GentleReturnPrompt;
