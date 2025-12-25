import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, TrendingUp, TrendingDown, Zap, Moon, Brain, Activity, Sparkles, 
  ChevronRight, Calendar, Target, CheckCircle, AlertTriangle, Clock,
  ArrowRight, Star, Lightbulb, Play
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
} from 'recharts';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface PeriodInsightsModalProps {
  isOpen: boolean;
  onClose: () => void;
  dateRange: string;
  onAskAI: (question: string) => void;
}

// 30 days trend data
const monthlyTrendData = [
  { day: '1', sleep: 7.2, energy: 70, stress: 40, pain: 2 },
  { day: '5', sleep: 6.8, energy: 65, stress: 50, pain: 3 },
  { day: '10', sleep: 6.5, energy: 55, stress: 65, pain: 4 },
  { day: '15', sleep: 7.0, energy: 60, stress: 55, pain: 3 },
  { day: '20', sleep: 5.5, energy: 45, stress: 75, pain: 6 },
  { day: '25', sleep: 6.0, energy: 50, stress: 70, pain: 5 },
  { day: '30', sleep: 7.5, energy: 72, stress: 35, pain: 2 },
];

const trendSummary = [
  { metric: 'Сон', icon: Moon, avg: '6.6ч', trend: 'stable', change: '−15 мин', color: 'from-indigo-500 to-purple-500' },
  { metric: 'Энергия', icon: Zap, avg: '60%', trend: 'down', change: '−8%', color: 'from-yellow-500 to-orange-500' },
  { metric: 'Стресс', icon: Brain, avg: '55%', trend: 'up', change: '+12%', color: 'from-red-500 to-pink-500' },
  { metric: 'Боль', icon: Activity, avg: '3.5/10', trend: 'up', change: '+1.2', color: 'from-orange-500 to-red-500' },
];

const topInfluenceFactors = [
  {
    title: 'Недосып → тревожность на следующий день',
    lag: '12–24ч',
    confidence: 'high',
    occurrences: '7 из 9 случаев',
    description: 'Когда сон был меньше 6ч, на следующий день тревожность повышалась на 30%',
    icon: Moon,
  },
  {
    title: 'ПМС-окно: падение энергии за 2 дня до месячных',
    lag: '48ч',
    confidence: 'high',
    occurrences: '4 из 4 циклов',
    description: 'За 2 дня до начала цикла энергия стабильно падает на 25-35%',
    icon: Calendar,
  },
  {
    title: 'Вечерний кофеин → плохой сон',
    lag: '4–8ч',
    confidence: 'medium',
    occurrences: '5 из 8 случаев',
    description: 'Кофе после 16:00 коррелирует со снижением качества сна',
    icon: Activity,
  },
];

const whatWorked = [
  {
    action: 'Утренняя прогулка 20+ минут',
    effect: '+18% энергии в течение дня',
    frequency: '12 раз за месяц',
    confidence: 'high',
  },
  {
    action: 'Сон до 23:00',
    effect: '+25% качество сна, −20% стресс утром',
    frequency: '8 раз за месяц',
    confidence: 'high',
  },
  {
    action: 'Лёгкая йога в ПМС-окно',
    effect: '−30% интенсивность боли',
    frequency: '3 раза',
    confidence: 'medium',
  },
];

const PeriodInsightsModal: React.FC<PeriodInsightsModalProps> = ({
  isOpen,
  onClose,
  dateRange,
  onAskAI,
}) => {
  const [activeTab, setActiveTab] = useState<'trends' | 'factors' | 'worked'>('trends');

  const TrendIcon = ({ trend }: { trend: string }) => {
    if (trend === 'up') return <TrendingUp className="w-4 h-4 text-red-400" />;
    if (trend === 'down') return <TrendingDown className="w-4 h-4 text-blue-400" />;
    return <span className="text-gray-400 text-xs">≈</span>;
  };

  const ConfidenceBadge = ({ level }: { level: string }) => {
    const config = {
      high: { icon: CheckCircle, text: 'Высокая', color: 'bg-green-500/20 text-green-400' },
      medium: { icon: AlertTriangle, text: 'Средняя', color: 'bg-yellow-500/20 text-yellow-400' },
      low: { icon: AlertTriangle, text: 'Низкая', color: 'bg-orange-500/20 text-orange-400' },
    }[level] || { icon: AlertTriangle, text: 'Неизвестно', color: 'bg-gray-500/20 text-gray-400' };
    
    const Icon = config.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${config.color}`}>
        <Icon className="w-3 h-3" />
        {config.text}
      </span>
    );
  };

  const handleMakePlan = () => {
    toast.success('Создаём план на следующий цикл...');
    onAskAI('Создай план на следующую неделю на основе моих инсайтов за последние 30 дней');
    onClose();
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
              {/* Sticky header */}
              <div className="sticky top-0 z-10 pt-3 pb-3 px-5 rounded-t-3xl" style={{ background: 'linear-gradient(180deg, #1e1e2f 0%, rgba(30,30,47,0.98) 100%)' }}>
                <div className="w-12 h-1 bg-gray-600 rounded-full mx-auto mb-3" />

                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-white text-lg flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-bio-cyan" />
                      Инсайты за период
                    </h3>
                    <p className="text-sm text-gray-400">За последние 30 дней</p>
                  </div>
                  <button
                    onClick={onClose}
                    className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 p-1 bg-white/5 rounded-xl">
                  {[
                    { id: 'trends', label: 'Тренды', icon: TrendingUp },
                    { id: 'factors', label: 'Факторы', icon: Lightbulb },
                    { id: 'worked', label: 'Что работало', icon: Star },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-all ${
                        activeTab === tab.id
                          ? 'bg-bio-purple text-white'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      <tab.icon className="w-4 h-4" />
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="px-5 pb-8">
                {/* Trends Tab */}
                {activeTab === 'trends' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-5 pt-4"
                  >
                    {/* Trend Summary Cards */}
                    <div className="grid grid-cols-2 gap-3">
                      {trendSummary.map((item, idx) => {
                        const Icon = item.icon;
                        return (
                          <div
                            key={idx}
                            className="p-3 rounded-xl bg-white/5 border border-white/10"
                          >
                            <div className="flex items-center gap-2 mb-2">
                              <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${item.color} flex items-center justify-center opacity-80`}>
                                <Icon className="w-4 h-4 text-white" />
                              </div>
                              <span className="text-sm text-gray-300">{item.metric}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-xl font-semibold text-white">{item.avg}</span>
                              <div className="flex items-center gap-1">
                                <span className={`text-xs ${item.trend === 'up' ? 'text-red-400' : item.trend === 'down' ? 'text-blue-400' : 'text-gray-400'}`}>
                                  {item.change}
                                </span>
                                <TrendIcon trend={item.trend} />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Chart */}
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                      <h4 className="text-sm font-medium text-gray-300 mb-3">Динамика за 30 дней</h4>
                      <div className="h-56">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={monthlyTrendData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                            <XAxis
                              dataKey="day"
                              tick={{ fill: '#9ca3af', fontSize: 10 }}
                              axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                            />
                            <YAxis
                              tick={{ fill: '#9ca3af', fontSize: 10 }}
                              axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                            />
                            <Tooltip
                              contentStyle={{
                                background: '#1e1e2f',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: 8,
                              }}
                            />
                            <Legend />
                            <Line type="monotone" dataKey="energy" stroke="#facc15" strokeWidth={2} name="Энергия %" dot={false} />
                            <Line type="monotone" dataKey="stress" stroke="#ef4444" strokeWidth={2} name="Стресс %" dot={false} />
                            <Line type="monotone" dataKey="pain" stroke="#f97316" strokeWidth={2} name="Боль" dot={false} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Sleep chart */}
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                      <h4 className="text-sm font-medium text-gray-300 mb-3">Сон (часы)</h4>
                      <div className="h-32">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={monthlyTrendData}>
                            <defs>
                              <linearGradient id="sleepGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="hsl(var(--bio-purple))" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="hsl(var(--bio-purple))" stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <XAxis dataKey="day" tick={{ fill: '#9ca3af', fontSize: 10 }} axisLine={false} />
                            <YAxis domain={[4, 9]} tick={{ fill: '#9ca3af', fontSize: 10 }} axisLine={false} />
                            <Area
                              type="monotone"
                              dataKey="sleep"
                              stroke="hsl(var(--bio-purple))"
                              fillOpacity={1}
                              fill="url(#sleepGradient)"
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Factors Tab */}
                {activeTab === 'factors' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4 pt-4"
                  >
                    <p className="text-sm text-gray-400">
                      Топ-3 фактора, которые влияют на твоё состояние:
                    </p>

                    {topInfluenceFactors.map((factor, idx) => {
                      const Icon = factor.icon;
                      return (
                        <div
                          key={idx}
                          className="p-4 rounded-2xl bg-gradient-to-br from-bio-purple/10 to-bio-cyan/5 border border-bio-purple/20"
                        >
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-xl bg-bio-purple/20 flex items-center justify-center shrink-0">
                              <Icon className="w-5 h-5 text-bio-purple" />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-medium text-white text-sm mb-1">{factor.title}</h4>
                              <p className="text-xs text-gray-400 mb-2">{factor.description}</p>
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/10 text-[10px] text-gray-300">
                                  <Clock className="w-3 h-3" />
                                  Лаг: {factor.lag}
                                </span>
                                <span className="text-[10px] text-gray-500">{factor.occurrences}</span>
                                <ConfidenceBadge level={factor.confidence} />
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    <button
                      onClick={() => onAskAI('Расскажи подробнее о факторах, которые влияют на моё состояние')}
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-white/5 text-bio-cyan text-sm font-medium hover:bg-white/10 transition-colors"
                    >
                      <Sparkles className="w-4 h-4" />
                      Узнать больше от AI Twin
                    </button>
                  </motion.div>
                )}

                {/* What Worked Tab */}
                {activeTab === 'worked' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4 pt-4"
                  >
                    <p className="text-sm text-gray-400">
                      Действия, которые давали положительный эффект:
                    </p>

                    {whatWorked.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-2xl bg-white/5 border border-white/10"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center shrink-0">
                            <CheckCircle className="w-5 h-5 text-green-400" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium text-white text-sm mb-1">{item.action}</h4>
                            <p className="text-xs text-green-400 mb-2 flex items-center gap-1">
                              <ArrowRight className="w-3 h-3" />
                              {item.effect}
                            </p>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-gray-500">{item.frequency}</span>
                              <ConfidenceBadge level={item.confidence} />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Recommendation highlight */}
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-bio-cyan/10 to-bio-purple/10 border border-bio-cyan/30">
                      <div className="flex items-center gap-2 mb-2">
                        <Lightbulb className="w-5 h-5 text-bio-cyan" />
                        <span className="font-medium text-white text-sm">Рекомендация</span>
                      </div>
                      <p className="text-sm text-gray-300">
                        На основе твоих данных, утренняя прогулка и ранний сон — самые эффективные привычки. 
                        Попробуй делать их регулярно в следующем месяце.
                      </p>
                    </div>
                  </motion.div>
                )}

                {/* Make Plan Button */}
                <div className="mt-6 space-y-3">
                  <Button
                    onClick={handleMakePlan}
                    className="w-full bg-gradient-to-r from-bio-purple to-bio-cyan hover:opacity-90 text-white"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Сделать план на следующий цикл
                  </Button>
                  
                  <button
                    onClick={() => onAskAI('Проанализируй мои инсайты за 30 дней и дай рекомендации')}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-white/5 text-gray-300 text-sm hover:bg-white/10 transition-colors"
                  >
                    <Sparkles className="w-4 h-4" />
                    Обсудить с AI Twin
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default PeriodInsightsModal;
