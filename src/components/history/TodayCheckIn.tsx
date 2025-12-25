import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Zap, Smile, Activity, Brain, Moon, Check } from 'lucide-react';
import { toast } from 'sonner';

interface TodayCheckInProps {
  onSave: (data: CheckInData) => void;
}

export interface CheckInData {
  energy: number;
  mood: number;
  pain: number;
  stress: number;
  sleep: number;
}

const TodayCheckIn: React.FC<TodayCheckInProps> = ({ onSave }) => {
  const [energy, setEnergy] = useState(3);
  const [mood, setMood] = useState(3);
  const [pain, setPain] = useState(0);
  const [stress, setStress] = useState(3);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleSave = () => {
    onSave({ energy, mood, pain, stress, sleep: 7.5 }); // sleep would come from wearable
    toast.success('Чек-ин сохранён!');
    setIsExpanded(false);
  };

  const ScaleSelector = ({
    label,
    icon: Icon,
    value,
    onChange,
    max,
    color,
  }: {
    label: string;
    icon: React.ElementType;
    value: number;
    onChange: (v: number) => void;
    max: number;
    color: string;
  }) => (
    <div className="flex items-center gap-3">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}`}>
        <Icon className="w-4 h-4 text-white" />
      </div>
      <span className="text-sm text-gray-300 w-16">{label}</span>
      <div className="flex gap-1 flex-1">
        {Array.from({ length: max + 1 }, (_, i) => (
          <button
            key={i}
            onClick={() => onChange(i)}
            className={`flex-1 h-8 rounded-md text-xs font-medium transition-all ${
              value === i
                ? 'bg-bio-cyan text-white'
                : 'bg-white/5 text-gray-400 hover:bg-white/10'
            }`}
          >
            {i}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <motion.div
      className="mx-4 mb-4 rounded-2xl overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(6,182,212,0.1))',
        border: '1px solid rgba(255,255,255,0.1)',
      }}
      layout
    >
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-bio-purple to-bio-cyan flex items-center justify-center">
            <Smile className="w-5 h-5 text-white" />
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-white">Как ты сегодня?</h3>
            <p className="text-xs text-gray-400">Быстрый чек-ин за 1 тап</p>
          </div>
        </div>
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          className="text-gray-400"
        >
          ▼
        </motion.div>
      </button>

      {isExpanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="px-4 pb-4 space-y-3"
        >
          <ScaleSelector
            label="Энергия"
            icon={Zap}
            value={energy}
            onChange={setEnergy}
            max={5}
            color="bg-yellow-500/20"
          />
          <ScaleSelector
            label="Настроение"
            icon={Smile}
            value={mood}
            onChange={setMood}
            max={5}
            color="bg-green-500/20"
          />
          <ScaleSelector
            label="Боль"
            icon={Activity}
            value={pain}
            onChange={setPain}
            max={10}
            color="bg-red-500/20"
          />
          <ScaleSelector
            label="Стресс"
            icon={Brain}
            value={stress}
            onChange={setStress}
            max={5}
            color="bg-purple-500/20"
          />

          <button
            onClick={handleSave}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-bio-purple to-bio-cyan text-white font-medium flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
          >
            <Check className="w-4 h-4" />
            Сохранить
          </button>
        </motion.div>
      )}
    </motion.div>
  );
};

export default TodayCheckIn;
