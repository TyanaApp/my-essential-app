import React from 'react';
import { motion } from 'framer-motion';
import { Briefcase, HeartPulse, Plane, Trophy, Baby, Rocket } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import StarParticles from '@/components/timeline/StarParticles';
import DNAHelix from '@/components/timeline/DNAHelix';
import TimelineCard from '@/components/timeline/TimelineCard';

const HistoryPage = () => {
  const { t } = useLanguage();

  const leftEvents = [
    { title: 'Job Change', date: '01/23', type: 'trigger' as const, status: 'stress peak', icon: Briefcase },
    { title: 'Illness', date: '06/23', type: 'trigger' as const, status: 'goal', icon: HeartPulse },
    { title: 'Trip', date: '09/23', type: 'goal' as const, status: 'stress peak', icon: Plane },
  ];

  const rightEvents = [
    { title: 'Marathon', date: '05/24', type: 'trigger' as const, status: 'stress peak', icon: Trophy },
    { title: 'Pregnancy', date: '08/24', type: 'goal' as const, status: 'stress peak', icon: Baby },
    { title: 'Big Project', date: '12/24', type: 'trigger' as const, status: 'stress peak', icon: Rocket },
  ];

  return (
    <div className="min-h-screen bg-background relative overflow-hidden pb-24">
      {/* Cosmic background gradient */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, hsl(var(--bio-purple) / 0.15) 0%, transparent 50%), radial-gradient(ellipse at top right, hsl(var(--bio-cyan) / 0.1) 0%, transparent 40%), radial-gradient(ellipse at bottom left, hsl(var(--bio-purple) / 0.1) 0%, transparent 40%)',
        }}
      />

      {/* Star particles */}
      <StarParticles />

      {/* Header */}
      <motion.div 
        className="relative z-10 p-6 pb-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-orbitron font-bold text-foreground mb-1">
          {t('history')}
        </h1>
        <p className="text-sm text-muted-foreground font-exo">Your life events timeline</p>
      </motion.div>

      {/* Timeline container */}
      <div className="relative px-4 min-h-[600px]">
        {/* DNA Helix centerpiece */}
        <DNAHelix />

        {/* Events container */}
        <div className="relative z-10 flex flex-col gap-6 pt-4">
          {/* Interleave left and right events */}
          {Array.from({ length: Math.max(leftEvents.length, rightEvents.length) }, (_, i) => (
            <React.Fragment key={i}>
              {leftEvents[i] && (
                <TimelineCard
                  {...leftEvents[i]}
                  side="left"
                  index={i * 2}
                />
              )}
              {rightEvents[i] && (
                <TimelineCard
                  {...rightEvents[i]}
                  side="right"
                  index={i * 2 + 1}
                />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Bottom gradient fade */}
      <div 
        className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none"
        style={{
          background: 'linear-gradient(to top, hsl(var(--background)), transparent)',
        }}
      />
    </div>
  );
};

export default HistoryPage;
