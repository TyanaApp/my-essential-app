import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Plus, Briefcase, Heart, Plane, Trophy, Baby, Target, Globe, ShieldPlus,
  Calendar, Moon, Dumbbell, Apple, Pill, Flame, Stethoscope, AlertTriangle,
  Activity, Zap, Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { LucideIcon } from 'lucide-react';
import { EventType } from './TimelineEvent';

interface AddEventScreenProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (event: {
    title: string;
    date: string;
    type: EventType;
    status: string;
    icon: LucideIcon;
    iconName: string;
    impact?: string;
    notes?: string;
  }) => void;
}

const iconOptions: { icon: LucideIcon; name: string; iconName: string; category: string }[] = [
  { icon: Briefcase, name: 'Работа', iconName: 'Briefcase', category: 'events' },
  { icon: Heart, name: 'Здоровье', iconName: 'Heart', category: 'health' },
  { icon: Plane, name: 'Путешествие', iconName: 'Plane', category: 'events' },
  { icon: Trophy, name: 'Достижение', iconName: 'Trophy', category: 'goals' },
  { icon: Baby, name: 'Семья', iconName: 'Baby', category: 'events' },
  { icon: Target, name: 'Цель', iconName: 'Target', category: 'goals' },
  { icon: Globe, name: 'Приключение', iconName: 'Globe', category: 'events' },
  { icon: ShieldPlus, name: 'Медицина', iconName: 'ShieldPlus', category: 'health' },
  { icon: Calendar, name: 'Цикл', iconName: 'Calendar', category: 'cycle' },
  { icon: Moon, name: 'Сон', iconName: 'Moon', category: 'health' },
  { icon: Dumbbell, name: 'Тренировка', iconName: 'Dumbbell', category: 'health' },
  { icon: Apple, name: 'Питание', iconName: 'Apple', category: 'health' },
  { icon: Pill, name: 'Лекарства', iconName: 'Pill', category: 'health' },
  { icon: Flame, name: 'Стресс', iconName: 'Flame', category: 'events' },
  { icon: Stethoscope, name: 'Врач', iconName: 'Stethoscope', category: 'health' },
  { icon: AlertTriangle, name: 'Симптом', iconName: 'AlertTriangle', category: 'symptoms' },
];

const eventTypes: { value: EventType; label: string; color: string }[] = [
  { value: 'trigger', label: 'Триггер', color: 'bg-orange-500' },
  { value: 'symptom', label: 'Симптом', color: 'bg-red-500' },
  { value: 'cycle', label: 'Цикл', color: 'bg-pink-500' },
  { value: 'medication', label: 'Лекарство', color: 'bg-blue-500' },
  { value: 'appointment', label: 'Визит', color: 'bg-green-500' },
  { value: 'goal', label: 'Цель', color: 'bg-purple-500' },
  { value: 'intervention', label: 'Интервенция', color: 'bg-cyan-500' },
  { value: 'outcome', label: 'Результат', color: 'bg-emerald-500' },
];

const AddEventScreen: React.FC<AddEventScreenProps> = ({ isOpen, onClose, onAdd }) => {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [type, setType] = useState<EventType>('trigger');
  const [status, setStatus] = useState('');
  const [selectedIcon, setSelectedIcon] = useState(0);
  const [notes, setNotes] = useState('');
  const [isQuickMode, setIsQuickMode] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !date) return;

    onAdd({
      title,
      date,
      type,
      status: status || 'активно',
      icon: iconOptions[selectedIcon].icon,
      iconName: iconOptions[selectedIcon].iconName,
      notes,
    });

    // Reset form
    setTitle('');
    setDate('');
    setType('trigger');
    setStatus('');
    setSelectedIcon(0);
    setNotes('');
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

              {/* Header */}
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-semibold text-white text-lg">Добавить событие</h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsQuickMode(!isQuickMode)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                      isQuickMode
                        ? 'bg-bio-cyan/20 text-bio-cyan'
                        : 'bg-white/5 text-gray-400'
                    }`}
                  >
                    {isQuickMode ? 'Быстрый' : 'Подробный'}
                  </button>
                  <button
                    onClick={onClose}
                    className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Title */}
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-gray-300">
                    Название события *
                  </Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Например: Головная боль, Тренировка, Дедлайн..."
                    className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                  />
                </div>

                {/* Date */}
                <div className="space-y-2">
                  <Label htmlFor="date" className="text-gray-300">
                    Дата *
                  </Label>
                  <Input
                    id="date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>

                {/* Type */}
                <div className="space-y-2">
                  <Label className="text-gray-300">Тип события</Label>
                  <div className="flex flex-wrap gap-2">
                    {eventTypes.map((eventType) => (
                      <button
                        key={eventType.value}
                        type="button"
                        onClick={() => setType(eventType.value)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                          type === eventType.value
                            ? `${eventType.color}/30 text-white border border-white/30`
                            : 'bg-white/5 text-gray-400 hover:bg-white/10'
                        }`}
                        style={type === eventType.value ? { backgroundColor: `${eventType.color}30` } : {}}
                      >
                        {eventType.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Icon */}
                <div className="space-y-2">
                  <Label className="text-gray-300">Иконка</Label>
                  <div className="grid grid-cols-8 gap-1">
                    {iconOptions.map((opt, idx) => {
                      const IconComponent = opt.icon;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setSelectedIcon(idx)}
                          className={`p-2 rounded-lg flex items-center justify-center transition-all ${
                            selectedIcon === idx
                              ? 'bg-bio-cyan/20 border border-bio-cyan/50'
                              : 'bg-white/5 hover:bg-white/10'
                          }`}
                        >
                          <IconComponent
                            className={`w-4 h-4 ${
                              selectedIcon === idx ? 'text-bio-cyan' : 'text-gray-400'
                            }`}
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Extended mode fields */}
                {!isQuickMode && (
                  <>
                    {/* Status */}
                    <div className="space-y-2">
                      <Label htmlFor="status" className="text-gray-300">
                        Статус (опционально)
                      </Label>
                      <Input
                        id="status"
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        placeholder="Например: пик стресса, улучшение, наблюдение..."
                        className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                      />
                    </div>

                    {/* Notes */}
                    <div className="space-y-2">
                      <Label htmlFor="notes" className="text-gray-300">
                        Заметки
                      </Label>
                      <Textarea
                        id="notes"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Дополнительная информация..."
                        className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 min-h-[80px]"
                      />
                    </div>
                  </>
                )}

                {/* Submit */}
                <Button
                  type="submit"
                  disabled={!title || !date}
                  className="w-full bg-gradient-to-r from-bio-purple to-bio-cyan hover:opacity-90 text-white disabled:opacity-50"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Добавить на таймлайн
                </Button>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default AddEventScreen;
