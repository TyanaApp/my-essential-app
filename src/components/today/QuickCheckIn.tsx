import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';

interface QuickCheckInProps {
  onComplete: (data: { energy: number; mood: number }) => void;
  onClose: () => void;
}

const QuickCheckIn: React.FC<QuickCheckInProps> = ({ onComplete, onClose }) => {
  const { t } = useLanguage();
  const [step, setStep] = useState(0);
  const [energy, setEnergy] = useState(5);
  const [mood, setMood] = useState(5);

  const handleEnergySelect = (value: number) => {
    setEnergy(value);
    setStep(1);
  };

  const handleMoodSelect = (value: number) => {
    setMood(value);
    onComplete({ energy, mood: value });
  };

  const levels = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-background/80 backdrop-blur-xl"
        onClick={onClose}
      />
      
      {/* Modal */}
      <motion.div
        className="relative w-full max-w-sm rounded-[24px] bg-surface/80 backdrop-blur-xl border border-bio-cyan/20 p-6 shadow-[0_0_40px_rgba(0,255,255,0.15)]"
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-bio-cyan/20 mb-3">
            <Zap className="w-6 h-6 text-bio-cyan" />
          </div>
          <h3 className="text-lg font-orbitron font-bold text-foreground">
            {step === 0 ? t('howIsYourEnergy') : t('howIsYourMood')}
          </h3>
          <p className="text-xs text-muted-foreground font-exo mt-1">
            {step === 0 ? t('tapToSelect') : t('almostDone')}
          </p>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="grid grid-cols-5 gap-2"
          >
            {levels.map((level) => (
              <motion.button
                key={level}
                onClick={() => step === 0 ? handleEnergySelect(level) : handleMoodSelect(level)}
                className={`aspect-square rounded-[12px] font-orbitron font-bold text-sm transition-all ${
                  level <= 3 
                    ? 'bg-bio-magenta/20 text-bio-magenta hover:bg-bio-magenta/40 border border-bio-magenta/30' 
                    : level <= 6 
                      ? 'bg-golden/20 text-golden hover:bg-golden/40 border border-golden/30'
                      : 'bg-bio-cyan/20 text-bio-cyan hover:bg-bio-cyan/40 border border-bio-cyan/30'
                }`}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                {level}
              </motion.button>
            ))}
          </motion.div>
        </AnimatePresence>

        {/* Progress dots */}
        <div className="flex justify-center gap-2 mt-6">
          <div className={`w-2 h-2 rounded-full transition-colors ${step >= 0 ? 'bg-bio-cyan' : 'bg-muted'}`} />
          <div className={`w-2 h-2 rounded-full transition-colors ${step >= 1 ? 'bg-bio-cyan' : 'bg-muted'}`} />
        </div>
      </motion.div>
    </motion.div>
  );
};

export default QuickCheckIn;
