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

const FridgePickerModal = ({ open, onClose, mealType, dateStr, onSaved }: FridgePickerModalProps) => {
  const { user } = useAuth();
  const { t, language } = useTranslation();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !user) return;
    setLoading(true);
    setSelected(new Set());
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

  const toggle = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const labels: Record<string, Record<string, string>> = {
    en: { title: 'From your fridge', desc: 'Select what you ate', log: 'Log {count} items', estimating: 'Estimating calories...' },
    ru: { title: 'Из холодильника', desc: 'Выберите что вы съели', log: 'Записать {count} продуктов', estimating: 'Оцениваем калории...' },
    lv: { title: 'No ledusskapja', desc: 'Izvēlieties ko ēdāt', log: 'Ierakstīt {count} prod.', estimating: 'Aprēķinām kalorijas...' },
    uk: { title: 'З холодильника', desc: 'Оберіть що ви з\'їли', log: 'Записати {count} продуктів', estimating: 'Оцінюємо калорії...' },
  };
  const l = labels[language] || labels.en;

  const handleSave = async () => {
    if (!user || selected.size === 0) return;
    setSaving(true);
    const selectedItems = items.filter(i => selected.has(i.id));
    const nameList = selectedItems.map(i => `${i.name} ${i.quantity || 1}${i.unit || 'pcs'}`).join(', ');

    // Simple calorie estimates per common items
    const estimateCal = (name: string): number => {
      const n = name.toLowerCase();
      if (n.includes('молоко') || n.includes('milk') || n.includes('piens')) return 120;
      if (n.includes('яйц') || n.includes('egg') || n.includes('ola')) return 70;
      if (n.includes('хлеб') || n.includes('bread') || n.includes('maize') || n.includes('хліб')) return 80;
      if (n.includes('яблок') || n.includes('apple') || n.includes('ābols')) return 52;
      if (n.includes('банан') || n.includes('banana') || n.includes('banāns')) return 89;
      if (n.includes('сыр') || n.includes('cheese') || n.includes('siers') || n.includes('сир')) return 110;
      if (n.includes('йогурт') || n.includes('yogurt') || n.includes('jogurts')) return 60;
      return 80; // generic estimate
    };

    const totalCal = selectedItems.reduce((s, i) => s + estimateCal(i.name), 0);

    try {
      const { data, error } = await supabase.from('meal_entries').insert({
        user_id: user.id,
        date: dateStr,
        meal_type: mealType,
        custom_name: nameList,
        total_calories: totalCal,
        total_protein: 0,
        total_fat: 0,
        total_carbs: 0,
      } as any).select().single();

      if (error) throw error;

      // Reduce inventory quantities
      for (const item of selectedItems) {
        const newQty = Math.max((item.quantity || 1) - 1, 0);
        await supabase.from('inventory_items').update({ quantity: newQty } as any).eq('id', item.id);
      }

      if (data) onSaved(data);
      toast.success(`${nameList} — ~${totalCal} kcal ✓`);
      onClose();
    } catch {
      toast.error((t.common as any)?.error || 'Error');
    }
    setSaving(false);
  };

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
              {items.map(item => (
                <button
                  key={item.id}
                  onClick={() => toggle(item.id)}
                  className="px-3 py-2 rounded-xl text-sm font-medium border-[1.5px] transition-all"
                  style={{
                    borderColor: selected.has(item.id) ? 'hsl(var(--primary))' : 'hsl(var(--border))',
                    backgroundColor: selected.has(item.id) ? 'hsl(var(--primary) / 0.15)' : 'hsl(var(--card))',
                    color: selected.has(item.id) ? 'hsl(var(--primary))' : 'hsl(var(--foreground))',
                  }}
                >
                  {item.name} {item.quantity || 1}{getUnitLabel(language, item.unit || 'pcs')}
                </button>
              ))}
            </div>
          )}
        </div>
        {selected.size > 0 && (
          <div className="modal-actions">
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
