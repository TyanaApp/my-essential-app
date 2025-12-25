import React, { useState, useCallback, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { BarChart3, Shield } from 'lucide-react';

import HistoryHeader from '@/components/history/HistoryHeader';
import TodayCheckIn from '@/components/history/TodayCheckIn';
import WearableWidget from '@/components/history/WearableWidget';
import EmptyWearable from '@/components/history/EmptyWearable';
import EmptyTimeline from '@/components/history/EmptyTimeline';
import TimelineEvent, { TimelineEventData, EventType } from '@/components/history/TimelineEvent';
import FilterModal, { FilterState } from '@/components/history/FilterModal';
import SmartSuggestion from '@/components/history/SmartSuggestion';
import EventDetailsScreen from '@/components/history/EventDetailsScreen';
import QuickAddScreen from '@/components/history/QuickAddScreen';
import AddEventScreen from '@/components/history/AddEventScreen';
import PeriodInsightsModal from '@/components/history/PeriodInsightsModal';
import QuickActionsSheet from '@/components/history/QuickActionsSheet';
import AIInsightsPanel from '@/components/history/AIInsightsPanel';
import CreatePlanSheet from '@/components/history/CreatePlanSheet';
import PrivacySettings, { PrivacySettingsState } from '@/components/history/PrivacySettings';
import GentleReturnPrompt from '@/components/history/GentleReturnPrompt';
import InsightRecalculating from '@/components/history/InsightRecalculating';
import { useLifeEvents, getIconByName } from '@/hooks/useLifeEvents';
import { Skeleton } from '@/components/ui/skeleton';
import { DetectionType } from '@/components/history/AIDetectionCard';

const DNA3DHelix = React.lazy(() => import('@/components/timeline/DNA3DHelix'));

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
  const [isPlanSheetOpen, setIsPlanSheetOpen] = useState(false);
  const [planEventTitle, setPlanEventTitle] = useState('');
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [showReturnPrompt, setShowReturnPrompt] = useState(true);
  const [daysMissed] = useState(3);

  const [privacySettings, setPrivacySettings] = useState<PrivacySettingsState>({
    cycleTracking: true,
    intimateTopics: false,
    pregnancyMode: false,
    privateEventsEnabled: true,
    biometricLock: false,
    hideFromShared: false,
  });

  const [filters, setFilters] = useState<FilterState>({
    types: [],
    impacts: [],
    confidence: 'all',
    showPrivate: false,
  });

  const [detections, setDetections] = useState<{
    id: string;
    type: DetectionType;
    title: string;
    description: string;
    confidence: 'high' | 'medium' | 'low';
    detectedAt: string;
  }[]>([
    {
      id: 'det-1',
      type: 'stress_peak',
      title: 'Стресс-пик обнаружен',
      description: 'За последние 48ч HRV снизился на 15%, а пульс покоя вырос.',
      confidence: 'high',
      detectedAt: 'Сегодня, 10:30',
    },
    {
      id: 'det-2',
      type: 'poor_sleep',
      title: 'Плохой сон 3 ночи подряд',
      description: 'Среднее время сна за 3 ночи — 5.5ч вместо обычных 7ч.',
      confidence: 'high',
      detectedAt: 'Вчера',
    },
  ]);

  const [hypotheses, setHypotheses] = useState<{
    id: string;
    cause: string;
    effect: string;
    lag: string;
    occurrences: number;
    totalCases: number;
    confidence: 'high' | 'medium' | 'low';
    explanation: string;
    userFeedback?: 'confirmed' | 'denied' | null;
  }[]>([
    {
      id: 'hyp-1',
      cause: 'Недосып (<6ч)',
      effect: 'Тревожность',
      lag: '12-24ч',
      occurrences: 7,
      totalCases: 9,
      confidence: 'high',
      explanation: 'В 7 из 9 случаев после сна <6ч была тревожность.',
      userFeedback: null,
    },
  ]);

  const isTimelineEmpty = !isLoading && leftEvents.length === 0 && rightEvents.length === 0;

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
  const allEvents = [...leftTimelineEvents, ...rightTimelineEvents];

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

  const handleConfirmDetection = (id: string) => {
    setDetections(prev => prev.filter(d => d.id !== id));
    toast.success('Событие подтверждено');
  };

  const handleDenyDetection = (id: string) => {
    setDetections(prev => prev.filter(d => d.id !== id));
    toast('Хорошо, буду точнее', { icon: '👌' });
  };

  const handleDetectionDetails = (id: string) => {
    const detection = detections.find(d => d.id === id);
    if (detection) {
      handleAITwinSync(`Расскажи про ${detection.title}`);
    }
  };

  const handleConfirmHypothesis = (id: string) => {
    setHypotheses(prev => prev.map(h => 
      h.id === id ? { ...h, userFeedback: 'confirmed' as const } : h
    ));
    toast.success('Связь подтверждена!');
  };

  const handleDenyHypothesis = (id: string) => {
    setHypotheses(prev => prev.map(h => 
      h.id === id ? { ...h, userFeedback: 'denied' as const } : h
    ));
    toast('Связь ослаблена', { icon: '📝' });
  };

  const handleOpenPlanSheet = (eventTitle?: string) => {
    setPlanEventTitle(eventTitle || '');
    setIsPlanSheetOpen(true);
  };

  const handleCreatePlan = (items: string[], reminders: { id: string; time: string }[]) => {
    toast.success(`План создан! ${reminders.length} напоминаний.`);
  };

  const handleSavePrivacy = (settings: PrivacySettingsState) => {
    setPrivacySettings(settings);
    toast.success('Настройки сохранены');
  };

  const handleDeleteWithRecalc = useCallback(async (id: string) => {
    setIsRecalculating(true);
    await deleteEvent(id);
    setTimeout(() => {
      setIsRecalculating(false);
      toast.success('Инсайты обновлены');
    }, 1500);
  }, [deleteEvent]);

  return (
    <div className="min-h-screen relative overflow-hidden pb-24">
      <HistoryHeader
        onAddClick={() => setIsQuickAddOpen(true)}
        onFilterClick={() => setIsFilterOpen(true)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
      />

      <GentleReturnPrompt
        isVisible={showReturnPrompt && daysMissed > 0 && !isTimelineEmpty}
        daysMissed={daysMissed}
        onDismiss={() => setShowReturnPrompt(false)}
        onCheckIn={() => {
          setShowReturnPrompt(false);
          setCheckInExpanded(true);
        }}
      />

      {/* Main Layout: DNA in center, content around it */}
      <div className="relative px-2">
        {/* 3D DNA Helix - Center */}
        <div className="relative h-[600px] flex items-center justify-center">
          <Suspense fallback={
            <div className="w-full h-full flex items-center justify-center">
              <div className="w-16 h-16 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          }>
            <DNA3DHelix />
          </Suspense>
          
          {/* Left Side Cards */}
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[42%] space-y-3 pl-2 max-h-[500px] overflow-y-auto scrollbar-hide">
            {/* Today Check-in Compact */}
            <div className="transform scale-90 origin-left">
              <TodayCheckIn onSave={handleCheckIn} />
            </div>
            
            {/* Wearable */}
            <div className="transform scale-90 origin-left">
              {hasWearable ? (
                <WearableWidget />
              ) : (
                <EmptyWearable onConnect={handleConnectWearable} />
              )}
            </div>
            
            {/* Left Events */}
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2].map((i) => (
                  <Skeleton key={`left-sk-${i}`} className="w-full h-[100px] rounded-xl bg-primary/10" />
                ))}
              </div>
            ) : (
              leftTimelineEvents.slice(0, 3).map((event, i) => (
                <div key={`left-${event.id}-${i}`} className="transform scale-90 origin-left">
                  <TimelineEvent
                    {...event}
                    index={i}
                    onClick={() => handleCardClick(event)}
                    onDelete={handleDeleteWithRecalc}
                    onLongPress={() => handleLongPress(event)}
                  />
                </div>
              ))
            )}
          </div>
          
          {/* Right Side Cards */}
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[42%] space-y-3 pr-2 max-h-[500px] overflow-y-auto scrollbar-hide">
            {/* AI Insights Compact */}
            <div className="transform scale-90 origin-right">
              <AIInsightsPanel
                detections={detections}
                hypotheses={hypotheses}
                onConfirmDetection={handleConfirmDetection}
                onDenyDetection={handleDenyDetection}
                onDetectionDetails={handleDetectionDetails}
                onConfirmHypothesis={handleConfirmHypothesis}
                onDenyHypothesis={handleDenyHypothesis}
              />
            </div>
            
            {/* Right Events */}
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2].map((i) => (
                  <Skeleton key={`right-sk-${i}`} className="w-full h-[100px] rounded-xl bg-primary/10" />
                ))}
              </div>
            ) : (
              rightTimelineEvents.slice(0, 3).map((event, i) => (
                <div key={`right-${event.id}-${i}`} className="transform scale-90 origin-right">
                  <TimelineEvent
                    {...event}
                    index={i}
                    onClick={() => handleCardClick(event)}
                    onDelete={handleDeleteWithRecalc}
                    onLongPress={() => handleLongPress(event)}
                  />
                </div>
              ))
            )}
          </div>
        </div>
        
        {/* Action Buttons - Below DNA */}
        <div className="flex justify-center gap-3 mt-2">
          <button
            onClick={() => setIsInsightsOpen(true)}
            className="flex items-center gap-1.5 py-2 px-4 rounded-full bg-primary/20 border border-primary/40 text-primary hover:bg-primary/30 transition-all shadow-[0_0_15px_rgba(168,85,247,0.3)]"
          >
            <BarChart3 className="w-4 h-4" />
            <span className="text-xs font-medium">Инсайты</span>
          </button>
          <button
            onClick={() => setIsPrivacyOpen(true)}
            className="flex items-center gap-1.5 py-2 px-4 rounded-full bg-secondary/50 border border-border text-muted-foreground hover:bg-secondary transition-all"
          >
            <Shield className="w-4 h-4" />
            <span className="text-xs font-medium">Приватность</span>
          </button>
        </div>
        
        {/* Empty State */}
        {isTimelineEmpty && !isLoading && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="pointer-events-auto">
              <EmptyTimeline
                onAddEvent={() => setIsQuickAddOpen(true)}
                onCheckIn={() => setCheckInExpanded(true)}
              />
            </div>
          </div>
        )}
      </div>

      <SmartSuggestion
        isVisible={showSuggestion && !isTimelineEmpty}
        message="За 24–48ч до ПМС у тебя падает энергия. Включить режим поддержки?"
        onDismiss={() => setShowSuggestion(false)}
        onAccept={() => {
          toast.success('Режим поддержки активирован!');
          setShowSuggestion(false);
        }}
        onExplain={() => handleAITwinSync('Почему падает энергия перед ПМС?')}
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

      <EventDetailsScreen
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
        onConvertToPlan={() => {
          handleOpenPlanSheet(quickActionsEvent?.title);
          setQuickActionsEvent(null);
        }}
        onMarkImportant={() => toast.success('Отмечено как важное')}
        onDelete={() => {
          if (quickActionsEvent?.id) handleDeleteWithRecalc(quickActionsEvent.id);
          setQuickActionsEvent(null);
        }}
      />

      <CreatePlanSheet
        isOpen={isPlanSheetOpen}
        onClose={() => setIsPlanSheetOpen(false)}
        eventTitle={planEventTitle}
        onCreatePlan={handleCreatePlan}
      />

      <PrivacySettings
        isOpen={isPrivacyOpen}
        onClose={() => setIsPrivacyOpen(false)}
        settings={privacySettings}
        onSave={handleSavePrivacy}
      />

      <InsightRecalculating isVisible={isRecalculating} />
    </div>
  );
};

export default HistoryPage;
