import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Calendar, Edit3, Trash2, EyeOff, TrendingUp, TrendingDown, Minus,
  AlertTriangle, Clock, Zap, Moon, Heart, Activity, Brain, Sparkles,
  CheckCircle, HelpCircle, AlertCircle, ChevronRight, Plus, Mic, Camera,
  FileText, Play, Shield, Phone, MessageCircle, Settings, Bell
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { TimelineEventData } from './TimelineEvent';
import { toast } from 'sonner';

interface EventDetailsScreenProps {
  isOpen: boolean;
  onClose: () => void;
  event: TimelineEventData | null;
  onAITwinSync: (message: string) => void;
  onDelete?: (eventId: string) => void;
  onEdit?: (eventId: string) => void;
}

// Mock impact data
const impactData = [
  { metric: 'Сон', icon: Moon, change: '-45 мин', detail: '2 ночи', trend: 'down', color: 'text-blue-400' },
  { metric: 'HRV', icon: Heart, change: '-8%', detail: 'ниже нормы', trend: 'down', color: 'text-pink-400' },
  { metric: 'Энергия', icon: Zap, change: '-2 балла', detail: 'утром', trend: 'down', color: 'text-yellow-400' },
  { metric: 'Стресс', icon: Brain, change: '+15%', detail: '48ч', trend: 'up', color: 'text-red-400' },
];

const impactWindow = {
  reactionStart: '6 часов',
  peak: 'День 2',
  recovery: '4-5 дней',
  hasEnoughData: true,
};

const explainabilityPoints = [
  { text: 'В 3 из 4 похожих случаев после перелёта сон снижался на 1–2 ночи', confidence: 'high' },
  { text: 'В этот период совпало: кофеин вечером + поздний ужин', confidence: 'medium' },
  { text: 'Твой HRV обычно падает на 10-15% при смене часового пояса', confidence: 'high' },
];

const playbookActions = {
  today: [
    { action: 'Ранний сон (до 22:00)', done: false },
    { action: 'Тёплая лёгкая еда', done: false },
    { action: 'Прогулка 20 мин на свежем воздухе', done: false },
  ],
  tomorrow: [
    { action: 'Лёгкая тренировка / йога', done: false },
    { action: 'Отменить интенсивную нагрузку', done: false },
  ],
};

const similarCases = [
  { title: 'Перелёт в Дубай', date: '09/23', similarity: 'сон ↓, HRV ↓', recovery: '5 дней' },
  { title: 'Командировка', date: '03/23', similarity: 'энергия ↓, стресс ↑', recovery: '3 дня' },
  { title: 'Отпуск (смена пояса)', date: '06/22', similarity: 'сон ↓', recovery: '4 дня' },
];

const dangerousSymptoms = ['температура', 'сильная боль', 'кровотечение', 'обморок', 'давление'];

const EventDetailsScreen: React.FC<EventDetailsScreenProps> = ({
  isOpen,
  onClose,
  event,
  onAITwinSync,
  onDelete,
  onEdit,
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isHypothesis, setIsHypothesis] = useState(false);
  const [notes, setNotes] = useState('');
  const [playbookApplied, setPlaybookApplied] = useState(false);

  if (!event) return null;

  const canDelete = !!event.id && !!onDelete;
  const isDangerous = dangerousSymptoms.some(s => event.title.toLowerCase().includes(s));

  const handleDelete = () => {
    if (event.id && onDelete) {
      onDelete(event.id);
      setShowDeleteConfirm(false);
      onClose();
    }
  };

  const handleApplyPlaybook = () => {
    setPlaybookApplied(true);
    toast.success('План применён! Напоминания добавлены.');
  };

  const TrendIcon = ({ trend }: { trend: string }) => {
    if (trend === 'up') return <TrendingUp className="w-4 h-4 text-red-400" />;
    if (trend === 'down') return <TrendingDown className="w-4 h-4 text-blue-400" />;
    return <Minus className="w-4 h-4 text-gray-400" />;
  };

  const ConfidenceBadge = ({ level }: { level: string }) => {
    const config = {
      high: { icon: CheckCircle, text: 'Высокая', color: 'bg-green-500/20 text-green-400' },
      medium: { icon: HelpCircle, text: 'Средняя', color: 'bg-yellow-500/20 text-yellow-400' },
      low: { icon: AlertCircle, text: 'Низкая', color: 'bg-orange-500/20 text-orange-400' },
    }[level] || { icon: HelpCircle, text: 'Неизвестно', color: 'bg-gray-500/20 text-gray-400' };
    
    const Icon = config.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${config.color}`}>
        <Icon className="w-3 h-3" />
        {config.text}
      </span>
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          <motion.div
            className="fixed inset-x-0 bottom-0 z-50 max-h-[95vh] overflow-y-auto"
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            <div
              className="rounded-t-3xl"
              style={{
                background: 'linear-gradient(180deg, #1e1e2f 0%, #151521 100%)',
              }}
            >
              <div className="sticky top-0 z-10 pt-3 pb-2 px-5 rounded-t-3xl" style={{ background: 'linear-gradient(180deg, #1e1e2f 0%, rgba(30,30,47,0.95) 100%)' }}>
                <div className="w-12 h-1 bg-gray-600 rounded-full mx-auto mb-3" />

                {/* 1. Header */}
                <div className="flex items-start gap-3 mb-3">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                    style={{
                      background: 'linear-gradient(135deg, hsl(var(--bio-purple)), hsl(var(--bio-cyan)))',
                    }}
                  >
                    <event.icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-white text-lg truncate">{event.title}</h3>
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <Calendar className="w-3 h-3" />
                      <span>{event.date}</span>
                      <span className="px-2 py-0.5 rounded-full bg-bio-cyan/20 text-bio-cyan text-xs">
                        {event.type}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                </div>

                {/* Fact/Hypothesis toggle + action buttons */}
                <div className="flex items-center justify-between">
                  <div className="flex gap-1 p-0.5 bg-white/5 rounded-lg">
                    <button
                      onClick={() => setIsHypothesis(false)}
                      className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                        !isHypothesis ? 'bg-bio-cyan/20 text-bio-cyan' : 'text-gray-400'
                      }`}
                    >
                      Факт
                    </button>
                    <button
                      onClick={() => setIsHypothesis(true)}
                      className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                        isHypothesis ? 'bg-bio-purple/20 text-bio-purple' : 'text-gray-400'
                      }`}
                    >
                      Гипотеза
                    </button>
                  </div>
                  <div className="flex gap-1">
                    {onEdit && event.id && (
                      <button
                        onClick={() => onEdit(event.id!)}
                        className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center hover:bg-white/10"
                      >
                        <Edit3 className="w-4 h-4 text-blue-400" />
                      </button>
                    )}
                    <button className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center hover:bg-white/10">
                      <EyeOff className="w-4 h-4 text-gray-400" />
                    </button>
                    {canDelete && (
                      <button
                        onClick={() => setShowDeleteConfirm(true)}
                        className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center hover:bg-white/10"
                      >
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="px-5 pb-8 space-y-5">
                {/* 2. Impact Snapshot */}
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-white flex items-center gap-2">
                      <Activity className="w-4 h-4 text-bio-cyan" />
                      Влияние на состояние
                    </h4>
                    <span className="text-[10px] text-gray-500">vs твоя обычная неделя</span>
                  </div>
                  <div className="space-y-2">
                    {impactData.map((item, idx) => {
                      const Icon = item.icon;
                      return (
                        <div key={idx} className="flex items-center gap-3">
                          <Icon className={`w-4 h-4 ${item.color}`} />
                          <span className="text-sm text-gray-300 w-16">{item.metric}</span>
                          <span className="text-sm text-white font-medium">{item.change}</span>
                          <span className="text-xs text-gray-500">({item.detail})</span>
                          <div className="ml-auto">
                            <TrendIcon trend={item.trend} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Impact Window */}
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                  <h4 className="font-medium text-white flex items-center gap-2 mb-3">
                    <Clock className="w-4 h-4 text-bio-purple" />
                    Окно влияния
                  </h4>
                  {impactWindow.hasEnoughData ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-400">Реакция началась через:</span>
                        <span className="text-sm text-white font-medium">{impactWindow.reactionStart}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-400">Пик:</span>
                        <span className="text-sm text-white font-medium">{impactWindow.peak}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-400">Восстановление:</span>
                        <span className="text-sm text-white font-medium">{impactWindow.recovery}</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 italic">
                      Пока данных недостаточно, чтобы точно оценить окно влияния.
                    </p>
                  )}
                </div>

                {/* 4. AI Explainability */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-bio-purple/10 to-bio-cyan/5 border border-bio-purple/20">
                  <h4 className="font-medium text-white flex items-center gap-2 mb-3">
                    <Sparkles className="w-4 h-4 text-bio-cyan" />
                    Почему ИИ так думает?
                  </h4>
                  <div className="space-y-3">
                    {explainabilityPoints.map((point, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-bio-cyan mt-2 shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm text-gray-300">{point.text}</p>
                          <ConfidenceBadge level={point.confidence} />
                        </div>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => onAITwinSync(`Расскажи подробнее, почему ты думаешь что "${event.title}" так повлияло на меня?`)}
                    className="mt-3 text-xs text-bio-cyan hover:underline flex items-center gap-1"
                  >
                    Спросить подробнее
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>

                {/* 5. Personal Playbook */}
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                  <h4 className="font-medium text-white flex items-center gap-2 mb-3">
                    <Zap className="w-4 h-4 text-yellow-400" />
                    Что помогает именно тебе
                  </h4>
                  
                  <div className="space-y-3">
                    <div>
                      <span className="text-xs text-gray-500 uppercase tracking-wide">Сегодня</span>
                      <div className="mt-1.5 space-y-1.5">
                        {playbookActions.today.map((item, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-sm">
                            <div className={`w-4 h-4 rounded border ${playbookApplied ? 'bg-green-500/20 border-green-500/50' : 'border-white/20'} flex items-center justify-center`}>
                              {playbookApplied && <CheckCircle className="w-3 h-3 text-green-400" />}
                            </div>
                            <span className="text-gray-300">{item.action}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500 uppercase tracking-wide">Завтра</span>
                      <div className="mt-1.5 space-y-1.5">
                        {playbookActions.tomorrow.map((item, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-sm">
                            <div className={`w-4 h-4 rounded border ${playbookApplied ? 'bg-green-500/20 border-green-500/50' : 'border-white/20'} flex items-center justify-center`}>
                              {playbookApplied && <CheckCircle className="w-3 h-3 text-green-400" />}
                            </div>
                            <span className="text-gray-300">{item.action}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4">
                    <Button
                      onClick={handleApplyPlaybook}
                      disabled={playbookApplied}
                      className={`flex-1 ${playbookApplied ? 'bg-green-500/20 text-green-400' : 'bg-gradient-to-r from-bio-purple to-bio-cyan'} text-white`}
                    >
                      {playbookApplied ? (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          План применён
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 mr-2" />
                          Применить план
                        </>
                      )}
                    </Button>
                    <Button variant="outline" className="bg-white/5 border-white/10 text-gray-300">
                      <Settings className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* 6. Similar Cases */}
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                  <h4 className="font-medium text-white flex items-center gap-2 mb-3">
                    <Activity className="w-4 h-4 text-bio-purple" />
                    Похожие случаи
                  </h4>
                  <div className="space-y-2">
                    {similarCases.map((item, idx) => (
                      <button
                        key={idx}
                        className="w-full flex items-center gap-3 p-2.5 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-left"
                      >
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-bio-purple/30 to-bio-cyan/20 flex items-center justify-center">
                          <event.icon className="w-5 h-5 text-gray-300" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-white font-medium truncate">{item.title}</span>
                            <span className="text-xs text-gray-500">{item.date}</span>
                          </div>
                          <p className="text-xs text-gray-400">{item.similarity}</p>
                        </div>
                        <span className="text-xs text-gray-500 shrink-0">→ {item.recovery}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 7. Notes and Files */}
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                  <h4 className="font-medium text-white flex items-center gap-2 mb-3">
                    <FileText className="w-4 h-4 text-gray-400" />
                    Заметки и файлы
                  </h4>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Добавь контекст — так ИИ точнее найдёт причины..."
                    className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 min-h-[80px]"
                  />
                  <div className="flex gap-2 mt-3">
                    <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 text-gray-400 text-xs hover:bg-white/10">
                      <Mic className="w-3 h-3" />
                      Голос
                    </button>
                    <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 text-gray-400 text-xs hover:bg-white/10">
                      <Camera className="w-3 h-3" />
                      Фото
                    </button>
                    <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 text-gray-400 text-xs hover:bg-white/10">
                      <Plus className="w-3 h-3" />
                      Файл
                    </button>
                  </div>
                </div>

                {/* 8. Medical Safety Warning */}
                {isDangerous && (
                  <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center shrink-0">
                        <Shield className="w-5 h-5 text-red-400" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-red-400 mb-1">Важно для здоровья</h4>
                        <p className="text-sm text-gray-300">
                          Если боль сильная/нарастает или есть тревожные симптомы — обратись к врачу или вызови скорую помощь.
                        </p>
                        <div className="flex gap-2 mt-3">
                          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 text-xs hover:bg-red-500/30">
                            <Phone className="w-3 h-3" />
                            Позвонить врачу
                          </button>
                          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 text-gray-400 text-xs hover:bg-white/10">
                            <Bell className="w-3 h-3" />
                            Напомнить позже
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Ask AI Twin button */}
                <Button
                  onClick={() => onAITwinSync(`Проанализируй событие "${event.title}" (${event.date}) и дай мне рекомендации.`)}
                  className="w-full bg-gradient-to-r from-bio-purple to-bio-cyan hover:opacity-90 text-white"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Обсудить с AI Twin
                </Button>
              </div>
            </div>
          </motion.div>

          <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
            <AlertDialogContent className="bg-[#1e1e2f] border-white/10">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-white flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                  Удалить событие
                </AlertDialogTitle>
                <AlertDialogDescription className="text-gray-400">
                  Вы уверены, что хотите удалить "{event.title}"? Это действие необратимо.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="bg-white/10 border-white/10 text-white hover:bg-white/20">
                  Отмена
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-red-500 text-white hover:bg-red-600"
                >
                  Удалить
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}
    </AnimatePresence>
  );
};

export default EventDetailsScreen;
