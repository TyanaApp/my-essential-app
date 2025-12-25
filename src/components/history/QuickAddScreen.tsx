import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Clock, Lock, Save, Mic, MicOff, Sparkles,
  // Symptom icons
  Brain, Heart, Activity, Thermometer,
  // Mood icons
  Frown, Meh, Smile, Zap,
  // Cycle icons
  Calendar, Droplet,
  // Other icons
  Pill, Moon, Dumbbell, Coffee, Plane, Stethoscope, AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { LucideIcon } from 'lucide-react';

interface QuickAddScreenProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (event: any) => void;
}

type QuickCategory = 'symptom' | 'mood' | 'cycle' | 'medication' | 'sleep' | 'workout' | 'nutrition' | 'event' | 'doctor';

interface QuickOption {
  id: string;
  label: string;
  icon: LucideIcon;
  color: string;
  category: QuickCategory;
}

const quickCategories: { id: QuickCategory; label: string; icon: LucideIcon; color: string }[] = [
  { id: 'symptom', label: 'Симптом', icon: AlertTriangle, color: 'from-red-500 to-orange-500' },
  { id: 'mood', label: 'Настроение', icon: Heart, color: 'from-pink-500 to-rose-500' },
  { id: 'cycle', label: 'Цикл', icon: Calendar, color: 'from-fuchsia-500 to-pink-500' },
  { id: 'medication', label: 'Лекарство', icon: Pill, color: 'from-blue-500 to-cyan-500' },
  { id: 'sleep', label: 'Сон', icon: Moon, color: 'from-indigo-500 to-purple-500' },
  { id: 'workout', label: 'Тренировка', icon: Dumbbell, color: 'from-green-500 to-emerald-500' },
  { id: 'nutrition', label: 'Питание', icon: Coffee, color: 'from-amber-500 to-yellow-500' },
  { id: 'event', label: 'Событие', icon: Plane, color: 'from-violet-500 to-purple-500' },
  { id: 'doctor', label: 'Врач', icon: Stethoscope, color: 'from-teal-500 to-cyan-500' },
];

const symptomOptions: QuickOption[] = [
  { id: 'headache', label: 'Голова', icon: Brain, color: 'text-red-400', category: 'symptom' },
  { id: 'stomach', label: 'Живот', icon: Activity, color: 'text-orange-400', category: 'symptom' },
  { id: 'back', label: 'Спина', icon: Activity, color: 'text-yellow-400', category: 'symptom' },
  { id: 'chest', label: 'Грудь', icon: Heart, color: 'text-pink-400', category: 'symptom' },
  { id: 'nausea', label: 'Тошнота', icon: Meh, color: 'text-green-400', category: 'symptom' },
  { id: 'bloating', label: 'Вздутие', icon: Activity, color: 'text-blue-400', category: 'symptom' },
  { id: 'acne', label: 'Акне', icon: AlertTriangle, color: 'text-purple-400', category: 'symptom' },
  { id: 'fever', label: 'Температура', icon: Thermometer, color: 'text-red-500', category: 'symptom' },
];

const moodOptions: QuickOption[] = [
  { id: 'anxiety', label: 'Тревога', icon: Zap, color: 'text-yellow-400', category: 'mood' },
  { id: 'irritability', label: 'Раздражительность', icon: Frown, color: 'text-red-400', category: 'mood' },
  { id: 'sadness', label: 'Грусть', icon: Frown, color: 'text-blue-400', category: 'mood' },
  { id: 'calm', label: 'Спокойствие', icon: Smile, color: 'text-green-400', category: 'mood' },
];

const cycleOptions: QuickOption[] = [
  { id: 'period_start', label: 'Начало', icon: Calendar, color: 'text-pink-400', category: 'cycle' },
  { id: 'period_end', label: 'Конец', icon: Calendar, color: 'text-pink-300', category: 'cycle' },
  { id: 'ovulation', label: 'Овуляция', icon: Droplet, color: 'text-fuchsia-400', category: 'cycle' },
  { id: 'discharge', label: 'Выделения', icon: Droplet, color: 'text-purple-400', category: 'cycle' },
];

const nutritionOptions: QuickOption[] = [
  { id: 'caffeine', label: 'Кофеин', icon: Coffee, color: 'text-amber-400', category: 'nutrition' },
  { id: 'alcohol', label: 'Алкоголь', icon: Coffee, color: 'text-purple-400', category: 'nutrition' },
  { id: 'sugar', label: 'Сладкое', icon: Coffee, color: 'text-pink-400', category: 'nutrition' },
  { id: 'overeating', label: 'Переедание', icon: Coffee, color: 'text-orange-400', category: 'nutrition' },
];

const eventOptions: QuickOption[] = [
  { id: 'flight', label: 'Перелёт', icon: Plane, color: 'text-blue-400', category: 'event' },
  { id: 'deadline', label: 'Дедлайн', icon: Zap, color: 'text-red-400', category: 'event' },
  { id: 'conflict', label: 'Конфликт', icon: Frown, color: 'text-orange-400', category: 'event' },
  { id: 'party', label: 'Вечеринка', icon: Smile, color: 'text-pink-400', category: 'event' },
  { id: 'job_change', label: 'Смена работы', icon: Activity, color: 'text-purple-400', category: 'event' },
];

const getOptionsForCategory = (category: QuickCategory): QuickOption[] => {
  switch (category) {
    case 'symptom': return symptomOptions;
    case 'mood': return moodOptions;
    case 'cycle': return cycleOptions;
    case 'nutrition': return nutritionOptions;
    case 'event': return eventOptions;
    default: return [];
  }
};

const QuickAddScreen: React.FC<QuickAddScreenProps> = ({ isOpen, onClose, onAdd }) => {
  const [selectedCategory, setSelectedCategory] = useState<QuickCategory | null>(null);
  const [selectedOption, setSelectedOption] = useState<QuickOption | null>(null);
  const [timeMode, setTimeMode] = useState<'now' | 'custom'>('now');
  const [customTime, setCustomTime] = useState('');
  const [intensity, setIntensity] = useState(5);
  const [duration, setDuration] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [voiceText, setVoiceText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [medicationName, setMedicationName] = useState('');
  const [medicationDose, setMedicationDose] = useState('');

  const handleCategorySelect = (category: QuickCategory) => {
    if (category === 'medication' || category === 'sleep' || category === 'workout' || category === 'doctor') {
      setSelectedCategory(category);
      setSelectedOption(null);
    } else {
      setSelectedCategory(category);
    }
  };

  const handleOptionSelect = (option: QuickOption) => {
    setSelectedOption(option);
  };

  const handleSave = () => {
    const eventData = {
      title: selectedOption?.label || selectedCategory || 'Событие',
      date: timeMode === 'now' ? new Date().toISOString().split('T')[0] : customTime,
      type: selectedCategory === 'symptom' ? 'symptom' : 
            selectedCategory === 'mood' ? 'trigger' :
            selectedCategory === 'cycle' ? 'cycle' :
            selectedCategory === 'medication' ? 'medication' :
            selectedCategory === 'doctor' ? 'appointment' : 'trigger',
      status: intensity > 7 ? 'высокая интенсивность' : intensity > 4 ? 'средняя' : 'низкая',
      intensity,
      duration,
      isPrivate,
      iconName: 'AlertTriangle',
    };
    
    onAdd(eventData);
    toast.success('Готово. Мы начнём отслеживать влияние.');
    resetAndClose();
  };

  const resetAndClose = () => {
    setSelectedCategory(null);
    setSelectedOption(null);
    setTimeMode('now');
    setCustomTime('');
    setIntensity(5);
    setDuration('');
    setIsPrivate(false);
    setIsVoiceMode(false);
    setVoiceText('');
    setMedicationName('');
    setMedicationDose('');
    onClose();
  };

  const handleVoiceInput = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.lang = 'ru-RU';
      recognition.onresult = (event: any) => {
        const text = event.results[0][0].transcript;
        setVoiceText(text);
        setIsListening(false);
        // Parse the voice input (simplified)
        toast.success('Распознано: ' + text);
      };
      recognition.onerror = () => {
        setIsListening(false);
        toast.error('Ошибка распознавания');
      };
      recognition.onend = () => setIsListening(false);
      setIsListening(true);
      recognition.start();
    } else {
      toast.error('Голосовой ввод не поддерживается');
    }
  };

  const showBottomSheet = selectedCategory && (
    selectedOption || 
    ['medication', 'sleep', 'workout', 'doctor'].includes(selectedCategory)
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={resetAndClose}
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
                <h3 className="font-semibold text-white text-lg">Быстрое добавление</h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsVoiceMode(!isVoiceMode)}
                    className={`p-2 rounded-full transition-all ${
                      isVoiceMode ? 'bg-bio-cyan/20 text-bio-cyan' : 'bg-white/5 text-gray-400'
                    }`}
                  >
                    {isVoiceMode ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={resetAndClose}
                    className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                </div>
              </div>

              {/* Voice Mode */}
              {isVoiceMode && (
                <motion.div
                  className="mb-5 p-4 rounded-xl bg-white/5 border border-bio-cyan/30"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <Sparkles className="w-5 h-5 text-bio-cyan" />
                    <span className="text-sm text-gray-300">Скажи одним предложением</span>
                  </div>
                  <p className="text-xs text-gray-500 mb-3">
                    Пример: "С утра болит голова на 6 из 10"
                  </p>
                  <div className="flex gap-2">
                    <Input
                      value={voiceText}
                      onChange={(e) => setVoiceText(e.target.value)}
                      placeholder="Или напиши здесь..."
                      className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 flex-1"
                    />
                    <Button
                      onClick={handleVoiceInput}
                      variant="outline"
                      className={`${isListening ? 'bg-red-500/20 border-red-500/50 text-red-400' : 'bg-bio-cyan/20 border-bio-cyan/50 text-bio-cyan'}`}
                    >
                      <Mic className={`w-4 h-4 ${isListening ? 'animate-pulse' : ''}`} />
                    </Button>
                  </div>
                  {voiceText && (
                    <Button
                      onClick={() => {
                        onAdd({ title: voiceText, date: new Date().toISOString().split('T')[0], type: 'trigger', status: 'голосовой ввод', iconName: 'Mic' });
                        toast.success('Готово. Мы начнём отслеживать влияние.');
                        resetAndClose();
                      }}
                      className="w-full mt-3 bg-gradient-to-r from-bio-purple to-bio-cyan"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Сохранить
                    </Button>
                  )}
                </motion.div>
              )}

              {/* Category Grid */}
              {!showBottomSheet && (
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {quickCategories.map((cat) => {
                    const Icon = cat.icon;
                    const isSelected = selectedCategory === cat.id;
                    return (
                      <button
                        key={cat.id}
                        onClick={() => handleCategorySelect(cat.id)}
                        className={`p-3 rounded-xl flex flex-col items-center gap-2 transition-all ${
                          isSelected
                            ? 'bg-white/10 border border-white/20'
                            : 'bg-white/5 hover:bg-white/10'
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${cat.color} flex items-center justify-center opacity-80`}>
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-xs text-gray-300">{cat.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Options Grid (for symptom, mood, cycle, nutrition, event) */}
              {selectedCategory && !showBottomSheet && getOptionsForCategory(selectedCategory).length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mb-4"
                >
                  <Label className="text-gray-400 text-xs mb-2 block">Выбери тип:</Label>
                  <div className="grid grid-cols-4 gap-2">
                    {getOptionsForCategory(selectedCategory).map((opt) => {
                      const Icon = opt.icon;
                      return (
                        <button
                          key={opt.id}
                          onClick={() => handleOptionSelect(opt)}
                          className="p-2 rounded-lg bg-white/5 hover:bg-white/10 flex flex-col items-center gap-1 transition-all"
                        >
                          <Icon className={`w-5 h-5 ${opt.color}`} />
                          <span className="text-[10px] text-gray-400">{opt.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {/* Bottom Sheet Details */}
              {showBottomSheet && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
                    {selectedOption && (
                      <>
                        <selectedOption.icon className={`w-6 h-6 ${selectedOption.color}`} />
                        <span className="text-white font-medium">{selectedOption.label}</span>
                      </>
                    )}
                    {!selectedOption && selectedCategory && (
                      <>
                        {quickCategories.find(c => c.id === selectedCategory)?.icon && (
                          <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${quickCategories.find(c => c.id === selectedCategory)?.color} flex items-center justify-center`}>
                            {React.createElement(quickCategories.find(c => c.id === selectedCategory)!.icon, { className: 'w-4 h-4 text-white' })}
                          </div>
                        )}
                        <span className="text-white font-medium">{quickCategories.find(c => c.id === selectedCategory)?.label}</span>
                      </>
                    )}
                    <button
                      onClick={() => { setSelectedOption(null); setSelectedCategory(null); }}
                      className="ml-auto text-gray-400 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Medication fields */}
                  {selectedCategory === 'medication' && (
                    <div className="space-y-3">
                      <div>
                        <Label className="text-gray-300 text-sm">Название</Label>
                        <Input
                          value={medicationName}
                          onChange={(e) => setMedicationName(e.target.value)}
                          placeholder="Например: Ибупрофен"
                          className="bg-white/5 border-white/10 text-white mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-gray-300 text-sm">Дозировка</Label>
                        <Input
                          value={medicationDose}
                          onChange={(e) => setMedicationDose(e.target.value)}
                          placeholder="Например: 400мг"
                          className="bg-white/5 border-white/10 text-white mt-1"
                        />
                      </div>
                    </div>
                  )}

                  {/* Time */}
                  <div>
                    <Label className="text-gray-300 text-sm mb-2 block">Время</Label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setTimeMode('now')}
                        className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all ${
                          timeMode === 'now'
                            ? 'bg-bio-cyan/20 text-bio-cyan border border-bio-cyan/30'
                            : 'bg-white/5 text-gray-400 hover:bg-white/10'
                        }`}
                      >
                        <Clock className="w-4 h-4" />
                        Сейчас
                      </button>
                      <button
                        onClick={() => setTimeMode('custom')}
                        className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                          timeMode === 'custom'
                            ? 'bg-bio-cyan/20 text-bio-cyan border border-bio-cyan/30'
                            : 'bg-white/5 text-gray-400 hover:bg-white/10'
                        }`}
                      >
                        Выбрать
                      </button>
                    </div>
                    {timeMode === 'custom' && (
                      <Input
                        type="datetime-local"
                        value={customTime}
                        onChange={(e) => setCustomTime(e.target.value)}
                        className="bg-white/5 border-white/10 text-white mt-2"
                      />
                    )}
                  </div>

                  {/* Intensity (for symptoms) */}
                  {selectedCategory === 'symptom' && (
                    <div>
                      <Label className="text-gray-300 text-sm mb-2 block">
                        Интенсивность: <span className="text-bio-cyan font-semibold">{intensity}/10</span>
                      </Label>
                      <div className="flex gap-1">
                        {Array.from({ length: 11 }, (_, i) => (
                          <button
                            key={i}
                            onClick={() => setIntensity(i)}
                            className={`flex-1 h-8 rounded-md text-xs font-medium transition-all ${
                              intensity === i
                                ? i <= 3 ? 'bg-green-500 text-white' : i <= 6 ? 'bg-yellow-500 text-white' : 'bg-red-500 text-white'
                                : 'bg-white/5 text-gray-400 hover:bg-white/10'
                            }`}
                          >
                            {i}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Duration */}
                  <div>
                    <Label className="text-gray-300 text-sm mb-2 block">Длительность</Label>
                    <div className="flex gap-2">
                      {['1ч', '6ч', 'День', 'Несколько дней'].map((d) => (
                        <button
                          key={d}
                          onClick={() => setDuration(d)}
                          className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
                            duration === d
                              ? 'bg-bio-purple/20 text-bio-purple border border-bio-purple/30'
                              : 'bg-white/5 text-gray-400 hover:bg-white/10'
                          }`}
                        >
                          {d}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Private toggle */}
                  <button
                    onClick={() => setIsPrivate(!isPrivate)}
                    className="flex items-center gap-3 w-full p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                  >
                    <Lock className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-300 flex-1 text-left">
                      Приватное событие
                    </span>
                    <div
                      className={`w-10 h-6 rounded-full transition-colors relative ${
                        isPrivate ? 'bg-bio-purple' : 'bg-white/10'
                      }`}
                    >
                      <div
                        className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                          isPrivate ? 'left-5' : 'left-1'
                        }`}
                      />
                    </div>
                  </button>

                  {/* Save Button */}
                  <Button
                    onClick={handleSave}
                    className="w-full bg-gradient-to-r from-bio-purple to-bio-cyan hover:opacity-90 text-white"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Сохранить
                  </Button>
                </motion.div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default QuickAddScreen;
