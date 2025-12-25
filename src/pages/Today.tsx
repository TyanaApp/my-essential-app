import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Activity, Moon, Brain, Heart } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import HealthInputModal, { HealthData } from '@/components/HealthInputModal';

const Today = () => {
  const { t, language } = useLanguage();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [healthData, setHealthData] = useState({
    sleep: 7.5,
    mood: 78,
    stress: 32,
  });
  const [energyLevel] = useState(72);

  const handleSaveHealthData = (data: HealthData) => {
    setHealthData({
      sleep: data.sleep,
      mood: data.mood,
      stress: data.stress,
    });
  };

  const getMoodLabel = (value: number) => {
    if (value < 40) return t('low');
    if (value < 70) return t('moderate');
    return t('good');
  };

  const getStressLabel = (value: number) => {
    if (value < 30) return t('low');
    if (value < 60) return t('moderate');
    return t('high');
  };

  const healthMetrics = [
    { 
      icon: Moon, 
      label: t('sleep'), 
      value: `${healthData.sleep}h`, 
      sublabel: healthData.sleep >= 7 ? t('good') : t('low'), 
      color: 'text-bio-cyan' 
    },
    { 
      icon: Activity, 
      label: t('stress'), 
      value: getStressLabel(healthData.stress), 
      sublabel: `${healthData.stress}%`, 
      color: healthData.stress < 50 ? 'text-green-400' : 'text-bio-magenta' 
    },
    { 
      icon: Brain, 
      label: t('mood'), 
      value: getMoodLabel(healthData.mood), 
      sublabel: `${healthData.mood}%`, 
      color: 'text-primary' 
    },
    { 
      icon: Heart, 
      label: t('heartRate'), 
      value: '68', 
      sublabel: t('bpm'), 
      color: 'text-bio-magenta' 
    },
  ];

  const dateLocale = language === 'ru' ? 'ru-RU' : language === 'lv' ? 'lv-LV' : 'en-US';

  return (
    <div className="min-h-screen bg-background p-6 pb-24">
      {/* Header */}
      <motion.div 
        className="mb-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-orbitron font-bold text-foreground mb-1">
          {t('today')}
        </h1>
        <p className="text-muted-foreground font-exo">
          {new Date().toLocaleDateString(dateLocale, { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
      </motion.div>

      {/* Energy Gauge */}
      <motion.div 
        className="mb-8"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="bg-card border-border overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-orbitron text-foreground flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              {t('energyLevel')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative h-32 flex items-center justify-center">
              <svg className="w-32 h-32 transform -rotate-90">
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  className="text-secondary"
                />
                <motion.circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="url(#gradient)"
                  strokeWidth="8"
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={351.86}
                  initial={{ strokeDashoffset: 351.86 }}
                  animate={{ strokeDashoffset: 351.86 * (1 - energyLevel / 100) }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                />
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="hsl(43 60% 60%)" />
                    <stop offset="100%" stopColor="hsl(43 70% 75%)" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center flex-col">
                <span className="text-4xl font-orbitron font-bold text-gradient-golden">{energyLevel}</span>
                <span className="text-xs text-muted-foreground font-exo">{t('energy')}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Health Metrics Grid */}
      <motion.div 
        className="grid grid-cols-2 gap-4 mb-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        {healthMetrics.map((metric, index) => {
          const Icon = metric.icon;
          return (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + index * 0.1 }}
            >
              <Card className="bg-card border-border hover:border-primary/50 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <Icon className={`w-5 h-5 ${metric.color}`} />
                  </div>
                  <p className="text-2xl font-orbitron font-bold text-foreground">{metric.value}</p>
                  <p className="text-xs text-muted-foreground font-exo">{metric.label}</p>
                  <p className={`text-xs font-exo ${metric.color}`}>{metric.sublabel}</p>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </motion.div>

      {/* What-If Engine */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-orbitron text-foreground">
              {t('whatIfTitle')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {[t('moreSleep'), t('lessCaffeine'), t('morningWorkout'), t('meditation')].map((suggestion) => (
                <Button
                  key={suggestion}
                  variant="secondary"
                  size="sm"
                  className="rounded-full font-exo text-xs hover:bg-primary hover:text-primary-foreground transition-colors"
                >
                  {suggestion}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* FAB */}
      <motion.button
        className="fixed bottom-24 right-6 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:bg-primary/90 transition-colors"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5 }}
        onClick={() => setIsModalOpen(true)}
      >
        <Plus className="w-6 h-6" />
      </motion.button>

      {/* Health Input Modal */}
      <HealthInputModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveHealthData}
      />
    </div>
  );
};

export default Today;
