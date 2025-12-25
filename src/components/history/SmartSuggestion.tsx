import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, HelpCircle } from 'lucide-react';

interface SmartSuggestionProps {
  isVisible: boolean;
  onDismiss: () => void;
  onAccept: () => void;
  onExplain: () => void;
  message: string;
}

const SmartSuggestion: React.FC<SmartSuggestionProps> = ({
  isVisible,
  onDismiss,
  onAccept,
  onExplain,
  message,
}) => {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 30 }}
          className="fixed bottom-20 left-3 right-3 z-40"
        >
          <div className="p-3 rounded-xl shadow-xl bg-primary border border-primary/50 backdrop-blur-md">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary-foreground shrink-0" />
              <p className="text-primary-foreground text-xs flex-1 line-clamp-2">{message}</p>
              <div className="flex gap-1 shrink-0">
                <button
                  onClick={onAccept}
                  className="px-2 py-1 rounded bg-primary-foreground text-primary text-xs font-medium"
                >
                  Да
                </button>
                <button
                  onClick={onDismiss}
                  className="px-2 py-1 rounded bg-primary-foreground/20 text-primary-foreground text-xs"
                >
                  Нет
                </button>
                <button
                  onClick={onExplain}
                  className="p-1 rounded bg-primary-foreground/20 text-primary-foreground"
                >
                  <HelpCircle className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SmartSuggestion;
