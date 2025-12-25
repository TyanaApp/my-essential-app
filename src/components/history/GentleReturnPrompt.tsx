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
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="mx-3 mb-2"
        >
          <div
            className="py-2 px-3 rounded-xl border border-violet-500/20 flex items-center gap-2"
            style={{
              background: 'linear-gradient(135deg, rgba(139,92,246,0.1), rgba(6,182,212,0.05))',
            }}
          >
            <Heart className="w-4 h-4 text-violet-400 shrink-0" />
            <p className="text-foreground text-xs flex-1">{getMessage()}</p>
            <button
              onClick={onCheckIn}
              className="px-2 py-1 rounded-lg bg-violet-500/20 text-violet-300 text-xs font-medium hover:bg-violet-500/30 transition-colors"
            >
              Чек-ин
            </button>
            <button
              onClick={onDismiss}
              className="w-5 h-5 rounded-full bg-muted/50 flex items-center justify-center hover:bg-muted transition-colors"
            >
              <X className="w-3 h-3 text-muted-foreground" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default GentleReturnPrompt;
