import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, TrendingUp, TrendingDown, Zap, Moon, Brain, Activity, Sparkles, ChevronRight } from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface PeriodInsightsModalProps {
  isOpen: boolean;
  onClose: () => void;
  dateRange: string;
  onAskAI: (question: string) => void;
}

const weeklyData = [
  { day: 'Пн', energy: 70, stress: 45, sleep: 7.2 },
  { day: 'Вт', energy: 65, stress: 55, sleep: 6.5 },
  { day: 'Ср', energy: 55, stress: 70, sleep: 5.8 },
  { day: 'Чт', energy: 60, stress: 60, sleep: 6.2 },
  { day: 'Пт', energy: 50, stress: 75, sleep: 5.5 },
  { day: 'Сб', energy: 75, stress: 35, sleep: 8.0 },
  { day: 'Вс', energy: 80, stress: 30, sleep: 8.5 },
];

const insights = [
  {
    icon: Moon,
    title: 'Сон ухудшился',
    description: 'Среднее время сна сократилось на 45 мин за неделю',
    trend: 'down',
    color: 'from-indigo-500 to-purple-500',
  },
  {
    icon: Brain,
    title: 'Стресс пиковал',
    description: 'Пиковые значения в среду и пятницу коррелируют с дедлайнами',
    trend: 'up',
    color: 'from-red-500 to-orange-500',
  },
  {
    icon: Zap,
    title: 'Энергия восстановилась',
    description: 'К выходным энергия поднялась на 30% после отдыха',
    trend: 'up',
    color: 'from-green-500 to-emerald-500',
  },
];

const patterns = [
  'За 2 дня до дедлайна сон ухудшается на ~20%',
  'Вечерние тренировки повышают качество сна на следующий день',
  'Высокий стресс в будни компенсируется отдыхом на выходных',
];

const PeriodInsightsModal: React.FC<PeriodInsightsModalProps> = ({
  isOpen,
  onClose,
  dateRange,
  onAskAI,
}) => {
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
            className="fixed inset-x-0 bottom-0 z-50 max-h-[90vh] overflow-y-auto"
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            <div
              className="rounded-t-3xl p-5"
              style={{
                background: 'linear-gradient(180deg, #1e1e2f 0%, #151521 100%)',
              }}
            >
              <div className="w-12 h-1 bg-gray-600 rounded-full mx-auto mb-4" />

              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="font-semibold text-white text-lg">Инсайты за период</h3>
                  <p className="text-sm text-gray-400">{dateRange}</p>
                </div>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>

              {/* Chart */}
              <div className="bg-white/5 rounded-xl p-4 mb-5">
                <h4 className="text-sm font-medium text-gray-300 mb-3">Обзор недели</h4>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={weeklyData}>
                      <defs>
                        <linearGradient id="energyGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--bio-cyan))" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(var(--bio-cyan))" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="stressGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--bio-purple))" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(var(--bio-purple))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
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
                      <Area
                        type="monotone"
                        dataKey="energy"
                        stroke="hsl(var(--bio-cyan))"
                        fillOpacity={1}
                        fill="url(#energyGradient)"
                        name="Энергия"
                      />
                      <Area
                        type="monotone"
                        dataKey="stress"
                        stroke="hsl(var(--bio-purple))"
                        fillOpacity={1}
                        fill="url(#stressGradient)"
                        name="Стресс"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Key Insights */}
              <div className="mb-5">
                <h4 className="text-sm font-medium text-gray-300 mb-3">Ключевые инсайты</h4>
                <div className="space-y-3">
                  {insights.map((insight, idx) => {
                    const Icon = insight.icon;
                    return (
                      <div
                        key={idx}
                        className="flex items-start gap-3 p-3 rounded-xl bg-white/5"
                      >
                        <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${insight.color} flex items-center justify-center shrink-0 opacity-80`}>
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h5 className="font-medium text-white text-sm">{insight.title}</h5>
                            {insight.trend === 'up' ? (
                              <TrendingUp className="w-3 h-3 text-red-400" />
                            ) : (
                              <TrendingDown className="w-3 h-3 text-blue-400" />
                            )}
                          </div>
                          <p className="text-xs text-gray-400 mt-0.5">{insight.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Patterns */}
              <div className="mb-5">
                <h4 className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-bio-cyan" />
                  Замеченные паттерны
                </h4>
                <div className="space-y-2">
                  {patterns.map((pattern, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 text-sm text-gray-300 p-2 rounded-lg bg-white/5"
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-bio-cyan shrink-0" />
                      {pattern}
                    </div>
                  ))}
                </div>
              </div>

              {/* Ask AI */}
              <button
                onClick={() => onAskAI('Расскажи подробнее об инсайтах за эту неделю')}
                className="w-full flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-bio-purple/20 to-bio-cyan/20 border border-bio-purple/30 hover:border-bio-purple/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Sparkles className="w-5 h-5 text-bio-cyan" />
                  <span className="text-white font-medium">Спросить AI Twin подробнее</span>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default PeriodInsightsModal;
