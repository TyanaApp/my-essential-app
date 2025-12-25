import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Mic, Send, FlaskConical, TrendingUp, TrendingDown } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';

interface HabitPreset {
  id: string;
  action: string;
  impact: number;
  type: 'energy' | 'stress';
  positive: boolean;
}

const SectionWhatIf: React.FC = () => {
  const { t } = useLanguage();
  const [selectedPreset, setSelectedPreset] = useState<HabitPreset | null>(null);
  const [customQuestion, setCustomQuestion] = useState('');
  const [showResult, setShowResult] = useState(false);

  const presets: HabitPreset[] = [
    { id: '1', action: t('plusHourSleep'), impact: 23, type: 'energy', positive: true },
    { id: '2', action: t('noCoffee'), impact: 13, type: 'energy', positive: true },
    { id: '3', action: t('noAlcohol'), impact: 18, type: 'stress', positive: true },
  ];

  const handlePresetClick = (preset: HabitPreset) => {
    setSelectedPreset(preset);
    setShowResult(true);
  };

  const handleSubmitQuestion = () => {
    if (customQuestion.trim()) {
      setSelectedPreset({
        id: 'custom',
        action: customQuestion,
        impact: Math.floor(Math.random() * 20) + 5,
        type: 'energy',
        positive: true,
      });
      setShowResult(true);
    }
  };

  const handleTurnIntoExperiment = () => {
    toast({
      title: t('turnIntoExperiment'),
      description: `7 ${t('experimentDays')}`,
    });
    setShowResult(false);
    setSelectedPreset(null);
    setCustomQuestion('');
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <FlaskConical className="w-4 h-4 text-bio-magenta" />
        <span className="text-sm font-orbitron font-semibold text-foreground">{t('habitSimulator')}</span>
      </div>

      {/* Preset cards - horizontal scroll */}
      <div className="overflow-x-auto pb-2 -mx-2 px-2">
        <div className="flex gap-3" style={{ width: 'max-content' }}>
          {presets.map((preset, index) => (
            <motion.button
              key={preset.id}
              onClick={() => handlePresetClick(preset)}
              className={`flex-shrink-0 w-36 rounded-[20px] backdrop-blur-xl border p-3 text-left transition-all ${
                selectedPreset?.id === preset.id 
                  ? 'bg-bio-magenta/20 border-bio-magenta/50' 
                  : 'bg-surface/50 border-border/50 hover:border-bio-magenta/30'
              }`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <p className="text-xs font-exo text-foreground mb-2 line-clamp-2">{preset.action}</p>
              <div className="flex items-center gap-1">
                {preset.positive ? (
                  <TrendingUp className="w-3.5 h-3.5 text-bio-cyan" />
                ) : (
                  <TrendingDown className="w-3.5 h-3.5 text-bio-magenta" />
                )}
                <span className={`text-sm font-orbitron font-bold ${preset.positive ? 'text-bio-cyan' : 'text-bio-magenta'}`}>
                  {preset.positive ? '+' : '-'}{preset.impact}%
                </span>
                <span className="text-[10px] text-muted-foreground font-exo">
                  {preset.type === 'energy' ? t('energyChange') : t('stressChange')}
                </span>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Custom question input */}
      <motion.div
        className="rounded-[20px] bg-surface/50 backdrop-blur-xl border border-border/50 p-3"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="flex items-center gap-2">
          <Input
            value={customQuestion}
            onChange={(e) => setCustomQuestion(e.target.value)}
            placeholder={t('whatIfAsk')}
            className="flex-1 bg-transparent border-none text-sm font-exo placeholder:text-muted-foreground focus-visible:ring-0"
            onKeyDown={(e) => e.key === 'Enter' && handleSubmitQuestion()}
          />
          <button className="p-2 text-muted-foreground hover:text-bio-cyan transition-colors">
            <Mic className="w-4 h-4" />
          </button>
          <button 
            onClick={handleSubmitQuestion}
            className="p-2 text-bio-cyan hover:text-bio-cyan/80 transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </motion.div>

      {/* Result view */}
      <AnimatePresence>
        {showResult && selectedPreset && (
          <motion.div
            className="rounded-[24px] bg-gradient-to-br from-bio-cyan/10 to-bio-magenta/10 backdrop-blur-xl border border-bio-cyan/20 p-4 space-y-4"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
          >
            {/* Before vs After visualization */}
            <div>
              <p className="text-xs font-orbitron text-muted-foreground mb-3">{t('beforeAfter')}</p>
              <div className="flex items-end gap-4 h-24">
                {/* Before bar */}
                <div className="flex-1 flex flex-col items-center">
                  <motion.div
                    className="w-full bg-muted/50 rounded-t-lg"
                    initial={{ height: 0 }}
                    animate={{ height: '60%' }}
                    transition={{ duration: 0.5 }}
                  />
                  <span className="text-[10px] font-exo text-muted-foreground mt-1">Before</span>
                </div>
                {/* After bar */}
                <div className="flex-1 flex flex-col items-center">
                  <motion.div
                    className="w-full bg-gradient-to-t from-bio-cyan to-bio-cyan/60 rounded-t-lg"
                    initial={{ height: 0 }}
                    animate={{ height: `${60 + selectedPreset.impact}%` }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                  />
                  <span className="text-[10px] font-exo text-bio-cyan mt-1">After</span>
                </div>
              </div>
            </div>

            {/* Impact summary */}
            <div className="flex items-center justify-center gap-2 text-center">
              <Sparkles className="w-4 h-4 text-golden" />
              <span className="text-sm font-exo text-foreground">
                {selectedPreset.action}
              </span>
              <span className={`font-orbitron font-bold ${selectedPreset.positive ? 'text-bio-cyan' : 'text-bio-magenta'}`}>
                {selectedPreset.positive ? '+' : ''}{selectedPreset.impact}%
              </span>
            </div>

            {/* Turn into experiment button */}
            <Button
              onClick={handleTurnIntoExperiment}
              className="w-full rounded-[20px] h-11 bg-gradient-to-r from-bio-magenta to-bio-cyan text-white font-orbitron font-semibold hover:opacity-90 transition-opacity"
            >
              {t('turnIntoExperiment')}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SectionWhatIf;