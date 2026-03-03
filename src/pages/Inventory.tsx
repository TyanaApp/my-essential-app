import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Camera, Plus, Pencil, Trash2, ShoppingCart, UtensilsCrossed, Package } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import InventoryModal from '@/components/inventory/InventoryModal';
import ScanModal from '@/components/inventory/ScanModal';

export interface InventoryItem {
  id: string;
  user_id: string;
  name: string;
  category: string | null;
  quantity: number;
  unit: string;
  storage_location: string;
  expires_at: string | null;
  price_per_unit: number | null;
  added_at: string;
  updated_at: string;
}

type Tab = 'fridge' | 'pantry' | 'freezer' | 'expiring';

const TABS: { id: Tab; emoji: string; label: string }[] = [
  { id: 'fridge', emoji: '🧊', label: 'Fridge' },
  { id: 'pantry', emoji: '🏠', label: 'Pantry' },
  { id: 'freezer', emoji: '❄️', label: 'Freezer' },
  { id: 'expiring', emoji: '⏰', label: 'Expiring' },
];

const Inventory = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('fridge');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [scanOpen, setScanOpen] = useState(false);
  const [editItem, setEditItem] = useState<InventoryItem | null>(null);

  const fetchItems = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('inventory_items')
      .select('*')
      .eq('user_id', user.id)
      .order('added_at', { ascending: false });
    if (!error && data) setItems(data as unknown as InventoryItem[]);
    setLoading(false);
  };

  useEffect(() => { fetchItems(); }, [user]);

  const daysUntilExpiry = (date: string | null) => {
    if (!date) return null;
    const diff = (new Date(date).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    return Math.ceil(diff);
  };

  const filteredItems = useMemo(() => {
    let list = items;
    if (tab === 'expiring') {
      list = items.filter((i) => {
        const d = daysUntilExpiry(i.expires_at);
        return d !== null && d <= 3;
      });
    } else {
      list = items.filter((i) => i.storage_location === tab);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((i) => i.name.toLowerCase().includes(q));
    }
    return list;
  }, [items, tab, search]);

  const handleDelete = async (id: string) => {
    await supabase.from('inventory_items').delete().eq('id', id);
    setItems((prev) => prev.filter((i) => i.id !== id));
    toast.success('Deleted ✓');
  };

  const handleAddToShopping = async (item: InventoryItem) => {
    if (!user) return;
    await supabase.from('shopping_items').insert({
      user_id: user.id,
      name: item.name,
      quantity: item.quantity,
      unit: item.unit,
      category: item.category,
    } as any);
    toast.success(`${item.name} added to shopping list`);
  };

  const openAdd = () => { setEditItem(null); setModalOpen(true); };
  const openEdit = (item: InventoryItem) => { setEditItem(item); setModalOpen(true); };

  const expiryColor = (date: string | null) => {
    const d = daysUntilExpiry(date);
    if (d === null) return { bg: '#F3F4F6', text: '#9CA3AF', label: 'No date' };
    if (d < 0) return { bg: '#FEE2E2', text: '#DC2626', label: 'Expired' };
    if (d <= 3) return { bg: '#FEE2E2', text: '#DC2626', label: `${d}d left` };
    if (d <= 7) return { bg: '#FEF3C7', text: '#EA580C', label: `${d}d left` };
    return { bg: '#D1FAE5', text: '#059669', label: `${d}d left` };
  };

  return (
    <div className="min-h-screen p-6 pb-24">
      <h1 className="text-2xl font-bold mb-5" style={{ color: '#1E1B4B' }}>Inventory</h1>

      {/* Tabs */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all border-[1.5px]"
            style={{
              borderColor: tab === t.id ? '#7C3AED' : '#DDD6FE',
              backgroundColor: tab === t.id ? '#EDE9FE' : 'white',
              color: tab === t.id ? '#7C3AED' : '#6B7280',
            }}
          >
            <span>{t.emoji}</span> {t.label}
            {t.id === 'expiring' && (
              <span
                className="ml-1 text-[11px] font-bold px-1.5 py-0.5 rounded-full text-white"
                style={{ backgroundColor: '#DC2626' }}
              >
                {items.filter((i) => { const d = daysUntilExpiry(i.expires_at); return d !== null && d <= 3; }).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Action bar */}
      <div className="flex gap-2 mb-5">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#9CA3AF' }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search items..."
            className="w-full h-10 pl-9 pr-3 rounded-xl border text-sm outline-none focus:border-[#7C3AED]"
            style={{ borderColor: '#DDD6FE', backgroundColor: '#F5F3FF' }}
          />
        </div>
        <button
          className="flex items-center gap-1.5 px-4 h-10 rounded-xl border-[1.5px] text-sm font-medium"
          style={{ borderColor: '#DDD6FE', color: '#7C3AED' }}
          onClick={() => setScanOpen(true)}
        >
          <Camera className="w-4 h-4" /> Scan
        </button>
        <button
          className="flex items-center gap-1.5 px-4 h-10 rounded-xl text-sm font-medium text-white"
          style={{ backgroundColor: '#7C3AED' }}
          onClick={openAdd}
        >
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>

      {/* Item list */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-7 h-7 border-[3px] rounded-full animate-spin" style={{ borderColor: '#EDE9FE', borderTopColor: '#7C3AED' }} />
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">{tab === 'expiring' ? '✅' : '📦'}</div>
          <p className="text-base font-medium mb-1" style={{ color: '#1E1B4B' }}>
            {tab === 'expiring' ? 'Nothing expiring soon!' : 'Add your first item'}
          </p>
          <p className="text-sm" style={{ color: '#6B7280' }}>
            {tab === 'expiring' ? 'Your food is fresh.' : 'Tap "+ Add" or scan a photo.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence>
            {filteredItems.map((item) => {
              const exp = expiryColor(item.expires_at);
              return (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -80 }}
                  className="bg-white rounded-xl p-4 flex items-center gap-3"
                  style={{ boxShadow: '0 1px 6px rgba(124,58,237,0.04)' }}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: '#1E1B4B' }}>{item.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs font-medium" style={{ color: '#6B7280' }}>
                        {item.quantity} {item.unit}
                      </span>
                      <span
                        className="text-[11px] font-medium px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: exp.bg, color: exp.text }}
                      >
                        {exp.label}
                      </span>
                      {item.price_per_unit && (
                        <span className="text-[11px]" style={{ color: '#9CA3AF' }}>
                          €{item.price_per_unit}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {tab === 'expiring' && (
                      <button
                        onClick={() => toast.info('Recipe finder coming soon!')}
                        className="p-2 rounded-lg hover:bg-[#EDE9FE] transition-colors"
                        title="Find recipe"
                      >
                        <UtensilsCrossed className="w-4 h-4" style={{ color: '#7C3AED' }} />
                      </button>
                    )}
                    <button
                      onClick={() => handleAddToShopping(item)}
                      className="p-2 rounded-lg hover:bg-[#EDE9FE] transition-colors"
                      title="Add to shopping"
                    >
                      <ShoppingCart className="w-4 h-4" style={{ color: '#059669' }} />
                    </button>
                    <button
                      onClick={() => openEdit(item)}
                      className="p-2 rounded-lg hover:bg-[#EDE9FE] transition-colors"
                      title="Edit"
                    >
                      <Pencil className="w-4 h-4" style={{ color: '#7C3AED' }} />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-2 rounded-lg hover:bg-red-50 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" style={{ color: '#DC2626' }} />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Modals */}
      <InventoryModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditItem(null); }}
        editItem={editItem}
        onSaved={fetchItems}
      />
      <ScanModal
        open={scanOpen}
        onClose={() => setScanOpen(false)}
        onSaved={fetchItems}
      />
    </div>
  );
};

export default Inventory;
