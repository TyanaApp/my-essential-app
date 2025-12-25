import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Zap, Smile, Activity, Brain, Check } from 'lucide-react';
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
    onSave({ energy, mood, pain, stress, sleep: 7.5 });
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
    <div className="flex items-center gap-2">
      <div className={`w-6 h-6 rounded flex items-center justify-center ${color}`}>
        <Icon className="w-3 h-3 text-foreground" />
      </div>
      <span className="text-xs text-muted-foreground w-14">{label}</span>
      <div className="flex gap-0.5 flex-1">
        {Array.from({ length: max + 1 }, (_, i) => (
          <button
            key={i}
            onClick={() => onChange(i)}
            className={`flex-1 h-6 rounded text-[10px] font-medium transition-all ${
              value === i
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
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
      className="mx-3 mb-2 rounded-xl overflow-hidden bg-card border border-border"
      layout
    >
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full py-2 px-3 flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary/20 flex items-center justify-center">
            <Smile className="w-4 h-4 text-primary" />
          </div>
          <span className="text-sm font-medium text-card-foreground">Как ты?</span>
        </div>
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          className="text-muted-foreground text-xs"
        >
          ▼
        </motion.div>
      </button>

      {isExpanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="px-3 pb-2 space-y-2"
        >
          <ScaleSelector label="Энергия" icon={Zap} value={energy} onChange={setEnergy} max={5} color="bg-warning/20" />
          <ScaleSelector label="Настрой" icon={Smile} value={mood} onChange={setMood} max={5} color="bg-success/20" />
          <ScaleSelector label="Боль" icon={Activity} value={pain} onChange={setPain} max={10} color="bg-destructive/20" />
          <ScaleSelector label="Стресс" icon={Brain} value={stress} onChange={setStress} max={5} color="bg-bio-purple/20" />

          <button
            onClick={handleSave}
            className="w-full py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium flex items-center justify-center gap-1.5 hover:bg-primary/90 transition-colors"
          >
            <Check className="w-3.5 h-3.5" />
            Сохранить
          </button>
        </motion.div>
      )}
    </motion.div>
  );
};

export default TodayCheckIn;
