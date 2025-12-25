import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, AlertTriangle, Sparkles } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';

interface CyclePhase {
  name: string;
  days: number;
  color: string;
  isRisk?: boolean;
}

interface KeyMoment {
  label: string;
  daysUntil: number;
  type: 'pms' | 'ovulation' | 'period';
}

interface SectionSoonProps {
  onPreparePlan: () => void;
}

const SectionSoon: React.FC<SectionSoonProps> = ({ onPreparePlan }) => {
  const { t } = useLanguage();

  const cyclePhases: CyclePhase[] = [
    { name: t('follicular'), days: 7, color: 'bg-bio-cyan' },
    { name: t('ovulation'), days: 3, color: 'bg-golden' },
    { name: t('luteal'), days: 10, color: 'bg-bio-magenta/60', isRisk: true },
    { name: t('menstrual'), days: 5, color: 'bg-bio-magenta' },
  ];

  const keyMoments: KeyMoment[] = [
    { label: t('pmsIn'), daysUntil: 2, type: 'pms' },
    { label: t('ovulationIn'), daysUntil: 9, type: 'ovulation' },
    { label: t('periodIn'), daysUntil: 14, type: 'period' },
  ];

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'pms': return 'text-bio-magenta border-bio-magenta/30 bg-bio-magenta/10';
      case 'ovulation': return 'text-golden border-golden/30 bg-golden/10';
      case 'period': return 'text-bio-magenta border-bio-magenta/30 bg-bio-magenta/10';
      default: return 'text-muted-foreground border-border bg-surface/50';
    }
  };

  const totalDays = cyclePhases.reduce((sum, phase) => sum + phase.days, 0);

  return (
    <div className="space-y-5">
      {/* Cycle Timeline */}
      <motion.div
        className="rounded-[24px] bg-surface/50 backdrop-blur-xl border border-border/50 p-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-4 h-4 text-bio-cyan" />
          <span className="text-sm font-nasa font-semibold text-foreground">{t('cycleTimeline')}</span>
        </div>

        {/* Timeline bar */}
        <div className="relative h-8 rounded-full overflow-hidden flex mb-3">
          {cyclePhases.map((phase, index) => (
            <motion.div
              key={phase.name}
              className={`relative h-full ${phase.color} flex items-center justify-center`}
              style={{ width: `${(phase.days / totalDays) * 100}%` }}
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: index * 0.1, duration: 0.3 }}
            >
              {phase.isRisk && (
                <AlertTriangle className="w-3 h-3 text-white/80" />
              )}
            </motion.div>
          ))}
          {/* Current position indicator */}
          <motion.div
            className="absolute top-0 bottom-0 w-1 bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)]"
            style={{ left: '28%' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          />
        </div>

        {/* Phase labels */}
        <div className="flex text-[9px] font-exo text-muted-foreground">
          {cyclePhases.map((phase) => (
            <div 
              key={phase.name} 
              className="text-center truncate"
              style={{ width: `${(phase.days / totalDays) * 100}%` }}
            >
              {phase.name}
            </div>
          ))}
        </div>
      </motion.div>

      {/* Key Moments */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-golden" />
          <span className="text-sm font-nasa font-semibold text-foreground">{t('nextKeyMoments')}</span>
        </div>

        <div className="space-y-2">
          {keyMoments.map((moment, index) => (
            <motion.div
              key={moment.type}
              className={`rounded-[16px] border p-3 flex items-center justify-between ${getTypeColor(moment.type)}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + index * 0.1 }}
            >
              <span className="text-sm font-exo">{moment.label}</span>
              <span className="font-numbers font-bold neon-number">
                {moment.daysUntil} {t('days')}
              </span>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Prepare Plan button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Button
          onClick={onPreparePlan}
          className="w-full rounded-[20px] h-12 bg-gradient-to-r from-bio-cyan to-bio-magenta text-white font-nasa font-semibold hover:opacity-90 transition-opacity"
        >
          {t('preparePlan')}
        </Button>
      </motion.div>
    </div>
  );
};

export default SectionSoon;