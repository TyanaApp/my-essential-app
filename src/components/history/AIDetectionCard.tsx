import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AlertTriangle, 
  Moon, 
  Activity, 
  Thermometer,
  Heart,
  Check,
  X,
  ChevronRight
} from 'lucide-react';

export type DetectionType = 'stress_peak' | 'poor_sleep' | 'cold_signs' | 'pms_window' | 'low_energy' | 'pain_pattern';

interface AIDetectionCardProps {
  id: string;
  type: DetectionType;
  title: string;
  description: string;
  confidence: 'high' | 'medium' | 'low';
  detectedAt: string;
  onConfirm: (id: string) => void;
  onDeny: (id: string) => void;
  onDetails: (id: string) => void;
}

const typeConfig: Record<DetectionType, { icon: React.ElementType; color: string; bgColor: string }> = {
  stress_peak: { icon: Activity, color: 'text-red-400', bgColor: 'bg-red-500/20' },
  poor_sleep: { icon: Moon, color: 'text-indigo-400', bgColor: 'bg-indigo-500/20' },
  cold_signs: { icon: Thermometer, color: 'text-orange-400', bgColor: 'bg-orange-500/20' },
  pms_window: { icon: Heart, color: 'text-pink-400', bgColor: 'bg-pink-500/20' },
  low_energy: { icon: AlertTriangle, color: 'text-yellow-400', bgColor: 'bg-yellow-500/20' },
  pain_pattern: { icon: AlertTriangle, color: 'text-red-400', bgColor: 'bg-red-500/20' },
};

const confidenceLabels: Record<string, { label: string; color: string }> = {
  high: { label: 'Высокая', color: 'text-green-400' },
  medium: { label: 'Средняя', color: 'text-yellow-400' },
  low: { label: 'Низкая', color: 'text-gray-400' },
};

const AIDetectionCard: React.FC<AIDetectionCardProps> = ({
  id,
  type,
  title,
  description,
  confidence,
  detectedAt,
  onConfirm,
  onDeny,
  onDetails,
}) => {
  const config = typeConfig[type];
  const Icon = config.icon;
  const confLabel = confidenceLabels[confidence];

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-sm"
    >
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-xl ${config.bgColor} flex items-center justify-center shrink-0`}>
          <Icon className={`w-5 h-5 ${config.color}`} />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-white font-medium text-sm truncate">{title}</h4>
            <span className={`text-xs ${confLabel.color}`}>• {confLabel.label}</span>
          </div>
          
          <p className="text-gray-400 text-xs leading-relaxed mb-3">
            {description}
          </p>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => onConfirm(id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-500/20 text-green-400 text-xs font-medium hover:bg-green-500/30 transition-colors"
            >
              <Check className="w-3 h-3" />
              Да, верно
            </button>
            
            <button
              onClick={() => onDeny(id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-500/20 text-red-400 text-xs font-medium hover:bg-red-500/30 transition-colors"
            >
              <X className="w-3 h-3" />
              Нет
            </button>
            
            <button
              onClick={() => onDetails(id)}
              className="ml-auto p-1.5 rounded-full bg-white/5 text-gray-400 hover:bg-white/10 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
      
      <div className="mt-3 pt-3 border-t border-white/5">
        <span className="text-gray-500 text-xs">Обнаружено: {detectedAt}</span>
      </div>
    </motion.div>
  );
};

export default AIDetectionCard;
