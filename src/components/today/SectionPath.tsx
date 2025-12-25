import React from 'react';
import { motion } from 'framer-motion';
import { Target, CheckCircle, Circle } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface Goal {
  id: string;
  title: string;
  completed: boolean;
  impact: 'high' | 'medium' | 'low';
}

interface SectionPathProps {
  goals: Goal[];
  onToggleGoal: (id: string) => void;
}

const SectionPath: React.FC<SectionPathProps> = ({ goals, onToggleGoal }) => {
  const { t } = useLanguage();

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'text-bio-cyan border-bio-cyan/30';
      case 'medium': return 'text-golden border-golden/30';
      default: return 'text-muted-foreground border-muted/30';
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-4">
        <Target className="w-4 h-4 text-bio-cyan" />
        <span className="text-sm font-orbitron text-muted-foreground">{t('todaysPath')}</span>
      </div>
      
      {goals.map((goal, index) => (
        <motion.button
          key={goal.id}
          onClick={() => onToggleGoal(goal.id)}
          className={`w-full rounded-[24px] backdrop-blur-xl border bg-surface/30 p-4 flex items-center gap-3 transition-all ${getImpactColor(goal.impact)}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          whileTap={{ scale: 0.98 }}
        >
          {goal.completed ? (
            <CheckCircle className="w-5 h-5 text-bio-cyan" />
          ) : (
            <Circle className="w-5 h-5" />
          )}
          <span className={`flex-1 text-left font-exo text-sm ${goal.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
            {goal.title}
          </span>
        </motion.button>
      ))}
    </div>
  );
};

export default SectionPath;
