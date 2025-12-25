import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Briefcase, ShieldPlus, Globe, PersonStanding, Baby, Target, Plus, LucideIcon } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import StarParticles from '@/components/timeline/StarParticles';
import DNAHelix from '@/components/timeline/DNAHelix';
import TimelineCard from '@/components/timeline/TimelineCard';
import ContextInsightModal from '@/components/timeline/ContextInsightModal';
import AddEventModal from '@/components/timeline/AddEventModal';

interface LifeEvent {
  title: string;
  date: string;
  type: 'trigger' | 'goal';
  status: string;
  icon: LucideIcon;
}

const HistoryPage = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [leftEvents, setLeftEvents] = useState<LifeEvent[]>([
    { title: 'Job Change', date: '01/23', type: 'trigger', status: 'stress peak', icon: Briefcase },
    { title: 'Illness', date: '06/23', type: 'trigger', status: 'goal', icon: ShieldPlus },
    { title: 'Trip', date: '09/23', type: 'goal', status: 'stress peak', icon: Globe },
  ]);

  const [rightEvents, setRightEvents] = useState<LifeEvent[]>([
    { title: 'Marathon', date: '05/24', type: 'trigger', status: 'stress peak', icon: PersonStanding },
    { title: 'Pregnancy', date: '08/24', type: 'goal', status: 'stress peak', icon: Baby },
    { title: 'Big Project', date: '12/24', type: 'trigger', status: 'stress peak', icon: Target },
  ]);

  const [selectedEvent, setSelectedEvent] = useState<LifeEvent | null>(null);
  const [isInsightModalOpen, setIsInsightModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const handleCardClick = (event: LifeEvent) => {
    setSelectedEvent(event);
    setIsInsightModalOpen(true);
  };

  const handleAITwinSync = (message: string) => {
    // Navigate to Twin page and pass the message
    toast.success('Syncing with AI Twin...', { duration: 2000 });
    // Store message in sessionStorage to be picked up by Twin page
    sessionStorage.setItem('aiTwinMessage', message);
    navigate('/twin');
  };

  const handleAddEvent = (newEvent: LifeEvent) => {
    // Add to the shorter column for balance
    if (leftEvents.length <= rightEvents.length) {
      setLeftEvents([...leftEvents, newEvent]);
    } else {
      setRightEvents([...rightEvents, newEvent]);
    }
    toast.success(`"${newEvent.title}" added to timeline!`);
  };

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
                key={`left-${event.title}-${i}`}
                {...event}
                side="left"
                index={i}
                onClick={() => handleCardClick(event)}
              />
            ))}
          </div>
          
          {/* Right column */}
          <div className="flex flex-col gap-8">
            {rightEvents.map((event, i) => (
              <TimelineCard
                key={`right-${event.title}-${i}`}
                {...event}
                side="right"
                index={i}
                onClick={() => handleCardClick(event)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Floating Add Button */}
      <motion.button
        onClick={() => setIsAddModalOpen(true)}
        className="fixed bottom-24 right-6 w-14 h-14 rounded-full flex items-center justify-center shadow-lg z-40"
        style={{
          background: 'linear-gradient(135deg, hsl(var(--bio-purple)), hsl(var(--bio-cyan)))',
          boxShadow: '0 4px 20px rgba(139, 92, 246, 0.4)',
        }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Plus className="w-6 h-6 text-white" />
      </motion.button>

      {/* Context Insight Modal */}
      <ContextInsightModal
        isOpen={isInsightModalOpen}
        onClose={() => setIsInsightModalOpen(false)}
        event={selectedEvent}
        onAITwinSync={handleAITwinSync}
      />

      {/* Add Event Modal */}
      <AddEventModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddEvent}
      />
    </div>
  );
};

export default HistoryPage;
