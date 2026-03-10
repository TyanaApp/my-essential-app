import { useState, useEffect } from 'react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from '@/components/ui/drawer';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useTranslation } from '@/hooks/useTranslation';
import { getUnitLabel } from '@/lib/units';

interface FridgePickerModalProps {
  open: boolean;
  onClose: () => void;
  mealType: string;
  dateStr: string;
  onSaved: (entry: any) => void;
}

interface InventoryItem {
  id: string;
  name: string;
  quantity: number | null;
  unit: string | null;
}

interface NutritionResult {
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  source: string;
}

const FridgePickerModal = ({ open, onClose, mealType, dateStr, onSaved }: FridgePickerModalProps) => {
  const { user } = useAuth();
  const { t, language } = useTranslation();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [nutritionMap, setNutritionMap] = useState<Record<string, NutritionResult>>({});
  const [loadingNutrition, setLoadingNutrition] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!open || !user) return;
    setLoading(true);
    setSelected(new Set());
    setNutritionMap({});
    supabase.from('inventory_items').select('id, name, quantity, unit')
      .eq('user_id', user.id)
      .gt('quantity', 0)
      .order('name')
      .limit(50)
      .then(({ data }) => {
        setItems((data || []) as InventoryItem[]);
        setLoading(false);
      });
  }, [open, user]);

  const fetchNutrition = async (item: InventoryItem) => {
    if (nutritionMap[item.id] || loadingNutrition.has(item.id)) return;
    
    setLoadingNutrition(prev => new Set(prev).add(item.id));
    
    try {
      const { data, error } = await supabase.functions.invoke('calculate-meal-calories', {
        body: {
          mealDescription: `${item.name} ${item.quantity || 1}${item.unit || 'pcs'}`,
          language,
        }
      });

      if (!error && data && !data.error) {
        setNutritionMap(prev => ({
          ...prev,
          [item.id]: {
            calories: data.total_calories || data.calories || 80,
            protein: data.total_protein || data.protein || 0,
            fat: data.total_fat || data.fat || 0,
            carbs: data.total_carbs || data.carbs || 0,
            source: 'ai',
          }
        }));
      } else {
        // Fallback estimate
        setNutritionMap(prev => ({
          ...prev,
          [item.id]: { calories: 80, protein: 3, fat: 2, carbs: 10, source: 'estimate' }
        }));
      }
    } catch {
      setNutritionMap(prev => ({
        ...prev,
        [item.id]: { calories: 80, protein: 3, fat: 2, carbs: 10, source: 'estimate' }
      }));
    }
    
    setLoadingNutrition(prev => {
      const next = new Set(prev);
      next.delete(item.id);
      return next;
    });
  };

  const toggle = (id: string) => {
    const item = items.find(i => i.id === id);
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
        // Fetch nutrition when selected
        if (item) fetchNutrition(item);
      }
      return next;
    });
  };

  const labels: Record<string, Record<string, string>> = {
    en: { title: 'From your fridge', desc: 'Select what you ate', log: 'Log {count} items', estimating: 'Calculating calories...', aiLabel: '🤖 AI estimate', approx: '~approx' },
    ru: { title: 'Из холодильника', desc: 'Выберите что вы съели', log: 'Записать {count} продуктов', estimating: 'Рассчитываем калории...', aiLabel: '🤖 ИИ-оценка', approx: '~прибл' },
    lv: { title: 'No ledusskapja', desc: 'Izvēlieties ko ēdāt', log: 'Ierakstīt {count} prod.', estimating: 'Aprēķinām kalorijas...', aiLabel: '🤖 MI novērtējums', approx: '~aptuveni' },
    uk: { title: 'З холодильника', desc: 'Оберіть що ви з\'їли', log: 'Записати {count} продуктів', estimating: 'Рахуємо калорії...', aiLabel: '🤖 ШІ-оцінка', approx: '~прибл' },
  };
  const l = labels[language] || labels.en;

  const getItemNutrition = (id: string): NutritionResult | null => {
    return nutritionMap[id] || null;
  };

  const handleSave = async () => {
    if (!user || selected.size === 0) return;
    setSaving(true);
    const selectedItems = items.filter(i => selected.has(i.id));
    const nameList = selectedItems.map(i => `${i.name} ${i.quantity || 1}${i.unit || 'pcs'}`).join(', ');

    // Calculate totals from nutrition data
    let totalCal = 0;
    let totalProtein = 0;
    let totalFat = 0;
    let totalCarbs = 0;

    for (const item of selectedItems) {
      const nutr = getItemNutrition(item.id);
      if (nutr) {
        totalCal += nutr.calories;
        totalProtein += nutr.protein;
        totalFat += nutr.fat;
        totalCarbs += nutr.carbs;
      } else {
        totalCal += 80; // fallback
      }
    }

    try {
      const { data, error } = await supabase.from('meal_entries').insert({
        user_id: user.id,
        date: dateStr,
        meal_type: mealType,
        custom_name: nameList,
        total_calories: Math.round(totalCal),
        total_protein: Math.round(totalProtein * 10) / 10,
        total_fat: Math.round(totalFat * 10) / 10,
        total_carbs: Math.round(totalCarbs * 10) / 10,
      } as any).select().single();

      if (error) throw error;

      // Reduce inventory quantities
      for (const item of selectedItems) {
        const newQty = Math.max((item.quantity || 1) - 1, 0);
        if (newQty <= 0) {
          await supabase.from('inventory_items').delete().eq('id', item.id);
        } else {
          await supabase.from('inventory_items').update({ quantity: newQty } as any).eq('id', item.id);
        }
      }

      if (data) onSaved(data);
      toast.success(`${nameList} — ~${Math.round(totalCal)} kcal ✓`);
      onClose();
    } catch {
      toast.error((t.common as any)?.error || 'Error');
    }
    setSaving(false);
  };

  // Calculate total for selected items
  const selectedTotal = items.filter(i => selected.has(i.id)).reduce((sum, item) => {
    const nutr = getItemNutrition(item.id);
    return sum + (nutr?.calories || 0);
  }, 0);

  return (
    <Drawer open={open} onOpenChange={(o) => !o && onClose()}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle className="text-foreground">🧊 {l.title}</DrawerTitle>
          <DrawerDescription>{l.desc}</DrawerDescription>
        </DrawerHeader>
        <div className="flex-1 overflow-y-auto px-4 pb-2">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-[3px] rounded-full animate-spin" style={{ borderColor: '#EDE9FE', borderTopColor: '#7C3AED' }} />
            </div>
          ) : items.length === 0 ? (
            <p className="text-sm text-center py-6 text-muted-foreground">
              {(t.inventory as any)?.empty || 'No items'}
            </p>
          ) : (
            <div className="flex flex-wrap gap-2 max-h-60 overflow-y-auto mb-4">
              {items.map(item => {
                const isSelected = selected.has(item.id);
                const nutr = getItemNutrition(item.id);
                const isLoadingNutr = loadingNutrition.has(item.id);
                return (
                  <button
                    key={item.id}
                    onClick={() => toggle(item.id)}
                    className="px-3 py-2 rounded-xl text-sm font-medium border-[1.5px] transition-all text-left"
                    style={{
                      borderColor: isSelected ? 'hsl(var(--primary))' : 'hsl(var(--border))',
                      backgroundColor: isSelected ? 'hsl(var(--primary) / 0.15)' : 'hsl(var(--card))',
                      color: isSelected ? 'hsl(var(--primary))' : 'hsl(var(--foreground))',
                    }}
                  >
                    <span>{item.name} {item.quantity || 1}{getUnitLabel(language, item.unit || 'pcs')}</span>
                    {isSelected && isLoadingNutr && (
                      <span className="block text-[10px] opacity-60 mt-0.5">⏳...</span>
                    )}
                    {isSelected && nutr && !isLoadingNutr && (
                      <span className="block text-[10px] opacity-70 mt-0.5">
                        ~{nutr.calories} kcal
                        {nutr.protein > 0 && ` · ${nutr.protein}г`}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
        {selected.size > 0 && (
          <div className="modal-actions px-4 pb-4">
            {selectedTotal > 0 && (
              <p className="text-xs text-center mb-2 text-muted-foreground">
                {l.approx} {selectedTotal} kcal · {l.aiLabel}
              </p>
            )}
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full h-11 rounded-xl text-sm font-semibold text-primary-foreground disabled:opacity-50 bg-primary"
            >
              {saving ? (l.estimating) : l.log.replace('{count}', String(selected.size))}
            </button>
          </div>
        )}
      </DrawerContent>
    </Drawer>
  );
};

export default FridgePickerModal;
