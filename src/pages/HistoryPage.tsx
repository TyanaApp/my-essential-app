import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { BarChart3, Shield } from 'lucide-react';

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
  const [daysMissed] = useState(3); // Example: would come from last check-in date

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

  // AI Detection States
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
      description: 'За последние 48ч HRV снизился на 15%, а пульс покоя вырос. Это может указывать на повышенный стресс.',
      confidence: 'high',
      detectedAt: 'Сегодня, 10:30',
    },
    {
      id: 'det-2',
      type: 'poor_sleep',
      title: 'Плохой сон 3 ночи подряд',
      description: 'Среднее время сна за 3 ночи — 5.5ч вместо твоих обычных 7ч. Это может повлиять на энергию и настроение.',
      confidence: 'high',
      detectedAt: 'Вчера',
    },
    {
      id: 'det-3',
      type: 'pms_window',
      title: 'ПМС-окно через 2 дня',
      description: 'На основе твоего цикла, через 2 дня начнётся период, когда ты обычно чувствуешь усталость.',
      confidence: 'medium',
      detectedAt: 'Сегодня',
    },
  ]);

  // AI Hypotheses States  
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
      explanation: 'В 7 из 9 случаев, когда ты спала менее 6 часов, на следующий день ты отмечала повышенную тревожность. Лаг обычно составляет 12-24 часа.',
      userFeedback: null,
    },
    {
      id: 'hyp-2',
      cause: 'Вечерний кофеин',
      effect: 'Плохой сон',
      lag: '4-8ч',
      occurrences: 5,
      totalCases: 8,
      confidence: 'medium',
      explanation: 'Когда ты пила кофе после 16:00, в 5 из 8 случаев качество сна было ниже обычного. Время засыпания увеличивалось на 20-40 минут.',
      userFeedback: null,
    },
    {
      id: 'hyp-3',
      cause: 'ПМС-окно',
      effect: 'Падение энергии',
      lag: '48ч до начала',
      occurrences: 4,
      totalCases: 4,
      confidence: 'high',
      explanation: 'Во всех 4 отслеженных циклах за 2 дня до начала месячных твоя энергия падала на 20-30%. Это типичный паттерн, связанный с гормональными изменениями.',
      userFeedback: null,
    },
  ]);

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

  // AI Detection Handlers
  const handleConfirmDetection = (id: string) => {
    setDetections(prev => prev.filter(d => d.id !== id));
    toast.success('Событие подтверждено и добавлено в таймлайн');
  };

  const handleDenyDetection = (id: string) => {
    setDetections(prev => prev.filter(d => d.id !== id));
    toast('Хорошо, я буду точнее в следующий раз', { icon: '👌' });
  };

  const handleDetectionDetails = (id: string) => {
    const detection = detections.find(d => d.id === id);
    if (detection) {
      handleAITwinSync(`Расскажи подробнее про обнаруженный ${detection.title}`);
    }
  };

  // AI Hypothesis Handlers
  const handleConfirmHypothesis = (id: string) => {
    setHypotheses(prev => prev.map(h => 
      h.id === id ? { ...h, userFeedback: 'confirmed' as const } : h
    ));
    toast.success('Связь подтверждена! Я буду учитывать это.');
  };

  const handleDenyHypothesis = (id: string) => {
    setHypotheses(prev => prev.map(h => 
      h.id === id ? { ...h, userFeedback: 'denied' as const } : h
    ));
    toast('Связь ослаблена. Спасибо за обратную связь!', { icon: '📝' });
  };

  // Plan Handlers
  const handleOpenPlanSheet = (eventTitle?: string) => {
    setPlanEventTitle(eventTitle || '');
    setIsPlanSheetOpen(true);
  };

  const handleCreatePlan = (items: string[], reminders: { id: string; time: string }[]) => {
    console.log('Creating plan with items:', items, 'reminders:', reminders);
    toast.success(`План создан! Добавлено ${reminders.length} напоминаний.`);
  };

  // Privacy Handlers
  const handleSavePrivacy = (settings: PrivacySettingsState) => {
    setPrivacySettings(settings);
    toast.success('Настройки приватности сохранены');
  };

  // Enhanced delete with recalculation
  const handleDeleteWithRecalc = useCallback(async (id: string) => {
    setIsRecalculating(true);
    await deleteEvent(id);
    
    // Simulate insight recalculation
    setTimeout(() => {
      setIsRecalculating(false);
      toast.success('Инсайты обновлены');
    }, 1500);
  }, [deleteEvent]);

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

      {/* Gentle Return Prompt */}
      <GentleReturnPrompt
        isVisible={showReturnPrompt && daysMissed > 0 && !isTimelineEmpty}
        daysMissed={daysMissed}
        onDismiss={() => setShowReturnPrompt(false)}
        onCheckIn={() => {
          setShowReturnPrompt(false);
          setCheckInExpanded(true);
        }}
      />

      {/* Today Block */}
      <TodayCheckIn onSave={handleCheckIn} />

      {/* Wearable Widget or Empty State */}
      {hasWearable ? (
        <WearableWidget />
      ) : (
        <EmptyWearable onConnect={handleConnectWearable} />
      )}

      {/* AI Insights Panel */}
      <AIInsightsPanel
        detections={detections}
        hypotheses={hypotheses}
        onConfirmDetection={handleConfirmDetection}
        onDenyDetection={handleDenyDetection}
        onDetectionDetails={handleDetectionDetails}
        onConfirmHypothesis={handleConfirmHypothesis}
        onDenyHypothesis={handleDenyHypothesis}
      />

      {/* Action Buttons */}
      <div className="px-4 mb-4 flex gap-3">
        <button
          onClick={() => setIsInsightsOpen(true)}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 transition-colors"
        >
          <BarChart3 className="w-4 h-4" />
          <span className="text-sm font-medium">Инсайты</span>
        </button>
        <button
          onClick={() => setIsPrivacyOpen(true)}
          className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 transition-colors"
        >
          <Shield className="w-4 h-4" />
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
                  onDelete={handleDeleteWithRecalc}
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
                  onDelete={handleDeleteWithRecalc}
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

      {/* Recalculating Indicator */}
      <InsightRecalculating isVisible={isRecalculating} />
    </div>
  );
};

export default HistoryPage;
