import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Target, TrendingUp, AlertTriangle, Calendar } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export type EventType = 'trigger' | 'goal' | 'stress_peak';

interface AddEventFABProps {
  onAdd: (event: {
    title: string;
    date: string;
    type: EventType;
    status: string;
    iconName: string;
  }) => void;
}

const eventTypes = [
  { 
    type: 'trigger' as EventType, 
    icon: TrendingUp, 
    labelEn: 'Trigger',
    labelRu: 'Триггер',
    color: 'bg-rose-500',
    description: 'Job change, illness, stress'
  },
  { 
    type: 'goal' as EventType, 
    icon: Target, 
    labelEn: 'Goal',
    labelRu: 'Цель',
    color: 'bg-emerald-500',
    description: 'Marathon, pregnancy, project'
  },
  { 
    type: 'stress_peak' as EventType, 
    icon: AlertTriangle, 
    labelEn: 'Stress Peak',
    labelRu: 'Пик стресса',
    color: 'bg-amber-500',
    description: 'AI detected stress peak'
  },
];

const AddEventFAB = ({ onAdd }: AddEventFABProps) => {
  const { language } = useLanguage();
  const isRussian = language === 'ru';
  
  const [isExpanded, setIsExpanded] = useState(false);
  const [step, setStep] = useState<'type' | 'details'>('type');
  const [selectedType, setSelectedType] = useState<EventType | null>(null);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');

  const handleTypeSelect = (type: EventType) => {
    setSelectedType(type);
    setStep('details');
  };

  const handleSubmit = () => {
    if (!selectedType || !title || !date) return;
    
    onAdd({
      title,
      date,
      type: selectedType,
      status: selectedType === 'goal' ? 'in_progress' : 'stress peak',
      iconName: selectedType === 'trigger' ? 'TrendingUp' : selectedType === 'goal' ? 'Target' : 'AlertTriangle',
    });

    // Reset
    setIsExpanded(false);
    setStep('type');
    setSelectedType(null);
    setTitle('');
    setDate('');
  };

  const handleClose = () => {
    setIsExpanded(false);
    setStep('type');
    setSelectedType(null);
    setTitle('');
    setDate('');
  };

  return (
    <>
      {/* Backdrop */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            onClick={handleClose}
          />
        )}
      </AnimatePresence>

      {/* FAB and Panel */}
      <div className="fixed bottom-24 right-4 z-50">
        <AnimatePresence mode="wait">
          {isExpanded ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 20 }}
              className={cn(
                'w-72 rounded-3xl overflow-hidden',
                'bg-gradient-to-br from-slate-900/95 via-slate-800/95 to-slate-900/95',
                'border border-white/20 backdrop-blur-xl',
                'shadow-2xl shadow-black/30'
              )}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-white/10">
                <h3 className="text-white font-medium">
                  {step === 'type' 
                    ? (isRussian ? 'Выберите тип' : 'Select Type')
                    : (isRussian ? 'Добавить событие' : 'Add Event')
                  }
                </h3>
                <button
                  onClick={handleClose}
                  className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                >
                  <X className="w-4 h-4 text-white/70" />
                </button>
              </div>

              {/* Content */}
              <div className="p-4">
                <AnimatePresence mode="wait">
                  {step === 'type' ? (
                    <motion.div
                      key="type-selection"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-2"
                    >
                      {eventTypes.map((et) => (
                        <button
                          key={et.type}
                          onClick={() => handleTypeSelect(et.type)}
                          className={cn(
                            'w-full flex items-center gap-3 p-3 rounded-xl',
                            'bg-white/5 hover:bg-white/10 transition-all',
                            'border border-white/10 hover:border-white/20',
                            'group'
                          )}
                        >
                          <div className={cn('p-2 rounded-lg', et.color)}>
                            <et.icon className="w-4 h-4 text-white" />
                          </div>
                          <div className="text-left">
                            <p className="text-white text-sm font-medium">
                              {isRussian ? et.labelRu : et.labelEn}
                            </p>
                            <p className="text-white/50 text-xs">
                              {et.description}
                            </p>
                          </div>
                        </button>
                      ))}
                    </motion.div>
                  ) : (
                    <motion.div
                      key="details-form"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="space-y-4"
                    >
                      <div>
                        <label className="text-white/60 text-xs mb-1.5 block">
                          {isRussian ? 'Название' : 'Title'}
                        </label>
                        <Input
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          placeholder={isRussian ? 'Например: Смена работы' : 'e.g. Job Change'}
                          className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
                        />
                      </div>
                      
                      <div>
                        <label className="text-white/60 text-xs mb-1.5 block flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {isRussian ? 'Дата' : 'Date'}
                        </label>
                        <Input
                          value={date}
                          onChange={(e) => setDate(e.target.value)}
                          placeholder="MM/YY"
                          className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
                        />
                      </div>

                      <div className="flex gap-2 pt-2">
                        <Button
                          variant="outline"
                          onClick={() => setStep('type')}
                          className="flex-1 border-white/20 text-white hover:bg-white/10"
                        >
                          {isRussian ? 'Назад' : 'Back'}
                        </Button>
                        <Button
                          onClick={handleSubmit}
                          disabled={!title || !date}
                          className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:from-cyan-400 hover:to-blue-400"
                        >
                          {isRussian ? 'Добавить' : 'Add'}
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          ) : (
            <motion.button
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsExpanded(true)}
              className={cn(
                'w-14 h-14 rounded-full',
                'bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-500',
                'flex items-center justify-center',
                'shadow-lg shadow-cyan-500/30',
                'border-2 border-white/20'
              )}
            >
              <Plus className="w-6 h-6 text-white" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};

export default AddEventFAB;
