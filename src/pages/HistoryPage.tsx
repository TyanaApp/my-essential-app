import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { BarChart3 } from 'lucide-react';

import StarParticles from '@/components/timeline/StarParticles';
import DNAHelix from '@/components/timeline/DNAHelix';
import HistoryHeader from '@/components/history/HistoryHeader';
import TodayCheckIn from '@/components/history/TodayCheckIn';
import WearableWidget from '@/components/history/WearableWidget';
import EmptyWearable from '@/components/history/EmptyWearable';
import EmptyTimeline from '@/components/history/EmptyTimeline';
import TimelineEvent, { TimelineEventData, EventType } from '@/components/history/TimelineEvent';
import FilterModal, { FilterState } from '@/components/history/FilterModal';
import SmartSuggestion from '@/components/history/SmartSuggestion';
import EventDetailsModal from '@/components/history/EventDetailsModal';
import QuickAddScreen from '@/components/history/QuickAddScreen';
import AddEventScreen from '@/components/history/AddEventScreen';
import PeriodInsightsModal from '@/components/history/PeriodInsightsModal';
import QuickActionsSheet from '@/components/history/QuickActionsSheet';
import { useLifeEvents, getIconByName } from '@/hooks/useLifeEvents';
import { Skeleton } from '@/components/ui/skeleton';

const HistoryPage = () => {
  const navigate = useNavigate();
  const { leftEvents, rightEvents, isLoading, addEvent, deleteEvent } = useLifeEvents();

  // UI States
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState<'day' | 'week' | 'month' | 'custom'>('week');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [isDetailedAddOpen, setIsDetailedAddOpen] = useState(false);
  const [isInsightsOpen, setIsInsightsOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<TimelineEventData | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [quickActionsEvent, setQuickActionsEvent] = useState<TimelineEventData | null>(null);
  const [showSuggestion, setShowSuggestion] = useState(true);
  const [hasWearable, setHasWearable] = useState(false);
  const [checkInExpanded, setCheckInExpanded] = useState(false);

  const [filters, setFilters] = useState<FilterState>({
    types: [],
    impacts: [],
    confidence: 'all',
    showPrivate: false,
  });

  // Check if timeline is empty
  const isTimelineEmpty = !isLoading && leftEvents.length === 0 && rightEvents.length === 0;

  // Convert old events to new format
  const convertEvent = (event: any, side: 'left' | 'right'): TimelineEventData => ({
    id: event.id,
    title: event.title,
    date: event.date,
    type: event.type as EventType,
    status: event.status,
    icon: event.icon,
    iconName: event.iconName,
    side,
    confidence: 'high',
  });

  const leftTimelineEvents = leftEvents.map(e => convertEvent(e, 'left'));
  const rightTimelineEvents = rightEvents.map(e => convertEvent(e, 'right'));

  const handleCardClick = (event: TimelineEventData) => {
    setSelectedEvent(event);
    setIsDetailsOpen(true);
  };

  const handleLongPress = (event: TimelineEventData) => {
    setQuickActionsEvent(event);
  };

  const handleAITwinSync = (message: string) => {
    toast.success('Синхронизация с AI Twin...', { duration: 2000 });
    sessionStorage.setItem('aiTwinMessage', message);
    navigate('/twin');
  };

  const handleAddEvent = async (newEvent: any) => {
    const iconName = newEvent.iconName || 'Target';
    await addEvent({
      title: newEvent.title,
      date: newEvent.date,
      type: newEvent.type,
      status: newEvent.status,
      icon: getIconByName(iconName),
      iconName,
    });
  };

  const handleCheckIn = (data: any) => {
    console.log('Check-in data:', data);
  };

  const handleConnectWearable = () => {
    toast.info('Интеграция с Apple Health / Google Fit скоро будет доступна');
  };

  return (
    <div 
      className="min-h-screen relative overflow-hidden pb-24"
      style={{
        background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 50%, #0f0f23 100%)',
      }}
    >
      <StarParticles />

      <HistoryHeader
        onAddClick={() => setIsQuickAddOpen(true)}
        onFilterClick={() => setIsFilterOpen(true)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
      />

      {/* Today Block */}
      <TodayCheckIn onSave={handleCheckIn} />

      {/* Wearable Widget or Empty State */}
      {hasWearable ? (
        <WearableWidget />
      ) : (
        <EmptyWearable onConnect={handleConnectWearable} />
      )}

      {/* Insights Button */}
      <div className="px-4 mb-4">
        <button
          onClick={() => setIsInsightsOpen(true)}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 transition-colors"
        >
          <BarChart3 className="w-4 h-4" />
          <span className="text-sm font-medium">Инсайты за период</span>
        </button>
      </div>

      {/* Timeline */}
      <div className="relative px-4 min-h-[400px]">
        <DNAHelix />

        {isLoading ? (
          <div className="relative z-10 grid grid-cols-2 gap-x-12 gap-y-6 pt-4">
            <div className="flex flex-col gap-6">
              {[1, 2, 3].map((i) => (
                <Skeleton key={`left-skeleton-${i}`} className="w-[140px] h-[150px] rounded-2xl bg-white/10" />
              ))}
            </div>
            <div className="flex flex-col gap-6">
              {[1, 2, 3].map((i) => (
                <Skeleton key={`right-skeleton-${i}`} className="w-[140px] h-[150px] rounded-2xl bg-white/10 ml-auto" />
              ))}
            </div>
          </div>
        ) : isTimelineEmpty ? (
          <EmptyTimeline
            onAddEvent={() => setIsQuickAddOpen(true)}
            onCheckIn={() => setCheckInExpanded(true)}
          />
        ) : (
          <div className="relative z-10 grid grid-cols-2 gap-x-12 gap-y-6 pt-4">
            <div className="flex flex-col gap-6">
              {leftTimelineEvents.map((event, i) => (
                <TimelineEvent
                  key={`left-${event.id || event.title}-${i}`}
                  {...event}
                  index={i}
                  onClick={() => handleCardClick(event)}
                  onDelete={deleteEvent}
                  onLongPress={() => handleLongPress(event)}
                />
              ))}
            </div>
            <div className="flex flex-col gap-6">
              {rightTimelineEvents.map((event, i) => (
                <TimelineEvent
                  key={`right-${event.id || event.title}-${i}`}
                  {...event}
                  index={i}
                  onClick={() => handleCardClick(event)}
                  onDelete={deleteEvent}
                  onLongPress={() => handleLongPress(event)}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Smart Suggestion */}
      <SmartSuggestion
        isVisible={showSuggestion && !isTimelineEmpty}
        message="Похоже, за 24–48ч до ПМС у тебя падает энергия. Хочешь включить режим поддержки на 3 дня?"
        onDismiss={() => setShowSuggestion(false)}
        onAccept={() => {
          toast.success('Режим поддержки активирован!');
          setShowSuggestion(false);
        }}
        onExplain={() => handleAITwinSync('Почему ты думаешь, что у меня падает энергия перед ПМС?')}
      />

      {/* Modals */}
      <FilterModal
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        filters={filters}
        onApply={setFilters}
      />

      <QuickAddScreen
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
        onAdd={handleAddEvent}
      />

      <AddEventScreen
        isOpen={isDetailedAddOpen}
        onClose={() => setIsDetailedAddOpen(false)}
        onAdd={handleAddEvent}
      />

      <EventDetailsModal
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        event={selectedEvent}
        onAITwinSync={handleAITwinSync}
        onDelete={deleteEvent}
      />

      <PeriodInsightsModal
        isOpen={isInsightsOpen}
        onClose={() => setIsInsightsOpen(false)}
        dateRange="16–22 декабря 2024"
        onAskAI={handleAITwinSync}
      />

      <QuickActionsSheet
        isOpen={!!quickActionsEvent}
        onClose={() => setQuickActionsEvent(null)}
        eventTitle={quickActionsEvent?.title || ''}
        onEdit={() => toast.info('Редактирование...')}
        onHide={() => toast.info('Скрыто')}
        onConvertToPlan={() => toast.info('Преобразовано в план')}
        onMarkImportant={() => toast.success('Отмечено как важное')}
        onDelete={() => {
          if (quickActionsEvent?.id) deleteEvent(quickActionsEvent.id);
        }}
      />
    </div>
  );
};

export default HistoryPage;
