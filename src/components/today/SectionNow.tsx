import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Moon, Brain, Activity, HelpCircle, X, TrendingUp, TrendingDown, Sparkles } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import EnergyRing from './EnergyRing';

interface SectionNowProps {
  data: {
    sleep: number;
    mood: number;
    stress: number;
    heartRate: number;
  };
  energyLevel: number;
}

const SectionNow: React.FC<SectionNowProps> = ({ data, energyLevel }) => {
  const { t } = useLanguage();
  const [showWhyModal, setShowWhyModal] = useState(false);

  const metrics = [
    { 
      icon: Moon, 
      label: t('sleep'), 
      value: `${data.sleep}h`, 
      trend: 'up',
      trendValue: '+0.5h',
      color: 'bio-cyan',
    },
    { 
      icon: Activity, 
      label: t('stress'), 
      value: `${Math.round(data.stress / 20)}/5`, 
      trend: 'down',
      trendValue: '-1',
      color: data.stress > 50 ? 'bio-magenta' : 'bio-cyan',
    },
    { 
      icon: Brain, 
      label: t('mood'), 
      value: `${Math.round(data.mood / 10)}/10`, 
      trend: 'up',
      trendValue: '+2',
      color: 'golden',
    },
  ];

  const focusTips = [
    t('goToBedEarly'),
    t('walk20min'),
    t('limitCaffeine'),
  ];

  const energyFactors = [
    { text: t('sleepImpact'), positive: true },
    { text: t('stressImpact'), positive: true },
    { text: t('cycleImpact'), positive: true },
  ];

  return (
    <div className="space-y-4">
      {/* Energy Ring with Why button */}
      <div className="relative flex justify-center mb-6">
        <EnergyRing value={energyLevel} label={t('energy')} />
        <motion.button
          onClick={() => setShowWhyModal(true)}
          className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center gap-1 px-3 py-1.5 rounded-full bg-surface/50 backdrop-blur-xl border border-bio-cyan/30 text-bio-cyan text-xs font-orbitron hover:bg-bio-cyan/20 transition-all"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <HelpCircle className="w-3.5 h-3.5" />
          {t('why')}
        </motion.button>
      </div>

      {/* Three metrics cards */}
      <div className="grid grid-cols-3 gap-2">
        {metrics.map((metric, index) => {
          const Icon = metric.icon;
          const TrendIcon = metric.trend === 'up' ? TrendingUp : TrendingDown;
          return (
            <motion.div
              key={metric.label}
              className={`rounded-[20px] bg-surface/50 backdrop-blur-xl border border-${metric.color}/30 p-3`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="flex items-center gap-1.5 mb-1.5">
                <Icon className={`w-3.5 h-3.5 text-${metric.color}`} />
                <span className="text-[10px] font-exo text-muted-foreground truncate">{metric.label}</span>
              </div>
              <p className={`text-lg font-numbers font-bold neon-number`}>
                {metric.value}
              </p>
              <div className={`flex items-center gap-1 mt-1 text-[10px] font-numbers ${metric.trend === 'up' ? 'text-bio-cyan neon-glow-cyan' : 'text-bio-magenta neon-glow-magenta'}`}>
                <TrendIcon className="w-3 h-3" />
                <span>{metric.trendValue}</span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Today's Focus card */}
      <motion.div
        className="rounded-[24px] bg-gradient-to-br from-bio-cyan/10 to-bio-magenta/10 backdrop-blur-xl border border-bio-cyan/20 p-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-golden" />
          <span className="text-sm font-nasa font-semibold text-foreground">{t('todaysFocus')}</span>
        </div>
        <p className="text-base font-exo font-medium text-foreground mb-3">
          {t('mainAdvice')}
        </p>
        <div className="space-y-2">
          {focusTips.map((tip, index) => (
            <div key={index} className="flex items-center gap-2 text-sm text-muted-foreground font-exo">
              <div className="w-1.5 h-1.5 rounded-full bg-bio-cyan" />
              <span>{tip}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Why modal */}
      <AnimatePresence>
        {showWhyModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div 
              className="absolute inset-0 bg-background/80 backdrop-blur-xl"
              onClick={() => setShowWhyModal(false)}
            />
            <motion.div
              className="relative w-full max-w-sm rounded-[24px] bg-surface/90 backdrop-blur-xl border border-bio-cyan/30 p-5 shadow-[0_0_40px_rgba(0,255,255,0.15)]"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
            >
              <button
                onClick={() => setShowWhyModal(false)}
                className="absolute top-4 right-4 p-1 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              
              <div className="text-center mb-4">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-bio-cyan/20 mb-2">
                  <HelpCircle className="w-5 h-5 text-bio-cyan" />
                </div>
                <h3 className="text-base font-orbitron font-bold text-foreground">
                  {t('energyExplanation')}
                </h3>
              </div>

              <div className="space-y-3">
                {energyFactors.map((factor, index) => (
                  <motion.div
                    key={index}
                    className={`rounded-[16px] p-3 ${factor.positive ? 'bg-bio-cyan/10 border border-bio-cyan/20' : 'bg-bio-magenta/10 border border-bio-magenta/20'}`}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <span className={`text-sm font-exo ${factor.positive ? 'text-bio-cyan' : 'text-bio-magenta'}`}>
                      {factor.text}
                    </span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SectionNow;