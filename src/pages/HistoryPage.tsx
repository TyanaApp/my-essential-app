import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';

const HistoryPage = () => {
  const { t } = useLanguage();

  const weekData = [
    { day: 'Mon', energy: 68, sleep: 7.2 },
    { day: 'Tue', energy: 72, sleep: 7.5 },
    { day: 'Wed', energy: 65, sleep: 6.8 },
    { day: 'Thu', energy: 78, sleep: 8.0 },
    { day: 'Fri', energy: 74, sleep: 7.3 },
    { day: 'Sat', energy: 80, sleep: 8.2 },
    { day: 'Sun', energy: 72, sleep: 7.5 },
  ];

  return (
    <div className="min-h-screen bg-background p-6 pb-24">
      <motion.h1 
        className="text-2xl font-orbitron font-bold text-foreground mb-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {t('history')}
      </motion.h1>

      <Card className="bg-card border-border mb-6">
        <CardHeader>
          <CardTitle className="text-lg font-orbitron text-foreground flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            Weekly Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-end h-32">
            {weekData.map((day, i) => (
              <div key={day.day} className="flex flex-col items-center gap-1">
                <motion.div
                  className="w-8 bg-primary/80 rounded-t"
                  initial={{ height: 0 }}
                  animate={{ height: `${day.energy}%` }}
                  transition={{ delay: i * 0.1, duration: 0.5 }}
                />
                <span className="text-xs text-muted-foreground font-exo">{day.day}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-green-400" />
              <span className="text-xs text-muted-foreground font-exo">Avg Energy</span>
            </div>
            <p className="text-2xl font-orbitron font-bold text-foreground">73%</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-4 h-4 text-bio-cyan" />
              <span className="text-xs text-muted-foreground font-exo">Avg Sleep</span>
            </div>
            <p className="text-2xl font-orbitron font-bold text-foreground">7.5h</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default HistoryPage;
