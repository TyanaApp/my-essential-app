import React from 'react';
import { motion } from 'framer-motion';
import { Briefcase, ShieldPlus, Globe, PersonStanding, Baby, Target } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import StarParticles from '@/components/timeline/StarParticles';
import DNAHelix from '@/components/timeline/DNAHelix';
import TimelineCard from '@/components/timeline/TimelineCard';

const HistoryPage = () => {
  const { t } = useLanguage();

  const leftEvents = [
    { title: 'Job Change', date: '01/23', type: 'trigger' as const, status: 'stress peak', icon: Briefcase },
    { title: 'Illness', date: '06/23', type: 'trigger' as const, status: 'goal', icon: ShieldPlus },
    { title: 'Trip', date: '09/23', type: 'goal' as const, status: 'stress peak', icon: Globe },
  ];

  const rightEvents = [
    { title: 'Marathon', date: '05/24', type: 'trigger' as const, status: 'stress peak', icon: PersonStanding },
    { title: 'Pregnancy', date: '08/24', type: 'goal' as const, status: 'stress peak', icon: Baby },
    { title: 'Big Project', date: '12/24', type: 'trigger' as const, status: 'stress peak', icon: Target },
  ];

  return (
    <div 
      className="min-h-screen relative overflow-hidden pb-24"
      style={{
        background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 50%, #0f0f23 100%)',
      }}
    >
      {/* Star particles */}
      <StarParticles />

      {/* Timeline container */}
      <div className="relative px-4 pt-8 min-h-[700px]">
        {/* DNA Helix centerpiece */}
        <DNAHelix />

        {/* Events grid - two columns */}
        <div className="relative z-10 grid grid-cols-2 gap-x-16 gap-y-8 pt-4">
          {/* Left column */}
          <div className="flex flex-col gap-8">
            {leftEvents.map((event, i) => (
              <TimelineCard
                key={event.title}
                {...event}
                side="left"
                index={i}
              />
            ))}
          </div>
          
          {/* Right column */}
          <div className="flex flex-col gap-8">
            {rightEvents.map((event, i) => (
              <TimelineCard
                key={event.title}
                {...event}
                side="right"
                index={i}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HistoryPage;
