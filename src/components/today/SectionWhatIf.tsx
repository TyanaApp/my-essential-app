import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface Scenario {
  id: string;
  action: string;
  impact: string;
  energyDelta: number;
}

interface SectionWhatIfProps {
  scenarios: Scenario[];
  onSelectScenario: (id: string) => void;
}

const SectionWhatIf: React.FC<SectionWhatIfProps> = ({ scenarios, onSelectScenario }) => {
  const { t } = useLanguage();

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-4 h-4 text-bio-magenta" />
        <span className="text-sm font-orbitron text-muted-foreground">{t('whatIfExplore')}</span>
      </div>
      
      {scenarios.map((scenario, index) => (
        <motion.button
          key={scenario.id}
          onClick={() => onSelectScenario(scenario.id)}
          className="w-full rounded-[24px] backdrop-blur-xl border border-bio-magenta/30 bg-bio-magenta/10 p-4 flex items-center gap-3 hover:bg-bio-magenta/20 transition-all group"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.1 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="flex-1 text-left">
            <p className="font-orbitron font-semibold text-foreground text-sm">
              {scenario.action}
            </p>
            <p className="text-xs text-muted-foreground font-exo">
              {scenario.impact}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`font-orbitron font-bold ${scenario.energyDelta > 0 ? 'text-bio-cyan' : 'text-bio-magenta'}`}>
              {scenario.energyDelta > 0 ? '+' : ''}{scenario.energyDelta}
            </span>
            <ArrowRight className="w-4 h-4 text-bio-magenta group-hover:translate-x-1 transition-transform" />
          </div>
        </motion.button>
      ))}
    </div>
  );
};

export default SectionWhatIf;
