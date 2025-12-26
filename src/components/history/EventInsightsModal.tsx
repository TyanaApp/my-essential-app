import { motion, AnimatePresence } from 'framer-motion';
import { X, TrendingUp, TrendingDown, Brain, FileText, Calendar, Activity } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, Legend, Area, AreaChart } from 'recharts';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

export type EventType = 'trigger' | 'goal' | 'stress_peak';

interface EventInsightsModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: {
    id: string;
    title: string;
    date: string;
    type: EventType;
    status?: string;
  } | null;
  onAskAI: (message: string) => void;
  onViewDetails: () => void;
}

// Mock data for charts
const generateStressData = (title: string) => [
  { period: 'Before', stress: 35, sleep: 7.5 },
  { period: 'Start', stress: 55, sleep: 6.0 },
  { period: 'Peak', stress: 75, sleep: 5.0 },
  { period: 'After', stress: 45, sleep: 6.5 },
  { period: 'Now', stress: 30, sleep: 7.2 },
];

const generateProgressData = () => [
  { week: 'Week 1', progress: 10, energy: 70 },
  { week: 'Week 2', progress: 25, energy: 65 },
  { week: 'Week 3', progress: 45, energy: 60 },
  { week: 'Week 4', progress: 60, energy: 55 },
  { week: 'Week 5', progress: 75, energy: 62 },
  { week: 'Week 6', progress: 85, energy: 68 },
];

const EventInsightsModal = ({
  isOpen,
  onClose,
  event,
  onAskAI,
  onViewDetails,
}: EventInsightsModalProps) => {
  const { language } = useLanguage();

  if (!event) return null;

  const isRussian = language === 'ru';
  const isTriggerOrStress = event.type === 'trigger' || event.type === 'stress_peak';
  const chartData = isTriggerOrStress ? generateStressData(event.title) : generateProgressData();

  const getAIInsight = () => {
    if (isRussian) {
      if (event.type === 'trigger') {
        return `Анализ показал, что во время "${event.title}" твой уровень стресса вырос на 30%, а качество глубокого сна упало на 25%. Учтем это для будущих проектов и подготовим план восстановления.`;
      } else if (event.type === 'goal') {
        return `Твоя подготовка к "${event.title}" идет хорошо! Уровень энергии стабилен, но рекомендую увеличить время восстановления между тренировками для оптимального результата.`;
      } else {
        return `Обнаружен пик стресса "${event.title}". HRV снизился на 15%, пульс покоя вырос. Рекомендую технику дыхания 4-7-8 и ранний отход ко сну следующие 3 дня.`;
      }
    } else {
      if (event.type === 'trigger') {
        return `Analysis shows that during "${event.title}", your stress level increased by 30% and deep sleep quality dropped by 25%. We'll consider this for future projects.`;
      } else if (event.type === 'goal') {
        return `Your preparation for "${event.title}" is going well! Energy levels are stable, but I recommend increasing recovery time for optimal results.`;
      } else {
        return `Stress peak detected: "${event.title}". HRV decreased by 15%, resting heart rate increased. I recommend 4-7-8 breathing technique and early sleep for the next 3 days.`;
      }
    }
  };

  const typeConfig = {
    trigger: {
      color: 'text-rose-400',
      bgColor: 'bg-rose-500/20',
      borderColor: 'border-rose-500/40',
      chartColor: '#f43f5e',
    },
    goal: {
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/20',
      borderColor: 'border-emerald-500/40',
      chartColor: '#10b981',
    },
    stress_peak: {
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/20',
      borderColor: 'border-amber-500/40',
      chartColor: '#f59e0b',
    },
  };

  const config = typeConfig[event.type];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

          {/* Modal */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className={cn(
              'relative w-full max-w-lg max-h-[85vh] overflow-y-auto',
              'rounded-3xl border backdrop-blur-xl',
              'bg-gradient-to-br from-slate-900/95 via-slate-800/95 to-slate-900/95',
              config.borderColor
            )}
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors z-10"
            >
              <X className="w-5 h-5 text-white/70" />
            </button>

            <div className="p-6">
              {/* Header */}
              <div className="flex items-center gap-3 mb-6">
                <div className={cn('p-3 rounded-xl', config.bgColor)}>
                  <Activity className={cn('w-6 h-6', config.color)} />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white">{event.title}</h2>
                  <div className="flex items-center gap-2 text-white/50 text-sm">
                    <Calendar className="w-4 h-4" />
                    <span>{event.date}</span>
                  </div>
                </div>
              </div>

              {/* Chart */}
              <div className={cn(
                'rounded-2xl p-4 mb-6',
                'bg-white/5 border border-white/10'
              )}>
                <h3 className="text-sm font-medium text-white/70 mb-4 flex items-center gap-2">
                  {isTriggerOrStress ? (
                    <>
                      <TrendingDown className="w-4 h-4 text-rose-400" />
                      {isRussian ? 'Стресс vs Качество сна' : 'Stress vs Sleep Quality'}
                    </>
                  ) : (
                    <>
                      <TrendingUp className="w-4 h-4 text-emerald-400" />
                      {isRussian ? 'Прогресс и энергия' : 'Progress & Energy'}
                    </>
                  )}
                </h3>
                
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    {isTriggerOrStress ? (
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient id="stressGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="sleepGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <XAxis 
                          dataKey="period" 
                          stroke="#ffffff40" 
                          fontSize={10}
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis 
                          stroke="#ffffff40" 
                          fontSize={10}
                          tickLine={false}
                          axisLine={false}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'rgba(15, 23, 42, 0.9)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '12px',
                            color: 'white',
                          }}
                        />
                        <Legend 
                          wrapperStyle={{ fontSize: '10px', color: '#ffffff80' }}
                        />
                        <Area
                          type="monotone"
                          dataKey="stress"
                          stroke="#f43f5e"
                          strokeWidth={2}
                          fill="url(#stressGradient)"
                          name={isRussian ? 'Стресс %' : 'Stress %'}
                        />
                        <Area
                          type="monotone"
                          dataKey="sleep"
                          stroke="#3b82f6"
                          strokeWidth={2}
                          fill="url(#sleepGradient)"
                          name={isRussian ? 'Сон (ч)' : 'Sleep (h)'}
                        />
                      </AreaChart>
                    ) : (
                      <LineChart data={chartData}>
                        <XAxis 
                          dataKey="week" 
                          stroke="#ffffff40" 
                          fontSize={10}
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis 
                          stroke="#ffffff40" 
                          fontSize={10}
                          tickLine={false}
                          axisLine={false}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'rgba(15, 23, 42, 0.9)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '12px',
                            color: 'white',
                          }}
                        />
                        <Legend 
                          wrapperStyle={{ fontSize: '10px', color: '#ffffff80' }}
                        />
                        <Line
                          type="monotone"
                          dataKey="progress"
                          stroke="#10b981"
                          strokeWidth={2}
                          dot={{ fill: '#10b981', r: 4 }}
                          name={isRussian ? 'Прогресс %' : 'Progress %'}
                        />
                        <Line
                          type="monotone"
                          dataKey="energy"
                          stroke="#8b5cf6"
                          strokeWidth={2}
                          dot={{ fill: '#8b5cf6', r: 4 }}
                          name={isRussian ? 'Энергия %' : 'Energy %'}
                        />
                      </LineChart>
                    )}
                  </ResponsiveContainer>
                </div>
              </div>

              {/* AI Insight */}
              <div className={cn(
                'rounded-2xl p-4 mb-6',
                'bg-gradient-to-br from-purple-500/10 to-blue-500/10',
                'border border-purple-500/20'
              )}>
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-purple-500/20">
                    <Brain className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-purple-300 mb-2">
                      {isRussian ? 'AI Twin анализ' : 'AI Twin Analysis'}
                    </h4>
                    <p className="text-sm text-white/70 leading-relaxed">
                      {getAIInsight()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-3">
                <Button
                  onClick={() => onAskAI(`${isRussian ? 'Расскажи подробнее про' : 'Tell me more about'} ${event.title}`)}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white"
                >
                  <Brain className="w-4 h-4 mr-2" />
                  {isRussian ? 'Спросить AI Twin' : 'Ask AI Twin'}
                </Button>
                
                <Button
                  onClick={onViewDetails}
                  variant="outline"
                  className="w-full border-white/20 text-white hover:bg-white/10"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  {isRussian ? 'Просмотреть детальный отчет' : 'View Detailed Report'}
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default EventInsightsModal;
