import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Moon, Brain, Activity } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';

interface HealthInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: HealthData) => void;
}

export interface HealthData {
  sleep: number;
  mood: number;
  stress: number;
}

const HealthInputModal = ({ isOpen, onClose, onSave }: HealthInputModalProps) => {
  const { t } = useLanguage();
  const [sleep, setSleep] = useState(7);
  const [mood, setMood] = useState(70);
  const [stress, setStress] = useState(30);

  const handleSave = () => {
    onSave({ sleep, mood, stress });
    toast.success(t('dataSaved'));
    onClose();
  };

  const getMoodEmoji = (value: number) => {
    if (value < 30) return '😔';
    if (value < 50) return '😐';
    if (value < 70) return '🙂';
    if (value < 90) return '😊';
    return '😄';
  };

  const getStressLabel = (value: number) => {
    if (value < 30) return t('low');
    if (value < 60) return t('moderate');
    return t('high');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50"
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.9 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-card rounded-t-3xl p-6 pb-10 border-t border-border"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-orbitron font-bold text-foreground">
                {t('addData')}
              </h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="text-muted-foreground"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Sleep Input */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Moon className="w-5 h-5 text-bio-cyan" />
                <span className="font-exo text-foreground">{t('sleepHours')}</span>
                <span className="ml-auto font-orbitron text-lg text-primary">{sleep}h</span>
              </div>
              <Slider
                value={[sleep]}
                onValueChange={(v) => setSleep(v[0])}
                min={0}
                max={12}
                step={0.5}
                className="w-full"
              />
            </div>

            {/* Mood Input */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Brain className="w-5 h-5 text-primary" />
                <span className="font-exo text-foreground">{t('moodLevel')}</span>
                <span className="ml-auto text-2xl">{getMoodEmoji(mood)}</span>
              </div>
              <Slider
                value={[mood]}
                onValueChange={(v) => setMood(v[0])}
                min={0}
                max={100}
                step={5}
                className="w-full"
              />
            </div>

            {/* Stress Input */}
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-3">
                <Activity className="w-5 h-5 text-bio-magenta" />
                <span className="font-exo text-foreground">{t('stress')}</span>
                <span className="ml-auto font-exo text-sm text-muted-foreground">
                  {getStressLabel(stress)} ({stress}%)
                </span>
              </div>
              <Slider
                value={[stress]}
                onValueChange={(v) => setStress(v[0])}
                min={0}
                max={100}
                step={5}
                className="w-full"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={onClose}
                className="flex-1 font-exo"
              >
                {t('cancel')}
              </Button>
              <Button
                onClick={handleSave}
                className="flex-1 font-exo bg-primary text-primary-foreground"
              >
                {t('save')}
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default HealthInputModal;
