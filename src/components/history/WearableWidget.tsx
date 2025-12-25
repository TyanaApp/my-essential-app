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
    <div className="mx-3 mb-2 py-2 px-3 rounded-xl bg-card/50 border border-border">
      <div className="flex justify-between">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <div key={metric.key} className="flex items-center gap-1.5">
              <div className={`w-6 h-6 rounded bg-gradient-to-br ${metric.color} flex items-center justify-center opacity-80`}>
                <Icon className="w-3 h-3 text-white" />
              </div>
              <div className="flex items-center gap-0.5">
                <span className="text-xs font-semibold text-foreground">{metric.value}</span>
                <TrendIcon trend={metric.trend} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default WearableWidget;
