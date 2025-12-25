import React from 'react';
import { Moon, Heart, Activity, Flame, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface WearableData {
  sleep: { value: string; trend: 'up' | 'down' | 'stable' };
  hrv: { value: string; trend: 'up' | 'down' | 'stable' };
  pulse: { value: string; trend: 'up' | 'down' | 'stable' };
  activity: { value: string; trend: 'up' | 'down' | 'stable' };
}

interface WearableWidgetProps {
  data?: WearableData;
}

const defaultData: WearableData = {
  sleep: { value: '7.2ч', trend: 'up' },
  hrv: { value: '45мс', trend: 'down' },
  pulse: { value: '68', trend: 'stable' },
  activity: { value: '8.2k', trend: 'up' },
};

const TrendIcon = ({ trend }: { trend: 'up' | 'down' | 'stable' }) => {
  if (trend === 'up') return <TrendingUp className="w-3 h-3 text-green-400" />;
  if (trend === 'down') return <TrendingDown className="w-3 h-3 text-red-400" />;
  return <Minus className="w-3 h-3 text-gray-400" />;
};

const WearableWidget: React.FC<WearableWidgetProps> = ({ data = defaultData }) => {
  const metrics = [
    { key: 'sleep', icon: Moon, label: 'Сон', ...data.sleep, color: 'from-indigo-500 to-purple-500' },
    { key: 'hrv', icon: Heart, label: 'HRV', ...data.hrv, color: 'from-pink-500 to-rose-500' },
    { key: 'pulse', icon: Activity, label: 'Пульс', ...data.pulse, color: 'from-red-500 to-orange-500' },
    { key: 'activity', icon: Flame, label: 'Шаги', ...data.activity, color: 'from-orange-500 to-yellow-500' },
  ];

  return (
    <div className="mx-4 mb-4 p-3 rounded-2xl bg-white/5 border border-white/10">
      <div className="grid grid-cols-4 gap-2">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <div key={metric.key} className="flex flex-col items-center gap-1">
              <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${metric.color} flex items-center justify-center opacity-80`}>
                <Icon className="w-4 h-4 text-white" />
              </div>
              <div className="flex items-center gap-0.5">
                <span className="text-sm font-semibold text-white">{metric.value}</span>
                <TrendIcon trend={metric.trend} />
              </div>
              <span className="text-[10px] text-gray-500">{metric.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default WearableWidget;
