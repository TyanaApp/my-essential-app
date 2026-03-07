import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Camera, Plus, Pencil, Trash2, ShoppingCart, UtensilsCrossed, Package } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import InventoryModal from '@/components/inventory/InventoryModal';
import ScanModal from '@/components/inventory/ScanModal';
import PantryQuickAdd from '@/components/inventory/PantryQuickAdd';
import { useSubscription, PLAN_LIMITS } from '@/hooks/useSubscription';
import UpgradeModal from '@/components/UpgradeModal';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useAutoReduce } from '@/hooks/useAutoReduce';
import { useTranslation } from '@/hooks/useTranslation';

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
  consumption_rate: string | null;
  is_opened: boolean;
  opened_at: string | null;
  tracking_mode: string | null;
}

type Tab = 'fridge' | 'pantry' | 'freezer' | 'expiring';

const Inventory = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  usePageTitle(t.inventory.title);
  useAutoReduce();
  const { plan } = useSubscription();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('fridge');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [scanOpen, setScanOpen] = useState(false);
  const [editItem, setEditItem] = useState<InventoryItem | null>(null);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [scanCount, setScanCount] = useState(0);

  const TABS: { id: Tab; label: string }[] = [
    { id: 'fridge', label: t.inventory.fridge },
    { id: 'pantry', label: t.inventory.pantry },
    { id: 'freezer', label: t.inventory.freezer },
    { id: 'expiring', label: t.inventory.expiring },
  ];

  useEffect(() => {
    const key = `scan_count_${new Date().getFullYear()}_${new Date().getMonth()}`;
    setScanCount(Number(localStorage.getItem(key) || '0'));
  }, []);

  const handleScanClick = () => {
    const limit = PLAN_LIMITS[plan].scansPerMonth;
    if (scanCount >= limit) {
      setUpgradeOpen(true);
      return;
    }
    setScanOpen(true);
  };

  const handleScanCompleted = () => {
    const key = `scan_count_${new Date().getFullYear()}_${new Date().getMonth()}`;
    const newCount = scanCount + 1;
    localStorage.setItem(key, String(newCount));
    setScanCount(newCount);
  };

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
    toast.success(t.inventory.deleted);
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
    toast.success(`${item.name} ${t.inventory.addedToShopping}`);
  };

  const handleToggleOpened = async (item: InventoryItem) => {
    const newOpened = !item.is_opened;
    await supabase
      .from('inventory_items')
      .update({
        is_opened: newOpened,
        opened_at: newOpened ? new Date().toISOString() : null,
      } as any)
      .eq('id', item.id);
    setItems((prev) =>
      prev.map((i) =>
        i.id === item.id ? { ...i, is_opened: newOpened, opened_at: newOpened ? new Date().toISOString() : null } : i
      )
    );
    toast.success(newOpened ? t.inventory.markedOpened : t.inventory.markedSealed);
  };

  const handleToggleTrackingMode = async (item: InventoryItem) => {
    const newMode = item.tracking_mode === 'date_only' ? 'tracked' : 'date_only';
    await supabase
      .from('inventory_items')
      .update({ tracking_mode: newMode } as any)
      .eq('id', item.id);
    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, tracking_mode: newMode } : i))
    );
  };

  const openAdd = () => { setEditItem(null); setModalOpen(true); };
  const activeLocation = tab === 'expiring' ? 'fridge' : tab;
  const openEdit = (item: InventoryItem) => { setEditItem(item); setModalOpen(true); };

  const expiryColor = (date: string | null) => {
    const d = daysUntilExpiry(date);
    if (d === null) return { bg: '#F3F4F6', text: '#9CA3AF', label: t.inventory.noDate };
    if (d < 0) return { bg: '#FEE2E2', text: '#DC2626', label: t.inventory.expired };
    if (d <= 3) return { bg: '#FEE2E2', text: '#DC2626', label: `${d}${t.inventory.daysLeft}` };
    if (d <= 7) return { bg: '#FEF3C7', text: '#EA580C', label: `${d}${t.inventory.daysLeft}` };
    return { bg: '#D1FAE5', text: '#059669', label: `${d}${t.inventory.daysLeft}` };
  };

  return (
    <div className="min-h-screen p-4 sm:p-6" style={{ paddingBottom: 90 }}>
      <h1 className="text-2xl font-bold mb-4" style={{ color: '#1E1B4B' }}>{t.inventory.title}</h1>

      {/* Tabs */}
      <div className="grid grid-cols-4 gap-1.5 mb-4">
        {TABS.map((tabItem) => (
          <button
            key={tabItem.id}
            onClick={() => setTab(tabItem.id)}
            className="px-1 py-2 rounded-full text-[13px] font-medium whitespace-nowrap transition-all text-center"
            style={{
              backgroundColor: tab === tabItem.id ? 'hsl(263, 84%, 58%)' : 'hsl(220, 13%, 91%)',
              color: tab === tabItem.id ? 'white' : '#6B7280',
            }}
          >
            {tabItem.label}
            {tabItem.id === 'expiring' && (
              <span
                className="ml-0.5 text-[10px] font-bold px-1 py-0.5 rounded-full text-white"
                style={{ backgroundColor: '#DC2626' }}
              >
                {items.filter((i) => { const d = daysUntilExpiry(i.expires_at); return d !== null && d <= 3; }).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#9CA3AF' }} />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t.inventory.search}
          className="w-full h-12 pl-9 pr-3 rounded-xl border text-sm outline-none focus:border-[#7C3AED]"
          style={{ borderColor: '#DDD6FE', backgroundColor: '#F5F3FF' }}
        />
      </div>

      {/* Action buttons */}
      <div className="grid grid-cols-2 gap-2 mb-5">
        <button
          className="flex items-center justify-center gap-1.5 h-12 rounded-xl border-[1.5px] text-sm font-medium"
          style={{ borderColor: 'hsl(263, 84%, 58%)', color: 'hsl(263, 84%, 58%)' }}
          onClick={handleScanClick}
        >
          <Camera className="w-4 h-4" /> {t.inventory.scan}
        </button>
        <button
          className="flex items-center justify-center gap-1.5 h-12 rounded-xl text-sm font-medium text-white"
          style={{ backgroundColor: 'hsl(263, 84%, 58%)' }}
          onClick={openAdd}
        >
          <Plus className="w-4 h-4" /> {t.inventory.add}
        </button>
      </div>

      {/* Pantry Quick Add */}
      {tab === 'pantry' && (
        <PantryQuickAdd onSaved={fetchItems} onOpenManual={openAdd} />
      )}

      {/* Item list */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-7 h-7 border-[3px] rounded-full animate-spin" style={{ borderColor: '#EDE9FE', borderTopColor: '#7C3AED' }} />
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">{tab === 'expiring' ? '🎉' : '📦'}</div>
          <p className="text-base font-medium" style={{ color: '#1E1B4B' }}>
            {tab === 'expiring' ? t.inventory.nothingExpiring : t.inventory.empty}
          </p>
          {tab !== 'expiring' && (
            <p className="text-sm mt-1" style={{ color: '#6B7280' }}>
              {t.inventory.emptyHint}
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence>
            {filteredItems.map((item) => {
              const exp = expiryColor(item.expires_at);
              const lowQty = item.tracking_mode !== 'date_only' && item.quantity <= 0.2;
              return (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -80 }}
                  className="bg-white rounded-xl p-3 sm:p-4"
                  style={{ boxShadow: '0 1px 6px rgba(124,58,237,0.04)' }}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="text-sm font-semibold truncate" style={{ color: '#1E1B4B' }}>{item.name}</p>
                        {item.is_opened && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded-full" style={{ backgroundColor: '#FFF7ED', color: '#EA580C' }}>
                            <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ backgroundColor: '#EA580C' }} />
                            {t.inventory.opened}
                          </span>
                        )}
                        {lowQty && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: '#FEE2E2', color: '#DC2626' }}>
                            {t.inventory.low}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {item.tracking_mode !== 'date_only' && (
                          <span className="text-xs font-medium" style={{ color: '#6B7280' }}>
                            {item.quantity} {item.unit}
                          </span>
                        )}
                        <span
                          className="text-[11px] font-medium px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: exp.bg, color: exp.text }}
                        >
                          {exp.label}
                        </span>
                        {item.price_per_unit && (
                          <span className="text-[11px]" style={{ color: '#9CA3AF' }}>€{item.price_per_unit}</span>
                        )}
                        <button
                          onClick={() => handleToggleTrackingMode(item)}
                          className="text-[10px] font-medium px-1.5 py-0.5 rounded-full"
                          style={{ backgroundColor: item.tracking_mode === 'date_only' ? '#EFF6FF' : '#F0FDF4', color: item.tracking_mode === 'date_only' ? '#3B82F6' : '#059669' }}
                        >
                          {item.tracking_mode === 'date_only' ? t.inventory.dateOnly : t.inventory.tracked}
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-0.5 shrink-0">
                      <button
                        onClick={() => handleToggleOpened(item)}
                        className="p-1.5 rounded-lg transition-colors text-[11px]"
                        style={{ backgroundColor: item.is_opened ? '#FFF7ED' : 'transparent' }}
                        title={item.is_opened ? t.inventory.markedSealed : t.inventory.markedOpened}
                      >
                        📦
                      </button>
                      {tab === 'expiring' && (
                        <button
                          onClick={() => toast.info(t.inventory.recipeFinder)}
                          className="p-1.5 rounded-lg hover:bg-[#EDE9FE] transition-colors"
                        >
                          <UtensilsCrossed className="w-4 h-4" style={{ color: '#7C3AED' }} />
                        </button>
                      )}
                      <button
                        onClick={() => handleAddToShopping(item)}
                        className="p-1.5 rounded-lg hover:bg-[#EDE9FE] transition-colors"
                      >
                        <ShoppingCart className="w-4 h-4" style={{ color: '#059669' }} />
                      </button>
                      <button
                        onClick={() => openEdit(item)}
                        className="p-1.5 rounded-lg hover:bg-[#EDE9FE] transition-colors"
                      >
                        <Pencil className="w-4 h-4" style={{ color: '#7C3AED' }} />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" style={{ color: '#DC2626' }} />
                      </button>
                    </div>
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
        defaultLocation={activeLocation}
      />
      <ScanModal
        open={scanOpen}
        onClose={() => setScanOpen(false)}
        onSaved={() => { fetchItems(); handleScanCompleted(); }}
      />
      <UpgradeModal
        open={upgradeOpen}
        onOpenChange={setUpgradeOpen}
        title={t.inventory.scanLimit}
        description={t.inventory.scanLimitDesc}
        suggestedPlan="lite"
      />
    </div>
  );
};

export default Inventory;
