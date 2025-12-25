import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import SegmentedControl from '@/components/today/SegmentedControl';
import EnergyRing from '@/components/today/EnergyRing';
import QuickCheckIn from '@/components/today/QuickCheckIn';
import ConnectHealthCard from '@/components/today/ConnectHealthCard';
import SectionNow from '@/components/today/SectionNow';
import SectionSoon from '@/components/today/SectionSoon';
import SectionPath from '@/components/today/SectionPath';
import SectionWhatIf from '@/components/today/SectionWhatIf';

const Today = () => {
  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = useState(0);
  const [showCheckIn, setShowCheckIn] = useState(false);
  const [hasData, setHasData] = useState(false);
  const [hasWearable, setHasWearable] = useState(false);
  
  const [healthData, setHealthData] = useState({
    sleep: 7.5,
    mood: 78,
    stress: 32,
    heartRate: 68,
  });
  
  const [energyLevel, setEnergyLevel] = useState(7);

  const segments = [
    t('now'),
    t('soon'),
    t('path'),
    t('whatIf'),
  ];

  const predictions = [
    { time: '14:00', energyChange: 'down' as const, reason: t('postLunchDip') },
    { time: '16:00', energyChange: 'up' as const, reason: t('afternoonRecovery') },
    { time: '20:00', energyChange: 'stable' as const, reason: t('eveningWind') },
  ];

  const [goals, setGoals] = useState([
    { id: '1', title: t('morningWorkout'), completed: false, impact: 'high' as const },
    { id: '2', title: t('meditation'), completed: true, impact: 'medium' as const },
    { id: '3', title: t('drinkWater'), completed: false, impact: 'low' as const },
  ]);

  const scenarios = [
    { id: '1', action: t('moreSleep'), impact: t('betterFocus'), energyDelta: 2 },
    { id: '2', action: t('lessCaffeine'), impact: t('stableEnergy'), energyDelta: 1 },
    { id: '3', action: t('skipWorkout'), impact: t('lessRecovery'), energyDelta: -2 },
  ];

  const handleCheckInComplete = (data: { energy: number; mood: number }) => {
    setEnergyLevel(data.energy);
    setHealthData(prev => ({ ...prev, mood: data.mood * 10 }));
    setHasData(true);
    setShowCheckIn(false);
  };

  const handleToggleGoal = (id: string) => {
    setGoals(prev => prev.map(g => 
      g.id === id ? { ...g, completed: !g.completed } : g
    ));
  };

  const handleConnectHealth = () => {
    setHasWearable(true);
  };

  const renderSection = () => {
    switch (activeTab) {
      case 0:
        return <SectionNow data={healthData} />;
      case 1:
        return <SectionSoon predictions={predictions} />;
      case 2:
        return <SectionPath goals={goals} onToggleGoal={handleToggleGoal} />;
      case 3:
        return <SectionWhatIf scenarios={scenarios} onSelectScenario={() => {}} />;
      default:
        return null;
    }
  };

  const dateLocale = language === 'ru' ? 'ru-RU' : language === 'lv' ? 'lv-LV' : 'en-US';

  return (
    <div className="min-h-screen bg-background p-6 pb-24">
      {/* Header */}
      <motion.div 
        className="mb-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-xl font-orbitron font-bold text-foreground mb-0.5">
          {t('today')}
        </h1>
        <p className="text-xs text-muted-foreground font-exo">
          {new Date().toLocaleDateString(dateLocale, { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
      </motion.div>

      {/* Segmented Control */}
      <motion.div
        className="mb-6"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <SegmentedControl
          segments={segments}
          activeIndex={activeTab}
          onChange={setActiveTab}
        />
      </motion.div>

      {/* Energy Ring */}
      <motion.div 
        className="flex justify-center mb-8"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
      >
        <EnergyRing value={energyLevel} label={t('energy')} />
      </motion.div>

      {/* No Data State */}
      {!hasData && (
        <motion.button
          onClick={() => setShowCheckIn(true)}
          className="w-full mb-6 rounded-[24px] bg-gradient-to-r from-bio-cyan/20 to-bio-magenta/20 backdrop-blur-xl border border-bio-cyan/30 p-4 flex items-center justify-center gap-3 hover:from-bio-cyan/30 hover:to-bio-magenta/30 transition-all"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Zap className="w-5 h-5 text-bio-cyan" />
          <span className="font-orbitron font-semibold text-foreground">
            {t('tenSecCheckIn')}
          </span>
        </motion.button>
      )}

      {/* No Wearable State */}
      {!hasWearable && (
        <motion.div
          className="mb-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <ConnectHealthCard onConnect={handleConnectHealth} />
        </motion.div>
      )}

      {/* Section Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          {renderSection()}
        </motion.div>
      </AnimatePresence>

      {/* Quick Check-in Modal */}
      <AnimatePresence>
        {showCheckIn && (
          <QuickCheckIn
            onComplete={handleCheckInComplete}
            onClose={() => setShowCheckIn(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Today;
