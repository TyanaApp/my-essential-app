import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Check } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useTranslation } from '@/hooks/useTranslation';

interface PantryItem {
  emoji: string;
  nameKey: string;
  defaultName: string;
  unit: string;
}

const PANTRY_ITEMS: PantryItem[] = [
  { emoji: '🌾', nameKey: 'rice', defaultName: 'Rice', unit: 'kg' },
  { emoji: '🍝', nameKey: 'pasta', defaultName: 'Pasta', unit: 'packs' },
  { emoji: '🫘', nameKey: 'buckwheat', defaultName: 'Buckwheat', unit: 'kg' },
  { emoji: '🌽', nameKey: 'cornGrits', defaultName: 'Corn grits', unit: 'kg' },
  { emoji: '🫙', nameKey: 'lentils', defaultName: 'Lentils', unit: 'kg' },
  { emoji: '🫘', nameKey: 'chickpeas', defaultName: 'Chickpeas', unit: 'kg' },
  { emoji: '🍚', nameKey: 'oats', defaultName: 'Oats', unit: 'kg' },
  { emoji: '🌾', nameKey: 'flour', defaultName: 'Flour', unit: 'kg' },
  { emoji: '🧂', nameKey: 'salt', defaultName: 'Salt', unit: 'packs' },
  { emoji: '🫒', nameKey: 'oliveOil', defaultName: 'Olive oil', unit: 'L' },
  { emoji: '🍯', nameKey: 'sugar', defaultName: 'Sugar', unit: 'kg' },
  { emoji: '☕️', nameKey: 'coffee', defaultName: 'Coffee', unit: 'packs' },
  { emoji: '🍵', nameKey: 'tea', defaultName: 'Tea', unit: 'packs' },
  { emoji: '🥫', nameKey: 'cannedTomatoes', defaultName: 'Canned tomatoes', unit: 'pcs' },
  { emoji: '🥫', nameKey: 'cannedBeans', defaultName: 'Canned beans', unit: 'pcs' },
];

interface Props {
  onSaved: () => void;
  onOpenManual: () => void;
}

const PantryQuickAdd = ({ onSaved, onOpenManual }: Props) => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [selected, setSelected] = useState<Map<string, number>>(new Map());
  const [saving, setSaving] = useState(false);

  const pantryNames = (t as any).inventory?.pantryItems || {};

  const getName = (item: PantryItem) => pantryNames[item.nameKey] || item.defaultName;

  const toggleItem = (key: string) => {
    setSelected((prev) => {
      const next = new Map(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.set(key, 1);
      }
      return next;
    });
  };

  const updateQty = (key: string, qty: number) => {
    setSelected((prev) => {
      const next = new Map(prev);
      next.set(key, Math.max(0.1, qty));
      return next;
    });
  };

  const handleAddAll = async () => {
    if (!user || selected.size === 0) return;
    setSaving(true);
    try {
      const items = PANTRY_ITEMS
        .filter((item) => selected.has(item.nameKey))
        .map((item) => ({
          user_id: user.id,
          name: getName(item),
          quantity: selected.get(item.nameKey) || 1,
          unit: item.unit,
          storage_location: 'pantry',
          consumption_rate: 'normal',
          tracking_mode: 'tracked',
        }));

      await supabase.from('inventory_items').insert(items as any);
      toast.success(
        ((t as any).inventory?.quickAddSuccess || '{count} items added to pantry').replace('{count}', String(items.length))
      );
      setSelected(new Map());
      onSaved();
    } catch {
      toast.error((t as any).inventory?.errorSaving || 'Error saving');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mb-4">
      <p className="text-sm font-semibold mb-2" style={{ color: '#1E1B4B' }}>
        ⚡ {(t as any).inventory?.quickAdd || 'Quick Add'}
      </p>
      <div className="grid grid-cols-3 gap-1.5 mb-3">
        {PANTRY_ITEMS.map((item) => {
          const isSelected = selected.has(item.nameKey);
          return (
            <div key={item.nameKey}>
              <button
                onClick={() => toggleItem(item.nameKey)}
                className="w-full flex items-center gap-1 px-2 py-2 rounded-xl border-[1.5px] text-xs font-medium transition-all"
                style={{
                  borderColor: isSelected ? '#7C3AED' : '#E5E7EB',
                  backgroundColor: isSelected ? '#EDE9FE' : 'white',
                  color: isSelected ? '#7C3AED' : '#374151',
                }}
              >
                <span>{item.emoji}</span>
                <span className="truncate">{getName(item)}</span>
                {isSelected && <Check className="w-3 h-3 ml-auto shrink-0" />}
              </button>
              <AnimatePresence>
                {isSelected && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="flex items-center gap-1 mt-1 px-1">
                      <input
                        type="number"
                        value={selected.get(item.nameKey) || 1}
                        onChange={(e) => updateQty(item.nameKey, parseFloat(e.target.value) || 1)}
                        className="w-14 h-7 px-1.5 rounded-lg border text-xs text-center outline-none focus:border-[#7C3AED]"
                        style={{ borderColor: '#DDD6FE', backgroundColor: '#F5F3FF' }}
                        min="0.1"
                        step="0.5"
                      />
                      <span className="text-[10px]" style={{ color: '#6B7280' }}>{item.unit}</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      <div className="flex gap-2">
        <button
          onClick={onOpenManual}
          className="flex-1 flex items-center justify-center gap-1.5 h-10 rounded-xl border-[1.5px] text-sm font-medium"
          style={{ borderColor: '#7C3AED', color: '#7C3AED' }}
        >
          <Plus className="w-4 h-4" />
          {(t as any).inventory?.addSomethingElse || 'Add something else'}
        </button>
      </div>

      <AnimatePresence>
        {selected.size > 0 && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            className="fixed bottom-16 left-0 right-0 z-[100] border-t border-border bg-background px-4 py-3"
            style={{ boxShadow: '0 -4px 12px rgba(0,0,0,0.08)' }}
          >
            <p className="text-xs text-muted-foreground mb-2">
              {((t as any).common?.selectedCount || (t as any).inventory?.selectedCount || 'Selected: {count} products').replace('{count}', String(selected.size))}
            </p>
            <button
              onClick={handleAddAll}
              disabled={saving}
              className="w-full py-3.5 rounded-xl text-base font-semibold text-primary-foreground bg-primary disabled:opacity-50"
            >
              <Check className="w-4 h-4 inline-block mr-1.5 -mt-0.5" />
              {((t as any).common?.saveProducts || (t as any).inventory?.saveProducts || 'Save {count} products').replace('{count}', String(selected.size))}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PantryQuickAdd;
