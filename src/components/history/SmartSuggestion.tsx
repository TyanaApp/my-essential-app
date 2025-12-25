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
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.9 }}
          className="fixed bottom-24 left-4 right-4 z-40"
        >
          <div
            className="p-4 rounded-2xl shadow-2xl"
            style={{
              background: 'linear-gradient(135deg, rgba(139,92,246,0.95), rgba(6,182,212,0.9))',
              backdropFilter: 'blur(10px)',
            }}
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-white text-sm leading-relaxed mb-3">
                  {message}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={onAccept}
                    className="px-4 py-1.5 rounded-full bg-white text-bio-purple text-sm font-medium hover:bg-white/90 transition-colors"
                  >
                    Да
                  </button>
                  <button
                    onClick={onDismiss}
                    className="px-4 py-1.5 rounded-full bg-white/20 text-white text-sm font-medium hover:bg-white/30 transition-colors"
                  >
                    Не сейчас
                  </button>
                  <button
                    onClick={onExplain}
                    className="p-1.5 rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors"
                  >
                    <HelpCircle className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <button
                onClick={onDismiss}
                className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
              >
                <X className="w-3 h-3 text-white" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SmartSuggestion;
