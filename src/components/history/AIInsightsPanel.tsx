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
    <div className="px-3 mb-2">
      <motion.div
        layout
        className="bg-card border border-border rounded-xl overflow-hidden"
      >
        {/* Compact Header */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between py-2 px-3"
        >
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary/20 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
            <span className="text-card-foreground font-medium text-sm">ИИ</span>
            <span className="text-muted-foreground text-xs">
              {pendingDetections.length}+{activeHypotheses.length}
            </span>
          </div>
          
          <div className="flex items-center gap-1.5">
            {totalInsights > 0 && (
              <span className="w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center font-medium">
                {totalInsights}
              </span>
            )}
            {isExpanded ? (
              <ChevronUp className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
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
              {/* Compact Tabs */}
              <div className="flex gap-1 px-3 pb-2">
                <button
                  onClick={() => setActiveTab('detections')}
                  className={`px-2 py-1 rounded text-[10px] font-medium transition-colors ${
                    activeTab === 'detections'
                      ? 'bg-primary/20 text-primary'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  Сигналы ({pendingDetections.length})
                </button>
                <button
                  onClick={() => setActiveTab('hypotheses')}
                  className={`px-2 py-1 rounded text-[10px] font-medium transition-colors ${
                    activeTab === 'hypotheses'
                      ? 'bg-accent/20 text-accent'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  Гипотезы ({activeHypotheses.length})
                </button>
              </div>

              {/* Content - limited height */}
              <div className="px-3 pb-2 space-y-2 max-h-[200px] overflow-y-auto">
                {activeTab === 'detections' && (
                  <>
                    {pendingDetections.length === 0 ? (
                      <p className="text-muted-foreground text-xs text-center py-2">Нет сигналов</p>
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
                      <p className="text-muted-foreground text-xs text-center py-2">Нет гипотез</p>
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
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default AIInsightsPanel;
