import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Minus, Plus, Check } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useTranslation } from '@/hooks/useTranslation';

interface QuickItem {
  emoji: string;
  nameKey: string;
  name: string;
}

interface Category {
  emoji: string;
  labelKey: string;
  label: string;
  items: QuickItem[];
}

const buildCategories = (t: any): Category[] => {
  const qa = t.inventory?.quickAddCategories || {};
  return [
    {
      emoji: '🥚', labelKey: 'dairy', label: qa.dairy || 'Eggs & Dairy',
      items: [
        { emoji: '🥚', nameKey: 'eggs', name: qa.eggs || 'Eggs' },
        { emoji: '🥛', nameKey: 'milk', name: qa.milk || 'Milk' },
        { emoji: '🧀', nameKey: 'cheese', name: qa.cheese || 'Cheese' },
        { emoji: '🧈', nameKey: 'butter', name: qa.butter || 'Butter' },
        { emoji: '🥗', nameKey: 'sourCream', name: qa.sourCream || 'Sour cream' },
        { emoji: '🫙', nameKey: 'yogurt', name: qa.yogurt || 'Yogurt' },
        { emoji: '🥛', nameKey: 'kefir', name: qa.kefir || 'Kefir' },
        { emoji: '🧀', nameKey: 'cottageCheese', name: qa.cottageCheese || 'Cottage cheese' },
      ],
    },
    {
      emoji: '🥩', labelKey: 'meat', label: qa.meat || 'Meat & Fish',
      items: [
        { emoji: '🥩', nameKey: 'beef', name: qa.beef || 'Beef' },
        { emoji: '🍗', nameKey: 'chicken', name: qa.chicken || 'Chicken' },
        { emoji: '🥓', nameKey: 'pork', name: qa.pork || 'Pork' },
        { emoji: '🐟', nameKey: 'fish', name: qa.fish || 'Fish' },
        { emoji: '🍖', nameKey: 'mince', name: qa.mince || 'Minced meat' },
        { emoji: '🌭', nameKey: 'sausage', name: qa.sausage || 'Sausage' },
      ],
    },
    {
      emoji: '🥬', labelKey: 'vegetables', label: qa.vegetables || 'Vegetables',
      items: [
        { emoji: '🥔', nameKey: 'potato', name: qa.potato || 'Potatoes' },
        { emoji: '🧅', nameKey: 'onion', name: qa.onion || 'Onion' },
        { emoji: '🧄', nameKey: 'garlic', name: qa.garlic || 'Garlic' },
        { emoji: '🥕', nameKey: 'carrot', name: qa.carrot || 'Carrots' },
        { emoji: '🍅', nameKey: 'tomato', name: qa.tomato || 'Tomatoes' },
        { emoji: '🥒', nameKey: 'cucumber', name: qa.cucumber || 'Cucumbers' },
        { emoji: '🫑', nameKey: 'pepper', name: qa.pepper || 'Bell pepper' },
        { emoji: '🥦', nameKey: 'broccoli', name: qa.broccoli || 'Broccoli' },
      ],
    },
    {
      emoji: '🍎', labelKey: 'fruits', label: qa.fruits || 'Fruits',
      items: [
        { emoji: '🍎', nameKey: 'apple', name: qa.apple || 'Apples' },
        { emoji: '🍌', nameKey: 'banana', name: qa.banana || 'Bananas' },
        { emoji: '🍊', nameKey: 'orange', name: qa.orange || 'Oranges' },
        { emoji: '🍋', nameKey: 'lemon', name: qa.lemon || 'Lemon' },
        { emoji: '🍇', nameKey: 'grapes', name: qa.grapes || 'Grapes' },
        { emoji: '🍓', nameKey: 'strawberry', name: qa.strawberry || 'Strawberries' },
        { emoji: '🥭', nameKey: 'mango', name: qa.mango || 'Mango' },
        { emoji: '🍐', nameKey: 'pear', name: qa.pear || 'Pears' },
      ],
    },
    {
      emoji: '🍞', labelKey: 'bread', label: qa.bread || 'Bread & Bakery',
      items: [
        { emoji: '🍞', nameKey: 'breadLoaf', name: qa.breadLoaf || 'Bread' },
        { emoji: '🥖', nameKey: 'baguette', name: qa.baguette || 'Baguette' },
        { emoji: '🫓', nameKey: 'lavash', name: qa.lavash || 'Lavash' },
        { emoji: '🥐', nameKey: 'croissant', name: qa.croissant || 'Croissant' },
      ],
    },
    {
      emoji: '🫙', labelKey: 'grains', label: qa.grains || 'Grains & Canned',
      items: [
        { emoji: '🍚', nameKey: 'rice', name: qa.rice || 'Rice' },
        { emoji: '🍝', nameKey: 'pasta', name: qa.pasta || 'Pasta' },
        { emoji: '🌾', nameKey: 'buckwheat', name: qa.buckwheat || 'Buckwheat' },
        { emoji: '🫘', nameKey: 'beans', name: qa.beans || 'Beans' },
        { emoji: '🌽', nameKey: 'corn', name: qa.corn || 'Corn' },
        { emoji: '🥣', nameKey: 'oatmeal', name: qa.oatmeal || 'Oatmeal' },
        { emoji: '🍙', nameKey: 'barley', name: qa.barley || 'Barley' },
        { emoji: '🫘', nameKey: 'lentils', name: qa.lentils || 'Lentils' },
      ],
    },
    {
      emoji: '🧂', labelKey: 'spices', label: qa.spices || 'Spices & Sauces',
      items: [
        { emoji: '🧂', nameKey: 'salt', name: qa.salt || 'Salt' },
        { emoji: '🌶', nameKey: 'pepperSpice', name: qa.pepperSpice || 'Pepper' },
        { emoji: '🫒', nameKey: 'oliveOil', name: qa.oliveOil || 'Olive oil' },
        { emoji: '🧴', nameKey: 'ketchup', name: qa.ketchup || 'Ketchup' },
        { emoji: '🍯', nameKey: 'honey', name: qa.honey || 'Honey' },
        { emoji: '🫙', nameKey: 'mayo', name: qa.mayo || 'Mayonnaise' },
      ],
    },
    {
      emoji: '🍫', labelKey: 'snacks', label: qa.snacks || 'Snacks & Sweets',
      items: [
        { emoji: '🍫', nameKey: 'chocolate', name: qa.chocolate || 'Chocolate' },
        { emoji: '🍪', nameKey: 'cookies', name: qa.cookies || 'Cookies' },
        { emoji: '🥜', nameKey: 'nuts', name: qa.nuts || 'Nuts' },
        { emoji: '🧃', nameKey: 'juice', name: qa.juice || 'Juice' },
        { emoji: '🍿', nameKey: 'chips', name: qa.chips || 'Chips' },
      ],
    },
  ];
};

type Step = 'select' | 'quantity';

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

const QuickAddModal = ({ open, onClose, onSaved }: Props) => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const qa = (t.inventory as any)?.quickAddFlow || {};

  const categories = useMemo(() => buildCategories(t), [t]);

  const [step, setStep] = useState<Step>('select');
  const [expandedCat, setExpandedCat] = useState<string | null>(null);
  const [selected, setSelected] = useState<Map<string, { name: string; emoji: string; qty: number }>>(new Map());
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);

  if (!open) return null;

  const allItems = categories.flatMap(c => c.items);
  const filteredItems = search.trim()
    ? allItems.filter(i => i.name.toLowerCase().includes(search.toLowerCase()))
    : null;

  const toggleItem = (item: QuickItem) => {
    setSelected(prev => {
      const next = new Map(prev);
      if (next.has(item.nameKey)) {
        next.delete(item.nameKey);
      } else {
        next.set(item.nameKey, { name: item.name, emoji: item.emoji, qty: 1 });
      }
      return next;
    });
  };

  const updateQty = (key: string, delta: number) => {
    setSelected(prev => {
      const next = new Map(prev);
      const item = next.get(key);
      if (item) {
        const newQty = Math.max(1, item.qty + delta);
        next.set(key, { ...item, qty: newQty });
      }
      return next;
    });
  };

  const handleSaveAll = async () => {
    if (!user || selected.size === 0) return;
    setSaving(true);
    try {
      const items = Array.from(selected.entries()).map(([, val]) => ({
        user_id: user.id,
        name: val.name,
        quantity: val.qty,
        unit: 'pcs',
        storage_location: 'home',
        tracking_mode: 'date_only',
      }));
      const { error } = await supabase.from('inventory_items').insert(items as any);
      if (error) throw error;
      toast.success((qa.addedSuccess || '{count} items added').replace('{count}', String(selected.size)));
      onSaved();
      handleClose();
    } catch {
      toast.error(t.inventory.errorSaving);
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setStep('select');
    setSelected(new Map());
    setSearch('');
    setExpandedCat(null);
    onClose();
  };

  const renderItemButton = (item: QuickItem) => {
    const isSelected = selected.has(item.nameKey);
    return (
      <button
        key={item.nameKey}
        onClick={() => toggleItem(item)}
        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all active:scale-95 border"
        style={{
          backgroundColor: isSelected ? 'hsl(var(--primary) / 0.15)' : 'hsl(var(--card))',
          borderColor: isSelected ? 'hsl(var(--primary))' : 'hsl(var(--border))',
          color: isSelected ? 'hsl(var(--primary))' : 'hsl(var(--foreground))',
        }}
      >
        {isSelected && <Check className="w-3.5 h-3.5" />}
        <span>{item.emoji}</span>
        <span className="truncate">{item.name}</span>
      </button>
    );
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div className="absolute inset-0 bg-black/30" onClick={handleClose} />
        <motion.div
          className="relative bg-card w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl max-h-[92vh] flex flex-col"
          style={{ boxShadow: '0 -4px 40px rgba(124,58,237,0.12)' }}
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          exit={{ y: 100 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 pb-2">
            <div>
              <h2 className="text-lg font-bold text-foreground">
                {step === 'select' ? (qa.title || 'What do you have at home?') : (qa.adjustQty || 'Adjust quantities')}
              </h2>
              {step === 'select' && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {qa.subtitle || 'Just check items — storage location doesn\'t matter'}
                </p>
              )}
            </div>
            <button onClick={handleClose} className="p-1.5 rounded-lg hover:bg-muted/50">
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>

          {step === 'select' ? (
            <>
              {/* Search */}
              <div className="px-4 pb-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder={qa.searchPlaceholder || 'Start typing or pick from list...'}
                    className="w-full h-11 pl-9 pr-3 rounded-xl border text-sm outline-none bg-secondary/50 border-border focus:border-primary"
                  />
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto px-4 pb-2" style={{ maxHeight: 'calc(92vh - 200px)' }}>
                {filteredItems ? (
                  <div className="flex flex-wrap gap-2 py-2">
                    {filteredItems.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-4 w-full text-center">
                        {qa.noResults || 'Nothing found'}
                      </p>
                    ) : (
                      filteredItems.map(item => renderItemButton(item))
                    )}
                  </div>
                ) : (
                  <div className="space-y-2 py-1">
                    {categories.map(cat => (
                      <div key={cat.labelKey}>
                        <button
                          onClick={() => setExpandedCat(expandedCat === cat.labelKey ? null : cat.labelKey)}
                          className="w-full flex items-center gap-2.5 p-3 rounded-xl transition-colors hover:bg-muted/40 active:scale-[0.99]"
                        >
                          <span className="text-2xl">{cat.emoji}</span>
                          <span className="text-sm font-semibold text-foreground flex-1 text-left">{cat.label}</span>
                          <span className="text-xs text-muted-foreground">
                            {cat.items.filter(i => selected.has(i.nameKey)).length > 0 &&
                              `${cat.items.filter(i => selected.has(i.nameKey)).length} ✓`}
                          </span>
                          <motion.span
                            animate={{ rotate: expandedCat === cat.labelKey ? 90 : 0 }}
                            className="text-muted-foreground text-sm"
                          >
                            ›
                          </motion.span>
                        </button>
                        <AnimatePresence>
                          {expandedCat === cat.labelKey && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="flex flex-wrap gap-2 px-2 pb-3 pt-1">
                                {cat.items.map(item => renderItemButton(item))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Bottom bar */}
              {selected.size > 0 && (
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className="p-4 border-t border-border"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-muted-foreground">
                      {(qa.selectedCount || 'Selected: {count} items').replace('{count}', String(selected.size))}
                    </span>
                  </div>
                  <button
                    onClick={() => setStep('quantity')}
                    className="w-full py-3 rounded-xl text-primary-foreground font-bold text-sm bg-primary active:scale-[0.98] transition-transform"
                  >
                    ✓ {qa.addAll || 'Add all'}
                  </button>
                </motion.div>
              )}
            </>
          ) : (
            <>
              {/* Quantity step */}
              <div className="flex-1 overflow-y-auto px-4 pb-2" style={{ maxHeight: 'calc(92vh - 180px)' }}>
                <div className="space-y-2 py-2">
                  {Array.from(selected.entries()).map(([key, val]) => (
                    <div key={key} className="flex items-center justify-between p-3 rounded-xl bg-secondary/30 border border-border">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{val.emoji}</span>
                        <span className="text-sm font-medium text-foreground">{val.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQty(key, -1)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center border border-border bg-card active:scale-95"
                        >
                          <Minus className="w-3.5 h-3.5 text-foreground" />
                        </button>
                        <span className="w-8 text-center text-sm font-bold text-foreground">{val.qty}</span>
                        <button
                          onClick={() => updateQty(key, 1)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center border border-border bg-card active:scale-95"
                        >
                          <Plus className="w-3.5 h-3.5 text-foreground" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Save bar */}
              <div className="p-4 border-t border-border space-y-2">
                <button
                  onClick={() => setStep('select')}
                  className="w-full py-2.5 rounded-xl text-sm font-medium text-muted-foreground border border-border"
                >
                  {qa.backToSelect || '← Back'}
                </button>
                <button
                  onClick={handleSaveAll}
                  disabled={saving}
                  className="w-full py-3 rounded-xl text-primary-foreground font-bold text-sm bg-primary active:scale-[0.98] transition-transform disabled:opacity-50"
                >
                  {saving ? t.inventory.saving : (qa.done || 'Done ✓')}
                </button>
              </div>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default QuickAddModal;
