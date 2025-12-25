import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  ChevronUp, 
  ChevronDown,
  AlertCircle
} from 'lucide-react';
import AIDetectionCard, { DetectionType } from './AIDetectionCard';
import HypothesisCard from './HypothesisCard';

interface Detection {
  id: string;
  type: DetectionType;
  title: string;
  description: string;
  confidence: 'high' | 'medium' | 'low';
  detectedAt: string;
}

interface Hypothesis {
  id: string;
  cause: string;
  effect: string;
  lag: string;
  occurrences: number;
  totalCases: number;
  confidence: 'high' | 'medium' | 'low';
  explanation: string;
  userFeedback?: 'confirmed' | 'denied' | null;
}

interface AIInsightsPanelProps {
  detections: Detection[];
  hypotheses: Hypothesis[];
  onConfirmDetection: (id: string) => void;
  onDenyDetection: (id: string) => void;
  onDetectionDetails: (id: string) => void;
  onConfirmHypothesis: (id: string) => void;
  onDenyHypothesis: (id: string) => void;
}

const AIInsightsPanel: React.FC<AIInsightsPanelProps> = ({
  detections,
  hypotheses,
  onConfirmDetection,
  onDenyDetection,
  onDetectionDetails,
  onConfirmHypothesis,
  onDenyHypothesis,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [activeTab, setActiveTab] = useState<'detections' | 'hypotheses'>('detections');

  const pendingDetections = detections.filter(d => d.confidence !== 'low');
  const activeHypotheses = hypotheses.filter(h => h.userFeedback !== 'denied');

  const totalInsights = pendingDetections.length + activeHypotheses.length;

  if (totalInsights === 0) return null;

  return (
    <div className="px-4 mb-4">
      <motion.div
        layout
        className="bg-gradient-to-br from-violet-500/10 to-cyan-500/10 border border-violet-500/20 rounded-2xl overflow-hidden"
      >
        {/* Header */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between p-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/30 to-cyan-500/30 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-violet-400" />
            </div>
            <div className="text-left">
              <h3 className="text-white font-medium text-sm">ИИ-наблюдения</h3>
              <p className="text-gray-400 text-xs">
                {pendingDetections.length} обнаружений • {activeHypotheses.length} гипотез
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {totalInsights > 0 && (
              <span className="w-5 h-5 rounded-full bg-violet-500 text-white text-xs flex items-center justify-center font-medium">
                {totalInsights}
              </span>
            )}
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </div>
        </button>

        {/* Content */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              {/* Tabs */}
              <div className="flex gap-2 px-4 pb-3">
                <button
                  onClick={() => setActiveTab('detections')}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    activeTab === 'detections'
                      ? 'bg-violet-500/30 text-violet-300'
                      : 'bg-white/5 text-gray-400 hover:bg-white/10'
                  }`}
                >
                  Обнаружения ({pendingDetections.length})
                </button>
                <button
                  onClick={() => setActiveTab('hypotheses')}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    activeTab === 'hypotheses'
                      ? 'bg-cyan-500/30 text-cyan-300'
                      : 'bg-white/5 text-gray-400 hover:bg-white/10'
                  }`}
                >
                  Гипотезы ({activeHypotheses.length})
                </button>
              </div>

              {/* Content */}
              <div className="px-4 pb-4 space-y-3 max-h-[400px] overflow-y-auto">
                {activeTab === 'detections' && (
                  <>
                    {pendingDetections.length === 0 ? (
                      <div className="text-center py-6">
                        <AlertCircle className="w-8 h-8 text-gray-500 mx-auto mb-2" />
                        <p className="text-gray-400 text-sm">Нет новых обнаружений</p>
                      </div>
                    ) : (
                      pendingDetections.map(detection => (
                        <AIDetectionCard
                          key={detection.id}
                          {...detection}
                          onConfirm={onConfirmDetection}
                          onDeny={onDenyDetection}
                          onDetails={onDetectionDetails}
                        />
                      ))
                    )}
                  </>
                )}

                {activeTab === 'hypotheses' && (
                  <>
                    {activeHypotheses.length === 0 ? (
                      <div className="text-center py-6">
                        <AlertCircle className="w-8 h-8 text-gray-500 mx-auto mb-2" />
                        <p className="text-gray-400 text-sm">Пока нет гипотез</p>
                        <p className="text-gray-500 text-xs mt-1">
                          Добавь больше данных, и ИИ найдёт связи
                        </p>
                      </div>
                    ) : (
                      activeHypotheses.map(hypothesis => (
                        <HypothesisCard
                          key={hypothesis.id}
                          {...hypothesis}
                          onConfirm={onConfirmHypothesis}
                          onDeny={onDenyHypothesis}
                        />
                      ))
                    )}
                  </>
                )}
              </div>

              {/* Disclaimer */}
              <div className="px-4 pb-4">
                <p className="text-gray-500 text-xs text-center">
                  Это гипотезы ИИ, не медицинские диагнозы. Твоя обратная связь улучшает точность.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default AIInsightsPanel;
