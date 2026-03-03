import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Pencil, Trash2, PackagePlus, AlertTriangle, X, Check } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

interface ShoppingItem {
  id: string;
  user_id: string;
  name: string;
  quantity: number | null;
  unit: string | null;
  category: string | null;
  estimated_price: number | null;
  is_purchased: boolean | null;
  created_at: string | null;
}

interface LowStockItem {
  name: string;
  quantity: number | null;
  unit: string | null;
  category: string | null;
  reason: 'expiring' | 'low';
}

const CATEGORIES: { id: string; emoji: string; label: string }[] = [
  { id: 'meat', emoji: '🥩', label: 'Meat' },
  { id: 'dairy', emoji: '🥛', label: 'Dairy' },
  { id: 'produce', emoji: '🥬', label: 'Produce' },
  { id: 'dry_goods', emoji: '🌾', label: 'Dry Goods' },
  { id: 'other', emoji: '🧴', label: 'Other' },
];

const cardStyle = {
  backgroundColor: 'white',
  borderRadius: '20px',
  boxShadow: '0 2px 16px rgba(124,58,237,0.08)',
};

const Shopping = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [budget, setBudget] = useState<number>(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<ShoppingItem | null>(null);
  const [confirmItem, setConfirmItem] = useState<ShoppingItem | null>(null);
  const [suggestions, setSuggestions] = useState<LowStockItem[]>([]);
  const [suggestDismissed, setSuggestDismissed] = useState(false);

  // Form state
  const [formName, setFormName] = useState('');
  const [formQty, setFormQty] = useState('1');
  const [formUnit, setFormUnit] = useState('pcs');
  const [formCategory, setFormCategory] = useState('other');
  const [formPrice, setFormPrice] = useState('');

  const fetchItems = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('shopping_items')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (data) setItems(data as unknown as ShoppingItem[]);
    setLoading(false);
  };

  const fetchSuggestions = async () => {
    if (!user) return;
    const fiveDays = new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0];
    const today = new Date().toISOString().split('T')[0];

    const [expiringRes, lowRes] = await Promise.all([
      supabase
        .from('inventory_items')
        .select('name, quantity, unit, category')
        .eq('user_id', user.id)
        .not('expires_at', 'is', null)
        .lte('expires_at', fiveDays)
        .gte('expires_at', today),
      supabase
        .from('inventory_items')
        .select('name, quantity, unit, category')
        .eq('user_id', user.id)
        .lt('quantity', 1),
    ]);

    const all: LowStockItem[] = [
      ...(expiringRes.data || []).map((i: any) => ({ ...i, reason: 'expiring' as const })),
      ...(lowRes.data || []).map((i: any) => ({ ...i, reason: 'low' as const })),
    ];
    // Deduplicate by name
    const unique = Array.from(new Map(all.map((i) => [i.name, i])).values());
    setSuggestions(unique);
  };

  useEffect(() => {
    fetchItems();
    fetchSuggestions();
  }, [user]);

  const activeItems = useMemo(() => items.filter((i) => !i.is_purchased), [items]);
  const purchasedItems = useMemo(() => items.filter((i) => i.is_purchased), [items]);

  const groupedActive = useMemo(() => {
    const groups: Record<string, ShoppingItem[]> = {};
    for (const cat of CATEGORIES) groups[cat.id] = [];
    for (const item of activeItems) {
      const cat = item.category || 'other';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(item);
    }
    return groups;
  }, [activeItems]);

  const totalEstimated = useMemo(
    () => items.reduce((s, i) => s + (i.estimated_price || 0) * (i.quantity || 1), 0),
    [items]
  );

  const purchasedTotal = useMemo(
    () => purchasedItems.reduce((s, i) => s + (i.estimated_price || 0) * (i.quantity || 1), 0),
    [purchasedItems]
  );

  const budgetPct = budget > 0 ? Math.min((totalEstimated / budget) * 100, 100) : 0;
  const budgetColor = budgetPct > 90 ? '#DC2626' : budgetPct > 70 ? '#EA580C' : '#059669';

  // Toggle purchase
  const handleTogglePurchase = async (item: ShoppingItem) => {
    if (!item.is_purchased) {
      // About to mark as purchased → show confirm modal
      setConfirmItem(item);
    } else {
      // Unmark
      await supabase.from('shopping_items').update({ is_purchased: false } as any).eq('id', item.id);
      setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, is_purchased: false } : i)));
    }
  };

  const confirmPurchase = async (addToInventory: boolean) => {
    if (!confirmItem || !user) return;
    await supabase.from('shopping_items').update({ is_purchased: true } as any).eq('id', confirmItem.id);
    setItems((prev) => prev.map((i) => (i.id === confirmItem.id ? { ...i, is_purchased: true } : i)));

    if (addToInventory) {
      await supabase.from('inventory_items').insert({
        user_id: user.id,
        name: confirmItem.name,
        quantity: confirmItem.quantity || 1,
        unit: confirmItem.unit || 'pcs',
        category: confirmItem.category,
        storage_location: 'fridge',
      } as any);
      toast.success(`${confirmItem.name} added to inventory ✓`);
    } else {
      toast.success('Marked as purchased ✓');
    }
    setConfirmItem(null);
  };

  const handleDelete = async (id: string) => {
    await supabase.from('shopping_items').delete().eq('id', id);
    setItems((prev) => prev.filter((i) => i.id !== id));
    toast.success('Deleted ✓');
  };

  const handleClearPurchased = async () => {
    const ids = purchasedItems.map((i) => i.id);
    if (!ids.length) return;
    await supabase.from('shopping_items').delete().in('id', ids);
    setItems((prev) => prev.filter((i) => !i.is_purchased));
    toast.success('Cleared purchased items');
  };

  const openAdd = () => {
    setEditItem(null);
    setFormName('');
    setFormQty('1');
    setFormUnit('pcs');
    setFormCategory('other');
    setFormPrice('');
    setModalOpen(true);
  };

  const openEdit = (item: ShoppingItem) => {
    setEditItem(item);
    setFormName(item.name);
    setFormQty(String(item.quantity || 1));
    setFormUnit(item.unit || 'pcs');
    setFormCategory(item.category || 'other');
    setFormPrice(item.estimated_price ? String(item.estimated_price) : '');
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!user || !formName.trim()) return;
    const payload = {
      user_id: user.id,
      name: formName.trim(),
      quantity: Number(formQty) || 1,
      unit: formUnit,
      category: formCategory,
      estimated_price: formPrice ? Number(formPrice) : null,
    };

    if (editItem) {
      await supabase.from('shopping_items').update(payload as any).eq('id', editItem.id);
      setItems((prev) => prev.map((i) => (i.id === editItem.id ? { ...i, ...payload } : i)));
      toast.success('Updated ✓');
    } else {
      const { data } = await supabase.from('shopping_items').insert(payload as any).select().single();
      if (data) setItems((prev) => [data as unknown as ShoppingItem, ...prev]);
      toast.success('Added ✓');
    }
    setModalOpen(false);
  };

  const handleAddAllSuggestions = async () => {
    if (!user) return;
    const inserts = suggestions.map((s) => ({
      user_id: user.id,
      name: s.name,
      quantity: 1,
      unit: s.unit || 'pcs',
      category: s.category || 'other',
    }));
    await supabase.from('shopping_items').insert(inserts as any);
    await fetchItems();
    setSuggestDismissed(true);
    toast.success(`${suggestions.length} items added to list`);
  };

  const fadeUp = (i: number) => ({
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.3, delay: i * 0.1 },
  });

  return (
    <div className="min-h-screen p-6 pb-24">
      {/* Header */}
      <motion.div {...fadeUp(0)} className="mb-5">
        <h1 className="text-2xl font-bold" style={{ color: '#1E1B4B' }}>My Shopping List</h1>
      </motion.div>

      {/* Actions */}
      <motion.div {...fadeUp(1)} className="flex items-center gap-2 mb-4">
        <button
          onClick={openAdd}
          className="flex items-center gap-1.5 px-4 h-10 rounded-xl text-sm font-medium text-white"
          style={{ backgroundColor: '#7C3AED' }}
        >
          <Plus className="w-4 h-4" /> Add Item
        </button>
        <div className="flex-1 flex items-center gap-1.5">
          <span className="text-xs font-medium whitespace-nowrap" style={{ color: '#6B7280' }}>
            Budget: €
          </span>
          <input
            type="number"
            value={budget || ''}
            onChange={(e) => setBudget(Number(e.target.value))}
            placeholder="0"
            className="w-20 h-10 px-2 rounded-xl border text-sm text-right outline-none focus:border-[#7C3AED]"
            style={{ borderColor: '#DDD6FE', backgroundColor: '#F5F3FF' }}
          />
        </div>
      </motion.div>

      {/* Budget bar */}
      {budget > 0 && (
        <motion.div {...fadeUp(2)} className="mb-5">
          <div className="flex justify-between text-xs mb-1">
            <span style={{ color: '#6B7280' }}>Est. total: €{totalEstimated.toFixed(2)}</span>
            <span style={{ color: budgetColor }} className="font-semibold">
              {budgetPct.toFixed(0)}% of budget
            </span>
          </div>
          <div className="h-2 rounded-full" style={{ backgroundColor: '#F3F4F6' }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ backgroundColor: budgetColor, width: `${budgetPct}%` }}
            />
          </div>
        </motion.div>
      )}

      {/* Auto-suggest banner */}
      {suggestions.length > 0 && !suggestDismissed && (
        <motion.div
          {...fadeUp(2)}
          className="mb-5 p-4 rounded-2xl flex items-center gap-3"
          style={{ backgroundColor: '#FEF3C7', border: '1px solid #FDE68A' }}
        >
          <AlertTriangle className="w-5 h-5 shrink-0" style={{ color: '#EA580C' }} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold" style={{ color: '#1E1B4B' }}>
              TYANA suggests {suggestions.length} item{suggestions.length > 1 ? 's' : ''} running low
            </p>
            <p className="text-xs" style={{ color: '#6B7280' }}>
              {suggestions.slice(0, 3).map((s) => s.name).join(', ')}
              {suggestions.length > 3 ? '...' : ''}
            </p>
          </div>
          <button
            onClick={handleAddAllSuggestions}
            className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold text-white"
            style={{ backgroundColor: '#EA580C' }}
          >
            Add All
          </button>
          <button onClick={() => setSuggestDismissed(true)} className="shrink-0 p-1">
            <X className="w-4 h-4" style={{ color: '#9CA3AF' }} />
          </button>
        </motion.div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-7 h-7 border-[3px] rounded-full animate-spin" style={{ borderColor: '#EDE9FE', borderTopColor: '#7C3AED' }} />
        </div>
      ) : activeItems.length === 0 && purchasedItems.length === 0 ? (
        <motion.div {...fadeUp(3)} className="text-center py-16">
          <div className="text-5xl mb-4">🛒</div>
          <p className="text-base font-medium mb-1" style={{ color: '#1E1B4B' }}>Your list is empty</p>
          <p className="text-sm" style={{ color: '#6B7280' }}>Tap "+ Add Item" to get started</p>
        </motion.div>
      ) : (
        <div className="space-y-4">
          {/* Grouped items */}
          {CATEGORIES.map((cat) => {
            const catItems = groupedActive[cat.id];
            if (!catItems || catItems.length === 0) return null;
            return (
              <motion.div key={cat.id} {...fadeUp(3)} style={cardStyle} className="p-4">
                <h3 className="text-sm font-bold mb-3 flex items-center gap-1.5" style={{ color: '#1E1B4B' }}>
                  <span>{cat.emoji}</span> {cat.label}
                </h3>
                <div className="space-y-1">
                  <AnimatePresence>
                    {catItems.map((item) => (
                      <motion.div
                        key={item.id}
                        layout
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -60 }}
                        className="flex items-center gap-2 py-2 px-1 rounded-lg hover:bg-[#F5F3FF] transition-colors"
                      >
                        <button
                          onClick={() => handleTogglePurchase(item)}
                          className="w-5 h-5 rounded border-[1.5px] flex items-center justify-center shrink-0"
                          style={{ borderColor: '#DDD6FE' }}
                        />
                        <span className="flex-1 text-sm font-medium truncate" style={{ color: '#1E1B4B' }}>
                          {item.name}
                        </span>
                        <span className="text-xs shrink-0" style={{ color: '#6B7280' }}>
                          {item.quantity || 1} {item.unit || 'pcs'}
                        </span>
                        {item.estimated_price && (
                          <span className="text-xs shrink-0" style={{ color: '#9CA3AF' }}>
                            €{(item.estimated_price * (item.quantity || 1)).toFixed(2)}
                          </span>
                        )}
                        <button onClick={() => openEdit(item)} className="p-1.5 rounded-lg hover:bg-[#EDE9FE]">
                          <Pencil className="w-3.5 h-3.5" style={{ color: '#7C3AED' }} />
                        </button>
                        <button onClick={() => handleDelete(item.id)} className="p-1.5 rounded-lg hover:bg-red-50">
                          <Trash2 className="w-3.5 h-3.5" style={{ color: '#DC2626' }} />
                        </button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </motion.div>
            );
          })}

          {/* Purchased section */}
          {purchasedItems.length > 0 && (
            <motion.div {...fadeUp(4)} style={cardStyle} className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold flex items-center gap-1.5" style={{ color: '#059669' }}>
                  <Check className="w-4 h-4" /> Purchased ({purchasedItems.length})
                </h3>
                <button
                  onClick={handleClearPurchased}
                  className="text-xs font-medium px-3 py-1 rounded-lg"
                  style={{ color: '#DC2626', backgroundColor: '#FEE2E2' }}
                >
                  Clear purchased
                </button>
              </div>
              <div className="space-y-1">
                {purchasedItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-2 py-2 px-1 rounded-lg"
                  >
                    <button
                      onClick={() => handleTogglePurchase(item)}
                      className="w-5 h-5 rounded flex items-center justify-center shrink-0"
                      style={{ backgroundColor: '#059669' }}
                    >
                      <Check className="w-3 h-3 text-white" />
                    </button>
                    <span className="flex-1 text-sm line-through truncate" style={{ color: '#9CA3AF' }}>
                      {item.name}
                    </span>
                    <span className="text-xs shrink-0" style={{ color: '#D1D5DB' }}>
                      {item.quantity || 1} {item.unit || 'pcs'}
                    </span>
                  </div>
                ))}
              </div>
              {purchasedTotal > 0 && (
                <p className="text-xs mt-3 font-medium" style={{ color: '#059669' }}>
                  Spent: €{purchasedTotal.toFixed(2)}
                </p>
              )}
            </motion.div>
          )}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="rounded-2xl max-w-sm">
          <DialogHeader>
            <DialogTitle style={{ color: '#1E1B4B' }}>
              {editItem ? 'Edit Item' : 'Add Item'}
            </DialogTitle>
            <DialogDescription>
              {editItem ? 'Update the shopping item details.' : 'Add a new item to your shopping list.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <div>
              <label className="text-xs font-medium mb-1 block" style={{ color: '#6B7280' }}>Name</label>
              <input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g. Chicken breast"
                className="w-full h-10 px-3 rounded-xl border text-sm outline-none focus:border-[#7C3AED]"
                style={{ borderColor: '#DDD6FE', backgroundColor: '#F5F3FF' }}
              />
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="text-xs font-medium mb-1 block" style={{ color: '#6B7280' }}>Qty</label>
                <input
                  type="number"
                  value={formQty}
                  onChange={(e) => setFormQty(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border text-sm outline-none focus:border-[#7C3AED]"
                  style={{ borderColor: '#DDD6FE', backgroundColor: '#F5F3FF' }}
                />
              </div>
              <div className="flex-1">
                <label className="text-xs font-medium mb-1 block" style={{ color: '#6B7280' }}>Unit</label>
                <select
                  value={formUnit}
                  onChange={(e) => setFormUnit(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border text-sm outline-none focus:border-[#7C3AED] appearance-none"
                  style={{ borderColor: '#DDD6FE', backgroundColor: '#F5F3FF' }}
                >
                  {['pcs', 'kg', 'g', 'L', 'ml', 'pack'].map((u) => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block" style={{ color: '#6B7280' }}>Category</label>
              <div className="flex flex-wrap gap-1.5">
                {CATEGORIES.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setFormCategory(c.id)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium border-[1.5px] transition-all"
                    style={{
                      borderColor: formCategory === c.id ? '#7C3AED' : '#DDD6FE',
                      backgroundColor: formCategory === c.id ? '#EDE9FE' : 'white',
                      color: formCategory === c.id ? '#7C3AED' : '#6B7280',
                    }}
                  >
                    {c.emoji} {c.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block" style={{ color: '#6B7280' }}>Est. Price (€)</label>
              <input
                type="number"
                step="0.01"
                value={formPrice}
                onChange={(e) => setFormPrice(e.target.value)}
                placeholder="0.00"
                className="w-full h-10 px-3 rounded-xl border text-sm outline-none focus:border-[#7C3AED]"
                style={{ borderColor: '#DDD6FE', backgroundColor: '#F5F3FF' }}
              />
            </div>
            <button
              onClick={handleSave}
              disabled={!formName.trim()}
              className="w-full h-11 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
              style={{ backgroundColor: '#7C3AED' }}
            >
              {editItem ? 'Update' : 'Add to List'}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirm add to inventory modal */}
      <Dialog open={!!confirmItem} onOpenChange={() => setConfirmItem(null)}>
        <DialogContent className="rounded-2xl max-w-xs text-center">
          <DialogHeader>
            <DialogTitle style={{ color: '#1E1B4B' }}>Add to inventory?</DialogTitle>
            <DialogDescription>
              Would you like to add <strong>{confirmItem?.name}</strong> to your home inventory?
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => confirmPurchase(true)}
              className="flex-1 h-10 rounded-xl text-sm font-semibold text-white"
              style={{ backgroundColor: '#059669' }}
            >
              <PackagePlus className="w-4 h-4 inline mr-1" /> Yes
            </button>
            <button
              onClick={() => confirmPurchase(false)}
              className="flex-1 h-10 rounded-xl text-sm font-semibold border-[1.5px]"
              style={{ borderColor: '#DDD6FE', color: '#6B7280' }}
            >
              No
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Shopping;
