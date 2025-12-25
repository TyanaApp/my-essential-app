import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Lightbulb, 
  ThumbsUp, 
  ThumbsDown,
  ChevronDown,
  ChevronUp,
  Link2,
  Clock
} from 'lucide-react';

interface HypothesisCardProps {
  id: string;
  cause: string;
  effect: string;
  lag: string;
  occurrences: number;
  totalCases: number;
  confidence: 'high' | 'medium' | 'low';
  explanation: string;
  onConfirm: (id: string) => void;
  onDeny: (id: string) => void;
  userFeedback?: 'confirmed' | 'denied' | null;
}

const HypothesisCard: React.FC<HypothesisCardProps> = ({
  id,
  cause,
  effect,
  lag,
  occurrences,
  totalCases,
  confidence,
  explanation,
  onConfirm,
  onDeny,
  userFeedback,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const confidenceColors = {
    high: 'bg-green-500/20 text-green-400 border-green-500/30',
    medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    low: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  };

  const percentage = Math.round((occurrences / totalCases) * 100);

  return (
    <motion.div
      layout
      className={`bg-white/5 border rounded-2xl overflow-hidden backdrop-blur-sm transition-colors ${
        userFeedback === 'confirmed' 
          ? 'border-green-500/30' 
          : userFeedback === 'denied'
          ? 'border-red-500/20'
          : 'border-white/10'
      }`}
    >
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start gap-3 mb-3">
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center shrink-0">
            <Lightbulb className="w-4 h-4 text-amber-400" />
          </div>
          
          <div className="flex-1">
            <div className="flex items-center gap-2 text-sm mb-1">
              <span className="text-white font-medium">{cause}</span>
              <Link2 className="w-3 h-3 text-gray-500" />
              <span className="text-cyan-400">{effect}</span>
            </div>
            
            <div className="flex items-center gap-3 text-xs text-gray-400">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Лаг: {lag}
              </span>
              <span>•</span>
              <span>{occurrences} из {totalCases} случаев ({percentage}%)</span>
            </div>
          </div>
          
          <span className={`px-2 py-0.5 rounded-full text-xs border ${confidenceColors[confidence]}`}>
            Гипотеза
          </span>
        </div>

        {/* Feedback Buttons */}
        {!userFeedback ? (
          <div className="flex items-center gap-2 mb-3">
            <span className="text-gray-400 text-xs">Это совпадает с твоим опытом?</span>
            <button
              onClick={() => onConfirm(id)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-500/20 text-green-400 text-xs font-medium hover:bg-green-500/30 transition-colors"
            >
              <ThumbsUp className="w-3 h-3" />
              Да
            </button>
            <button
              onClick={() => onDeny(id)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/10 text-gray-400 text-xs font-medium hover:bg-white/20 transition-colors"
            >
              <ThumbsDown className="w-3 h-3" />
              Нет
            </button>
          </div>
        ) : (
          <div className={`flex items-center gap-2 mb-3 text-xs ${
            userFeedback === 'confirmed' ? 'text-green-400' : 'text-gray-500'
          }`}>
            {userFeedback === 'confirmed' ? (
              <>
                <ThumbsUp className="w-3 h-3" />
                <span>Ты подтвердил(а) эту связь</span>
              </>
            ) : (
              <>
                <ThumbsDown className="w-3 h-3" />
                <span>Связь ослаблена на основе твоего отзыва</span>
              </>
            )}
          </div>
        )}

        {/* Expand Button */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-300 transition-colors"
        >
          {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          {isExpanded ? 'Скрыть детали' : 'Почему так?'}
        </button>
      </div>

      {/* Expanded Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-0">
              <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                <p className="text-gray-400 text-xs leading-relaxed">
                  {explanation}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default HypothesisCard;
