import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, LucideIcon } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import StarParticles from '@/components/timeline/StarParticles';
import DNAHelix from '@/components/timeline/DNAHelix';
import TimelineCard from '@/components/timeline/TimelineCard';
import ContextInsightModal from '@/components/timeline/ContextInsightModal';
import AddEventModal from '@/components/timeline/AddEventModal';
import { useLifeEvents, LifeEvent, getIconByName } from '@/hooks/useLifeEvents';
import { Skeleton } from '@/components/ui/skeleton';

const HistoryPage = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { leftEvents, rightEvents, isLoading, addEvent, deleteEvent } = useLifeEvents();

  const [selectedEvent, setSelectedEvent] = useState<LifeEvent | null>(null);
  const [isInsightModalOpen, setIsInsightModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const handleCardClick = (event: LifeEvent) => {
    setSelectedEvent(event);
    setIsInsightModalOpen(true);
  };

  const handleAITwinSync = (message: string) => {
    toast.success('Syncing with AI Twin...', { duration: 2000 });
    sessionStorage.setItem('aiTwinMessage', message);
    navigate('/twin');
  };

  const handleAddEvent = async (newEvent: {
    title: string;
    date: string;
    type: 'trigger' | 'goal';
    status: string;
    icon: LucideIcon;
  }) => {
    // Find icon name from the icon component
    const iconName = Object.entries({
      Briefcase: 'Briefcase',
      ShieldPlus: 'ShieldPlus',
      Globe: 'Globe',
      PersonStanding: 'PersonStanding',
      Baby: 'Baby',
      Target: 'Target',
      Heart: 'Heart',
      Plane: 'Plane',
      Trophy: 'Trophy',
    }).find(([, name]) => getIconByName(name) === newEvent.icon)?.[1] || 'Target';

    await addEvent({
      title: newEvent.title,
      date: newEvent.date,
      type: newEvent.type,
      status: newEvent.status,
      icon: newEvent.icon,
      iconName,
    });
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
          {isLoading ? (
            <>
              <div className="flex flex-col gap-8">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={`left-skeleton-${i}`} className="w-[130px] h-[160px] rounded-2xl bg-white/10" />
                ))}
              </div>
              <div className="flex flex-col gap-8">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={`right-skeleton-${i}`} className="w-[130px] h-[160px] rounded-2xl bg-white/10 ml-auto" />
                ))}
              </div>
            </>
          ) : (
            <>
              {/* Left column */}
              <div className="flex flex-col gap-8">
                {leftEvents.map((event, i) => (
                  <TimelineCard
                    key={`left-${event.id || event.title}-${i}`}
                    id={event.id}
                    {...event}
                    side="left"
                    index={i}
                    onClick={() => handleCardClick(event)}
                    onDelete={deleteEvent}
                  />
                ))}
              </div>
              
              {/* Right column */}
              <div className="flex flex-col gap-8">
                {rightEvents.map((event, i) => (
                  <TimelineCard
                    key={`right-${event.id || event.title}-${i}`}
                    id={event.id}
                    {...event}
                    side="right"
                    index={i}
                    onClick={() => handleCardClick(event)}
                    onDelete={deleteEvent}
                  />
                ))}
              </div>
            </>
          )}
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
        onDelete={deleteEvent}
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
