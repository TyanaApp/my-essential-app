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
        className="bg-card border border-border rounded-2xl overflow-hidden"
      >
        {/* Header */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between p-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div className="text-left">
              <h3 className="text-card-foreground font-medium text-sm">ИИ-наблюдения</h3>
              <p className="text-muted-foreground text-xs">
                {pendingDetections.length} обнаружений • {activeHypotheses.length} гипотез
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {totalInsights > 0 && (
              <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-medium">
                {totalInsights}
              </span>
            )}
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-5 h-5 text-muted-foreground" />
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
                      ? 'bg-primary/20 text-primary'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  Обнаружения ({pendingDetections.length})
                </button>
                <button
                  onClick={() => setActiveTab('hypotheses')}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    activeTab === 'hypotheses'
                      ? 'bg-accent/20 text-accent'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
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
                        <AlertCircle className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-muted-foreground text-sm">Нет новых обнаружений</p>
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
                        <AlertCircle className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-muted-foreground text-sm">Пока нет гипотез</p>
                        <p className="text-muted-foreground/70 text-xs mt-1">
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
                <p className="text-muted-foreground text-xs text-center">
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
