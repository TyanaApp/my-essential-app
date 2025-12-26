import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

import StarfieldBackground from '@/components/history/StarfieldBackground';
import VerticalDNAHelix from '@/components/history/VerticalDNAHelix';
import GlassEventCard, { EventType } from '@/components/history/GlassEventCard';
import EventInsightsModal from '@/components/history/EventInsightsModal';
import AddEventFAB from '@/components/history/AddEventFAB';
import { useLifeEvents, getIconByName } from '@/hooks/useLifeEvents';
import { useLanguage } from '@/contexts/LanguageContext';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Dna } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DNANode {
  id: string;
  title: string;
  date: string;
  type: EventType;
  yPosition: number;
}

interface TimelineEvent {
  id: string;
  title: string;
  date: string;
  type: EventType;
  status?: string;
  side: 'left' | 'right';
}

const HistoryPage = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRussian = language === 'ru';
  const { leftEvents, rightEvents, isLoading, addEvent, deleteEvent } = useLifeEvents();

  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(null);
  const [isInsightsOpen, setIsInsightsOpen] = useState(false);

  // Convert events to timeline format
  const allEvents: TimelineEvent[] = useMemo(() => {
    const left = leftEvents.map((e) => ({
      id: e.id || `left-${e.title}`,
      title: e.title,
      date: e.date,
      type: (e.status === 'stress peak' ? 'stress_peak' : e.type) as EventType,
      status: e.status,
      side: 'left' as const,
    }));
    
    const right = rightEvents.map((e) => ({
      id: e.id || `right-${e.title}`,
      title: e.title,
      date: e.date,
      type: (e.status === 'stress peak' ? 'stress_peak' : e.type) as EventType,
      status: e.status,
      side: 'right' as const,
    }));
    
    return [...left, ...right];
  }, [leftEvents, rightEvents]);

  // Separate into Past (left) and Future (right)
  const pastEvents = allEvents.filter(e => e.side === 'left');
  const futureEvents = allEvents.filter(e => e.side === 'right');

  // Convert to DNA nodes
  const dnaNodes: DNANode[] = useMemo(() => {
    return allEvents.map((e, idx) => ({
      id: e.id,
      title: e.title,
      date: e.date,
      type: e.type,
      yPosition: 100 + idx * 120,
    }));
  }, [allEvents]);

  const handleCardClick = (event: TimelineEvent) => {
    setSelectedEvent(event);
    setIsInsightsOpen(true);
  };

  const handleNodeClick = (node: DNANode) => {
    const event = allEvents.find(e => e.id === node.id);
    if (event) {
      setSelectedEvent(event);
      setIsInsightsOpen(true);
    }
  };

  const handleAskAI = (message: string) => {
    toast.success(isRussian ? 'Синхронизация с AI Twin...' : 'Syncing with AI Twin...', { duration: 2000 });
    sessionStorage.setItem('aiTwinMessage', message);
    navigate('/twin');
  };

  const handleViewDetails = () => {
    setIsInsightsOpen(false);
    toast.info(isRussian ? 'Детальный отчет скоро будет доступен' : 'Detailed report coming soon');
  };

  const handleAddEvent = async (newEvent: {
    title: string;
    date: string;
    type: EventType;
    status: string;
    iconName: string;
  }) => {
    await addEvent({
      title: newEvent.title,
      date: newEvent.date,
      type: newEvent.type === 'stress_peak' ? 'trigger' : newEvent.type,
      status: newEvent.status,
      icon: getIconByName(newEvent.iconName),
      iconName: newEvent.iconName,
    });
    toast.success(isRussian ? `"${newEvent.title}" добавлено!` : `"${newEvent.title}" added!`);
  };

  const contentHeight = Math.max(800, dnaNodes.length * 150 + 200);

  return (
    <div className="min-h-screen relative overflow-x-hidden">
      {/* Cosmic starfield background */}
      <StarfieldBackground />

      {/* Header */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed top-0 left-0 right-0 z-30 px-4 py-4"
      >
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          
          <div className="flex items-center gap-2">
            <Dna className="w-5 h-5 text-cyan-400" />
            <h1 className="text-white font-medium">
              {isRussian ? 'История жизни' : 'Life History'}
            </h1>
          </div>

          <div className="w-9" /> {/* Spacer for centering */}
        </div>
      </motion.header>

      {/* Main content */}
      <div className="relative pt-20 px-4 pb-32" style={{ minHeight: contentHeight }}>
        {/* Section labels */}
        <div className="flex justify-between mb-8 max-w-7xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="text-center"
          >
            <h2 className="text-lg font-semibold text-white/80 mb-1">
              {isRussian ? 'Прошлое' : 'Past'}
            </h2>
            <p className="text-xs text-white/40">
              {isRussian ? 'Триггеры и события' : 'Triggers & Events'}
            </p>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="text-center"
          >
            <h2 className="text-lg font-semibold text-white/80 mb-1">
              {isRussian ? 'Будущее' : 'Future'}
            </h2>
            <p className="text-xs text-white/40">
              {isRussian ? 'Цели и планы' : 'Goals & Plans'}
            </p>
          </motion.div>
        </div>

        {/* DNA Helix and Cards Layout */}
        <div className="relative max-w-7xl mx-auto">
          {/* Center DNA Helix */}
          <div className="absolute left-1/2 -translate-x-1/2 top-0 z-10">
            <VerticalDNAHelix
              nodes={dnaNodes}
              onNodeClick={handleNodeClick}
              selectedNodeId={selectedEvent?.id || null}
            />
          </div>

          {/* Left Side - Past Events */}
          <div className="absolute left-0 top-0 w-[35%] space-y-4 pr-4">
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton 
                    key={`left-sk-${i}`} 
                    className="w-full h-24 rounded-2xl bg-white/5" 
                  />
                ))}
              </div>
            ) : (
              pastEvents.map((event, index) => (
                <div 
                  key={event.id} 
                  style={{ 
                    marginTop: index === 0 ? 0 : 100 + index * 20,
                    position: 'relative',
                  }}
                >
                  <GlassEventCard
                    {...event}
                    index={index}
                    isSelected={selectedEvent?.id === event.id}
                    onClick={() => handleCardClick(event)}
                  />
                </div>
              ))
            )}
          </div>

          {/* Right Side - Future Events */}
          <div className="absolute right-0 top-0 w-[35%] space-y-4 pl-4">
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton 
                    key={`right-sk-${i}`} 
                    className="w-full h-24 rounded-2xl bg-white/5" 
                  />
                ))}
              </div>
            ) : (
              futureEvents.map((event, index) => (
                <div 
                  key={event.id} 
                  style={{ 
                    marginTop: index === 0 ? 60 : 100 + index * 20,
                    position: 'relative',
                  }}
                >
                  <GlassEventCard
                    {...event}
                    index={index}
                    isSelected={selectedEvent?.id === event.id}
                    onClick={() => handleCardClick(event)}
                  />
                </div>
              ))
            )}
          </div>
        </div>

        {/* Empty state */}
        {!isLoading && allEvents.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 flex flex-col items-center justify-center text-center px-8"
          >
            <div className="p-6 rounded-full bg-cyan-500/10 mb-6">
              <Dna className="w-12 h-12 text-cyan-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">
              {isRussian ? 'Начни свою историю' : 'Start Your Story'}
            </h3>
            <p className="text-white/50 max-w-sm">
              {isRussian 
                ? 'Добавь первое событие, нажав на кнопку + внизу экрана'
                : 'Add your first event by tapping the + button below'
              }
            </p>
          </motion.div>
        )}
      </div>

      {/* Insights Modal */}
      <EventInsightsModal
        isOpen={isInsightsOpen}
        onClose={() => setIsInsightsOpen(false)}
        event={selectedEvent}
        onAskAI={handleAskAI}
        onViewDetails={handleViewDetails}
      />

      {/* Floating Add Button */}
      <AddEventFAB onAdd={handleAddEvent} />
    </div>
  );
};

export default HistoryPage;
