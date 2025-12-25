import React from 'react';
import { motion } from 'framer-motion';
import { Moon, Brain, Activity, Heart } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface SectionNowProps {
  data: {
    sleep: number;
    mood: number;
    stress: number;
    heartRate: number;
  };
}

const SectionNow: React.FC<SectionNowProps> = ({ data }) => {
  const { t } = useLanguage();

  const metrics = [
    { 
      icon: Moon, 
      label: t('sleep'), 
      value: `${data.sleep}h`, 
      color: 'bio-cyan',
      bgColor: 'bg-bio-cyan/20',
      borderColor: 'border-bio-cyan/30',
    },
    { 
      icon: Brain, 
      label: t('mood'), 
      value: `${data.mood}%`, 
      color: 'golden',
      bgColor: 'bg-golden/20',
      borderColor: 'border-golden/30',
    },
    { 
      icon: Activity, 
      label: t('stress'), 
      value: `${data.stress}%`, 
      color: data.stress > 50 ? 'bio-magenta' : 'bio-cyan',
      bgColor: data.stress > 50 ? 'bg-bio-magenta/20' : 'bg-bio-cyan/20',
      borderColor: data.stress > 50 ? 'border-bio-magenta/30' : 'border-bio-cyan/30',
    },
    { 
      icon: Heart, 
      label: t('heartRate'), 
      value: `${data.heartRate}`, 
      color: 'bio-magenta',
      bgColor: 'bg-bio-magenta/20',
      borderColor: 'border-bio-magenta/30',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {metrics.map((metric, index) => {
        const Icon = metric.icon;
        return (
          <motion.div
            key={metric.label}
            className={`rounded-[24px] ${metric.bgColor} backdrop-blur-xl border ${metric.borderColor} p-4`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <div className="flex items-center gap-2 mb-2">
              <Icon className={`w-4 h-4 text-${metric.color}`} />
              <span className="text-xs font-exo text-muted-foreground">{metric.label}</span>
            </div>
            <p className={`text-2xl font-orbitron font-bold text-${metric.color}`}>
              {metric.value}
            </p>
          </motion.div>
        );
      })}
    </div>
  );
};

export default SectionNow;
