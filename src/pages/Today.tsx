import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import SegmentedControl from '@/components/today/SegmentedControl';
import QuickCheckIn from '@/components/today/QuickCheckIn';
import ConnectHealthCard from '@/components/today/ConnectHealthCard';
import SectionNow from '@/components/today/SectionNow';
import SectionSoon from '@/components/today/SectionSoon';
import SectionPath from '@/components/today/SectionPath';
import SectionWhatIf from '@/components/today/SectionWhatIf';
import { toast } from '@/hooks/use-toast';

const Today = () => {
  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = useState(0);
  const [showCheckIn, setShowCheckIn] = useState(false);
  const [hasData, setHasData] = useState(true);
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

  const handleCheckInComplete = (data: { energy: number; mood: number }) => {
    setEnergyLevel(data.energy);
    setHealthData(prev => ({ ...prev, mood: data.mood * 10 }));
    setHasData(true);
    setShowCheckIn(false);
  };

  const handleConnectHealth = () => {
    setHasWearable(true);
    toast({
      title: t('connectHealth'),
      description: t('syncWearableData'),
    });
  };

  const handlePreparePlan = () => {
    toast({
      title: t('preparePlan'),
      description: 'Plan generated for upcoming cycle phases',
    });
  };

  const renderSection = () => {
    switch (activeTab) {
      case 0:
        return <SectionNow data={healthData} energyLevel={energyLevel} />;
      case 1:
        return <SectionSoon onPreparePlan={handlePreparePlan} />;
      case 2:
        return <SectionPath />;
      case 3:
        return <SectionWhatIf />;
      default:
        return null;
    }
  };

  const dateLocale = language === 'ru' ? 'ru-RU' : language === 'lv' ? 'lv-LV' : 'en-US';

  return (
    <div className="min-h-screen bg-background p-6 pb-24">
      {/* Header */}
      <motion.div 
        className="mb-4"
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
        className="mb-5"
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

      {/* No Data State */}
      {!hasData && (
        <motion.button
          onClick={() => setShowCheckIn(true)}
          className="w-full mb-4 rounded-[24px] bg-gradient-to-r from-bio-cyan/20 to-bio-magenta/20 backdrop-blur-xl border border-bio-cyan/30 p-4 flex items-center justify-center gap-3 hover:from-bio-cyan/30 hover:to-bio-magenta/30 transition-all"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
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
      {!hasWearable && activeTab === 0 && (
        <motion.div
          className="mb-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
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
