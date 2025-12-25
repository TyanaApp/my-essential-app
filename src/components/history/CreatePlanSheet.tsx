import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Pill, 
  Droplets, 
  Moon, 
  Heart, 
  Calendar,
  ShoppingCart,
  Bell,
  Check,
  Clock,
  ChevronRight
} from 'lucide-react';

interface PlanItem {
  id: string;
  icon: React.ElementType;
  title: string;
  description: string;
  category: string;
  defaultTime?: string;
}

const planItems: PlanItem[] = [
  { id: 'meds', icon: Pill, title: 'Лекарства/витамины', description: 'Напоминание о приёме', category: 'health', defaultTime: '09:00' },
  { id: 'water', icon: Droplets, title: 'Пить воду', description: '8 стаканов в день', category: 'health', defaultTime: '08:00' },
  { id: 'sleep', icon: Moon, title: 'Режим сна', description: 'Напоминание об отбое', category: 'rest', defaultTime: '22:30' },
  { id: 'pms', icon: Heart, title: 'Подготовка к ПМС', description: 'За 3 дня до начала', category: 'cycle' },
  { id: 'ovulation', icon: Heart, title: 'Окно овуляции', description: 'Напоминание о периоде', category: 'cycle' },
  { id: 'doctor', icon: Calendar, title: 'Запись к врачу', description: 'Добавить в календарь', category: 'medical' },
  { id: 'shopping', icon: ShoppingCart, title: 'Закупка', description: 'Железо, витамины, средства гигиены', category: 'shopping' },
];

interface CreatePlanSheetProps {
  isOpen: boolean;
  onClose: () => void;
  eventTitle?: string;
  onCreatePlan: (items: string[], reminders: { id: string; time: string }[]) => void;
}

const CreatePlanSheet: React.FC<CreatePlanSheetProps> = ({
  isOpen,
  onClose,
  eventTitle,
  onCreatePlan,
}) => {
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [reminders, setReminders] = useState<Record<string, string>>({});
  const [step, setStep] = useState<'select' | 'configure'>('select');

  const toggleItem = (id: string) => {
    setSelectedItems(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleContinue = () => {
    if (selectedItems.length === 0) return;
    
    // Set default times for selected items
    const defaultReminders: Record<string, string> = {};
    selectedItems.forEach(id => {
      const item = planItems.find(p => p.id === id);
      if (item?.defaultTime) {
        defaultReminders[id] = item.defaultTime;
      }
    });
    setReminders(defaultReminders);
    setStep('configure');
  };

  const handleCreate = () => {
    const remindersList = Object.entries(reminders).map(([id, time]) => ({ id, time }));
    onCreatePlan(selectedItems, remindersList);
    setSelectedItems([]);
    setReminders({});
    setStep('select');
    onClose();
  };

  const handleBack = () => {
    setStep('select');
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
        onClick={onClose}
      />
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="fixed bottom-0 left-0 right-0 z-50 max-h-[85vh] overflow-hidden"
        style={{
          background: 'linear-gradient(180deg, #1e1e3f 0%, #16213e 100%)',
          borderTopLeftRadius: '24px',
          borderTopRightRadius: '24px',
        }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 rounded-full bg-white/20" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pb-4">
          <div>
            <h2 className="text-lg font-semibold text-white">Создать план</h2>
            {eventTitle && (
              <p className="text-xs text-gray-400 mt-0.5">На основе: {eventTitle}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {step === 'select' ? (
          <>
            {/* Items List */}
            <div className="px-5 pb-4 overflow-y-auto max-h-[50vh]">
              <p className="text-gray-400 text-sm mb-4">
                Выбери, что добавить в план:
              </p>
              
              <div className="space-y-2">
                {planItems.map(item => {
                  const Icon = item.icon;
                  const isSelected = selectedItems.includes(item.id);
                  
                  return (
                    <button
                      key={item.id}
                      onClick={() => toggleItem(item.id)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors ${
                        isSelected 
                          ? 'bg-violet-500/20 border border-violet-500/40' 
                          : 'bg-white/5 border border-white/10 hover:bg-white/10'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        isSelected ? 'bg-violet-500/30' : 'bg-white/10'
                      }`}>
                        <Icon className={`w-5 h-5 ${isSelected ? 'text-violet-400' : 'text-gray-400'}`} />
                      </div>
                      
                      <div className="flex-1 text-left">
                        <p className={`text-sm font-medium ${isSelected ? 'text-white' : 'text-gray-300'}`}>
                          {item.title}
                        </p>
                        <p className="text-xs text-gray-500">{item.description}</p>
                      </div>
                      
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        isSelected 
                          ? 'bg-violet-500 border-violet-500' 
                          : 'border-gray-500'
                      }`}>
                        {isSelected && <Check className="w-3 h-3 text-white" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Continue Button */}
            <div className="p-5 border-t border-white/10">
              <button
                onClick={handleContinue}
                disabled={selectedItems.length === 0}
                className={`w-full py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors ${
                  selectedItems.length > 0
                    ? 'bg-gradient-to-r from-violet-500 to-cyan-500 text-white'
                    : 'bg-white/10 text-gray-500'
                }`}
              >
                Далее
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Configure Reminders */}
            <div className="px-5 pb-4 overflow-y-auto max-h-[50vh]">
              <p className="text-gray-400 text-sm mb-4">
                Настрой напоминания:
              </p>
              
              <div className="space-y-3">
                {selectedItems.map(itemId => {
                  const item = planItems.find(p => p.id === itemId);
                  if (!item) return null;
                  
                  const Icon = item.icon;
                  const time = reminders[itemId] || '';
                  
                  return (
                    <div
                      key={itemId}
                      className="bg-white/5 border border-white/10 rounded-xl p-4"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center">
                          <Icon className="w-4 h-4 text-violet-400" />
                        </div>
                        <span className="text-white text-sm font-medium">{item.title}</span>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <Bell className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-400 text-sm">Время:</span>
                        <input
                          type="time"
                          value={time}
                          onChange={(e) => setReminders(prev => ({ ...prev, [itemId]: e.target.value }))}
                          className="flex-1 bg-white/10 border border-white/10 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-violet-500/50"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Create Button */}
            <div className="p-5 border-t border-white/10 flex gap-3">
              <button
                onClick={handleBack}
                className="px-6 py-3 rounded-xl bg-white/10 text-gray-300 font-medium"
              >
                Назад
              </button>
              <button
                onClick={handleCreate}
                className="flex-1 py-3 rounded-xl font-medium bg-gradient-to-r from-violet-500 to-cyan-500 text-white flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                Создать план
              </button>
            </div>
          </>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default CreatePlanSheet;
