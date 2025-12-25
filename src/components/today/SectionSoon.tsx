import React from 'react';
import { motion } from 'framer-motion';
import { Clock, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface Prediction {
  time: string;
  energyChange: 'up' | 'down' | 'stable';
  reason: string;
}

interface SectionSoonProps {
  predictions: Prediction[];
}

const SectionSoon: React.FC<SectionSoonProps> = ({ predictions }) => {
  const { t } = useLanguage();

  const getTrendIcon = (change: string) => {
    switch (change) {
      case 'up': return <TrendingUp className="w-4 h-4 text-bio-cyan" />;
      case 'down': return <TrendingDown className="w-4 h-4 text-bio-magenta" />;
      default: return <Minus className="w-4 h-4 text-golden" />;
    }
  };

  const getTrendColor = (change: string) => {
    switch (change) {
      case 'up': return 'border-bio-cyan/30 bg-bio-cyan/10';
      case 'down': return 'border-bio-magenta/30 bg-bio-magenta/10';
      default: return 'border-golden/30 bg-golden/10';
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="w-4 h-4 text-bio-cyan" />
        <span className="text-sm font-orbitron text-muted-foreground">{t('nextHours')}</span>
      </div>
      
      {predictions.map((prediction, index) => (
        <motion.div
          key={prediction.time}
          className={`rounded-[24px] backdrop-blur-xl border p-4 ${getTrendColor(prediction.energyChange)}`}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getTrendIcon(prediction.energyChange)}
              <div>
                <p className="font-orbitron font-semibold text-foreground text-sm">
                  {prediction.time}
                </p>
                <p className="text-xs text-muted-foreground font-exo">
                  {prediction.reason}
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default SectionSoon;
