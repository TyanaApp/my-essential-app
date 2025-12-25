import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Heart, Moon, Dumbbell, Apple, Pill, Flame, Stethoscope, Plane, Calendar, AlertTriangle, Battery, Lock, Check } from 'lucide-react';

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  filters: FilterState;
  onApply: (filters: FilterState) => void;
}

export interface FilterState {
  types: string[];
  impacts: string[];
  confidence: 'all' | 'confirmed' | 'hypotheses';
  showPrivate: boolean;
}

const typeFilters = [
  { id: 'cycle', label: 'Цикл', icon: Calendar },
  { id: 'symptoms', label: 'Симптомы', icon: AlertTriangle },
  { id: 'mood', label: 'Настроение', icon: Heart },
  { id: 'sleep', label: 'Сон', icon: Moon },
  { id: 'workout', label: 'Тренировки', icon: Dumbbell },
  { id: 'nutrition', label: 'Питание', icon: Apple },
  { id: 'medication', label: 'Лекарства/БАД', icon: Pill },
  { id: 'stress', label: 'Стресс/События', icon: Flame },
  { id: 'medical', label: 'Врачи/анализы', icon: Stethoscope },
  { id: 'travel', label: 'Путешествия', icon: Plane },
];

const impactFilters = [
  { id: 'stress_peak', label: 'Пики стресса', icon: Flame },
  { id: 'bad_sleep', label: 'Плохой сон', icon: Moon },
  { id: 'pain', label: 'Боль', icon: AlertTriangle },
  { id: 'low_energy', label: 'Низкая энергия', icon: Battery },
];

const FilterModal: React.FC<FilterModalProps> = ({ isOpen, onClose, filters, onApply }) => {
  const [localFilters, setLocalFilters] = useState<FilterState>(filters);

  const toggleType = (id: string) => {
    setLocalFilters((prev) => ({
      ...prev,
      types: prev.types.includes(id)
        ? prev.types.filter((t) => t !== id)
        : [...prev.types, id],
    }));
  };

  const toggleImpact = (id: string) => {
    setLocalFilters((prev) => ({
      ...prev,
      impacts: prev.impacts.includes(id)
        ? prev.impacts.filter((t) => t !== id)
        : [...prev.impacts, id],
    }));
  };

  const handleApply = () => {
    onApply(localFilters);
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
            className="fixed inset-x-0 bottom-0 z-50 max-h-[85vh] overflow-y-auto"
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            <div className="rounded-t-3xl p-5 bg-card border-t border-border">
              <div className="w-12 h-1 bg-muted rounded-full mx-auto mb-4" />

              <div className="flex items-center justify-between mb-5">
                <h3 className="font-semibold text-card-foreground text-lg">Фильтры</h3>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>

              {/* Types */}
              <div className="mb-5">
                <h4 className="text-sm font-medium text-muted-foreground mb-3">По типу</h4>
                <div className="flex flex-wrap gap-2">
                  {typeFilters.map((filter) => {
                    const Icon = filter.icon;
                    const isActive = localFilters.types.includes(filter.id);
                    return (
                      <button
                        key={filter.id}
                        onClick={() => toggleType(filter.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                          isActive
                            ? 'bg-primary/20 text-primary border border-primary/50'
                            : 'bg-muted text-muted-foreground hover:bg-muted/80'
                        }`}
                      >
                        <Icon className="w-3 h-3" />
                        {filter.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Impacts */}
              <div className="mb-5">
                <h4 className="text-sm font-medium text-muted-foreground mb-3">По влиянию</h4>
                <div className="flex flex-wrap gap-2">
                  {impactFilters.map((filter) => {
                    const Icon = filter.icon;
                    const isActive = localFilters.impacts.includes(filter.id);
                    return (
                      <button
                        key={filter.id}
                        onClick={() => toggleImpact(filter.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                          isActive
                            ? 'bg-accent/30 text-accent border border-accent/50'
                            : 'bg-muted text-muted-foreground hover:bg-muted/80'
                        }`}
                      >
                        <Icon className="w-3 h-3" />
                        {filter.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Confidence */}
              <div className="mb-5">
                <h4 className="text-sm font-medium text-muted-foreground mb-3">По уверенности</h4>
                <div className="flex gap-2">
                  {[
                    { value: 'all', label: 'Все' },
                    { value: 'confirmed', label: 'Подтверждённые' },
                    { value: 'hypotheses', label: 'Гипотезы' },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() =>
                        setLocalFilters((prev) => ({
                          ...prev,
                          confidence: option.value as FilterState['confidence'],
                        }))
                      }
                      className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all ${
                        localFilters.confidence === option.value
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground hover:bg-muted/80'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Privacy */}
              <div className="mb-6">
                <button
                  onClick={() =>
                    setLocalFilters((prev) => ({
                      ...prev,
                      showPrivate: !prev.showPrivate,
                    }))
                  }
                  className="flex items-center gap-3 w-full p-3 rounded-xl bg-muted hover:bg-muted/80 transition-colors"
                >
                  <Lock className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-foreground flex-1 text-left">
                    Показывать приватные события
                  </span>
                  <div
                    className={`w-5 h-5 rounded-md flex items-center justify-center ${
                      localFilters.showPrivate ? 'bg-accent' : 'bg-secondary'
                    }`}
                  >
                    {localFilters.showPrivate && <Check className="w-3 h-3 text-accent-foreground" />}
                  </div>
                </button>
              </div>

              {/* Apply button */}
              <button
                onClick={handleApply}
                className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
              >
                Применить фильтры
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default FilterModal;
