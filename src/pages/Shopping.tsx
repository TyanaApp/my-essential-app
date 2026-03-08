import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Pencil, Trash2, PackagePlus, AlertTriangle, X, Check } from 'lucide-react';
import StoragePickerModal from '@/components/StoragePickerModal';
import ReceiptScanModal from '@/components/shopping/ReceiptScanModal';
import StoreDealsCard from '@/components/shopping/StoreDealsCard';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useTranslation } from '@/hooks/useTranslation';
import { useLanguage } from '@/contexts/LanguageContext';
import { useFamily } from '@/hooks/useFamily';
import { formatMoney, getCurrencySymbol } from '@/lib/formatMoney';
import { useFoodValidation } from '@/hooks/useFoodValidation';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

interface ShoppingItem { id: string; user_id: string; name: string; quantity: number | null; unit: string | null; category: string | null; estimated_price: number | null; is_purchased: boolean | null; created_at: string | null; }
interface LowStockItem { name: string; quantity: number | null; unit: string | null; category: string | null; reason: 'expiring' | 'low'; }

const CATEGORY_IDS = ['meat', 'dairy', 'produce', 'dry_goods', 'other'] as const;
const CATEGORY_EMOJIS: Record<string, string> = { meat: '🥩', dairy: '🥛', produce: '🥬', dry_goods: '🌾', other: '🧴' };

const cardStyle = { borderRadius: '20px', boxShadow: '0 2px 16px rgba(124,58,237,0.08)' };

const Shopping = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const { language } = useLanguage();
  usePageTitle(t.shopping.title);
  const { validateFood } = useFoodValidation();
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [budget, setBudget] = useState<number>(0);
  const [currency, setCurrency] = useState('EUR');
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<ShoppingItem | null>(null);
  const [confirmItem, setConfirmItem] = useState<ShoppingItem | null>(null);
  const [storagePickerItem, setStoragePickerItem] = useState<ShoppingItem | null>(null);
  const [suggestions, setSuggestions] = useState<LowStockItem[]>([]);
  const [suggestDismissed, setSuggestDismissed] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);

  const handleVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toast.error(t.shopping.voiceNotSupported); return;
    }
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = language === 'ru' ? 'ru-RU' : language === 'lv' ? 'lv-LV' : 'en-US';
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => { setIsListening(false); toast.error(t.shopping.couldNotHear); };
    recognition.onresult = async (event: any) => {
      const transcript = event.results[0][0].transcript;
      toast(`🎤 ${(t.shopping as any).heard || 'Heard'}: "${transcript}"`);
      
      try {
        const { data, error } = await supabase.functions.invoke('parse-voice-shopping', {
          body: { transcript, language }
        });
        
        if (error || !data?.items?.length) {
          // Fallback: split by comma/and
          const voiceItems = transcript.split(/,|and|и|un/).map((s: string) => s.trim()).filter((s: string) => s.length > 0);
          if (!user || voiceItems.length === 0) return;
          // Validate each item
          const validItems: string[] = [];
          for (const item of voiceItems) {
            const ok = await validateFood(item);
            if (ok) validItems.push(item);
          }
          if (validItems.length === 0) return;
          const inserts = validItems.map((name: string) => ({ user_id: user!.id, name, quantity: 1, unit: 'pcs', category: 'other' }));
          await supabase.from('shopping_items').insert(inserts as any);
          await fetchItems();
          toast.success(`${(t.shopping as any).adding || 'Adding'}: ${validItems.join(', ')} ✓`);
          return;
        }
        
        const inserts = data.items.map((item: any) => ({
          user_id: user!.id,
          name: item.name,
          quantity: item.quantity || 1,
          unit: item.unit || 'pcs',
          category: 'other'
        }));
        await supabase.from('shopping_items').insert(inserts as any);
        await fetchItems();
        const summary = data.items.map((i: any) => `${i.name} ${i.quantity}${i.unit}`).join(', ');
        toast.success(`${(t.shopping as any).adding || 'Adding'}: ${summary} ✓`);
      } catch {
        toast.error(t.shopping.couldNotHear);
      }
    };
    recognition.start();
  };

  const [formName, setFormName] = useState('');
  const [formQty, setFormQty] = useState('1');
  const [formUnit, setFormUnit] = useState('pcs');
  const [formCategory, setFormCategory] = useState('other');
  const [formPrice, setFormPrice] = useState('');

  const fetchItems = async () => {
    if (!user) return;
    // RLS handles family visibility automatically
    const [{ data }, profileRes] = await Promise.all([
      supabase.from('shopping_items').select('*').order('created_at', { ascending: false }),
      supabase.from('profiles').select('currency').eq('user_id', user.id).maybeSingle(),
    ]);
    if (data) setItems(data as unknown as ShoppingItem[]);
    if (profileRes.data?.currency) setCurrency(profileRes.data.currency);
    setLoading(false);
  };

  const fetchSuggestions = async () => {
    if (!user) return;
    const fiveDays = new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0];
    const today = new Date().toISOString().split('T')[0];
    const [expiringRes, lowRes] = await Promise.all([
      supabase.from('inventory_items').select('name, quantity, unit, category').eq('user_id', user.id).not('expires_at', 'is', null).lte('expires_at', fiveDays).gte('expires_at', today),
      supabase.from('inventory_items').select('name, quantity, unit, category').eq('user_id', user.id).lt('quantity', 1),
    ]);
    const all: LowStockItem[] = [
      ...(expiringRes.data || []).map((i: any) => ({ ...i, reason: 'expiring' as const })),
      ...(lowRes.data || []).map((i: any) => ({ ...i, reason: 'low' as const })),
    ];
    const unique = Array.from(new Map(all.map((i) => [i.name, i])).values());
    setSuggestions(unique);
  };

  useEffect(() => { fetchItems(); fetchSuggestions(); }, [user]);

  // Realtime subscription for family shared shopping
  useEffect(() => {
    const channel = supabase
      .channel('shopping-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'shopping_items' }, () => {
        fetchItems();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const activeItems = useMemo(() => items.filter((i) => !i.is_purchased), [items]);
  const purchasedItems = useMemo(() => items.filter((i) => i.is_purchased), [items]);

  const CATEGORIES = CATEGORY_IDS.map((id) => ({
    id,
    emoji: CATEGORY_EMOJIS[id],
    label: t.shopping[id === 'dry_goods' ? 'dryGoods' : id as keyof typeof t.shopping] as string,
  }));

  const groupedActive = useMemo(() => {
    const groups: Record<string, ShoppingItem[]> = {};
    for (const cat of CATEGORY_IDS) groups[cat] = [];
    for (const item of activeItems) {
      const cat = item.category || 'other';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(item);
    }
    return groups;
  }, [activeItems]);

  const totalEstimated = useMemo(() => items.reduce((s, i) => s + (i.estimated_price || 0) * (i.quantity || 1), 0), [items]);
  const purchasedTotal = useMemo(() => purchasedItems.reduce((s, i) => s + (i.estimated_price || 0) * (i.quantity || 1), 0), [purchasedItems]);
  const budgetPct = budget > 0 ? Math.min((totalEstimated / budget) * 100, 100) : 0;
  const budgetColor = budgetPct > 90 ? '#DC2626' : budgetPct > 70 ? '#EA580C' : '#059669';

  const handleTogglePurchase = async (item: ShoppingItem) => {
    if (!item.is_purchased) { setConfirmItem(item); }
    else {
      await supabase.from('shopping_items').update({ is_purchased: false } as any).eq('id', item.id);
      setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, is_purchased: false } : i)));
    }
  };

  const confirmPurchase = async (addToInventory: boolean) => {
    if (!confirmItem || !user) return;
    await supabase.from('shopping_items').update({ is_purchased: true } as any).eq('id', confirmItem.id);
    setItems((prev) => prev.map((i) => (i.id === confirmItem.id ? { ...i, is_purchased: true } : i)));
    const itemTotal = (confirmItem.estimated_price || 0) * (confirmItem.quantity || 1);
    if (itemTotal > 0) {
      await supabase.from('savings_log').insert({
        user_id: user.id, type: 'purchase', amount: itemTotal, description: confirmItem.name,
      } as any);
    }
    if (addToInventory) {
      setConfirmItem(null);
      setStoragePickerItem(confirmItem);
    } else {
      toast.success(t.shopping.markedPurchased);
      setConfirmItem(null);
    }
  };

  const handleStorageSelect = async (location: string) => {
    if (!storagePickerItem || !user) return;
    await supabase.from('inventory_items').insert({
      user_id: user.id, name: storagePickerItem.name,
      quantity: storagePickerItem.quantity || 1, unit: storagePickerItem.unit || 'pcs',
      category: storagePickerItem.category, storage_location: location,
    } as any);
    toast.success(`${storagePickerItem.name} → ${location === 'fridge' ? '🧊' : location === 'freezer' ? '❄️' : '🏠'} ✓`);
    setStoragePickerItem(null);
  };

  const handleDelete = async (id: string) => {
    await supabase.from('shopping_items').delete().eq('id', id);
    setItems((prev) => prev.filter((i) => i.id !== id));
    toast.success(t.shopping.deleted);
  };

  const handleClearPurchased = async () => {
    const ids = purchasedItems.map((i) => i.id);
    if (!ids.length) return;
    await supabase.from('shopping_items').delete().in('id', ids);
    setItems((prev) => prev.filter((i) => !i.is_purchased));
    toast.success(t.shopping.clearedPurchased);
  };

  const openAdd = () => { setEditItem(null); setFormName(''); setFormQty('1'); setFormUnit('pcs'); setFormCategory('other'); setFormPrice(''); setModalOpen(true); };
  const openEdit = (item: ShoppingItem) => { setEditItem(item); setFormName(item.name); setFormQty(String(item.quantity || 1)); setFormUnit(item.unit || 'pcs'); setFormCategory(item.category || 'other'); setFormPrice(item.estimated_price ? String(item.estimated_price) : ''); setModalOpen(true); };

  const handleSave = async () => {
    if (!user || !formName.trim()) return;

    // Validate food item
    const isFood = await validateFood(formName.trim());
    if (!isFood) {
      setFormName('');
      return;
    }

    const payload = { user_id: user.id, name: formName.trim(), quantity: Number(formQty) || 1, unit: formUnit, category: formCategory, estimated_price: formPrice ? Number(formPrice) : null };
    if (editItem) {
      await supabase.from('shopping_items').update(payload as any).eq('id', editItem.id);
      setItems((prev) => prev.map((i) => (i.id === editItem.id ? { ...i, ...payload } : i)));
      toast.success(t.shopping.updated);
    } else {
      const { data } = await supabase.from('shopping_items').insert(payload as any).select().single();
      if (data) setItems((prev) => [data as unknown as ShoppingItem, ...prev]);
      toast.success(t.shopping.added);
    }
    setModalOpen(false);
  };

  const handleAddAllSuggestions = async () => {
    if (!user) return;
    const inserts = suggestions.map((s) => ({ user_id: user.id, name: s.name, quantity: 1, unit: s.unit || 'pcs', category: s.category || 'other' }));
    await supabase.from('shopping_items').insert(inserts as any);
    await fetchItems();
    setSuggestDismissed(true);
    toast.success(t.shopping.itemsAdded.replace('{count}', String(suggestions.length)));
  };

  const fadeUp = (i: number) => ({ initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.3, delay: i * 0.1 } });

  return (
    <div className="min-h-screen p-6 pb-mobile-safe">
      <motion.div {...fadeUp(0)} className="mb-5">
        <h1 className="text-2xl font-bold text-foreground">{t.shopping.title}</h1>
      </motion.div>

      <motion.div {...fadeUp(1)} className="flex flex-wrap items-center gap-2 mb-4">
        <button onClick={openAdd} className="flex items-center gap-1.5 px-4 h-10 rounded-xl text-sm font-medium text-white" style={{ backgroundColor: '#7C3AED' }}>
          <Plus className="w-4 h-4" /> {t.shopping.addItem}
        </button>
        <button onClick={() => setReceiptModalOpen(true)}
          className="flex items-center gap-1.5 px-3 h-10 rounded-xl text-sm font-medium border-[1.5px]"
          style={{ borderColor: '#DDD6FE', color: '#7C3AED', backgroundColor: '#F5F3FF' }}>
          🧾 {(t as any).receipt?.scanBtn || 'Scan receipt'}
        </button>
        <button onClick={handleVoiceInput}
          className="flex items-center gap-1.5 px-3 h-10 rounded-xl text-sm font-medium border-[1.5px] transition-all"
          style={{ borderColor: isListening ? '#7C3AED' : '#DDD6FE', backgroundColor: isListening ? '#EDE9FE' : 'transparent', color: isListening ? '#7C3AED' : '#6B7280' }}>
          🎤 {isListening ? t.shopping.listening : ''}
        </button>
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-medium whitespace-nowrap text-muted-foreground">{t.shopping.budget}</span>
          <div className="flex items-center gap-1">
            <span className="text-xs font-medium text-primary">{getCurrencySymbol(currency)}</span>
            <input type="number" value={budget || ''} onChange={(e) => setBudget(Number(e.target.value))} placeholder="0"
              className="w-20 h-10 px-2 rounded-xl border text-sm text-right outline-none focus:border-primary bg-secondary border-border" />
          </div>
        </div>
      </motion.div>

      {budget > 0 && (
        <motion.div {...fadeUp(2)} className="mb-5">
          <div className="flex justify-between text-xs mb-1">
            <span style={{ color: '#6B7280' }}>{t.shopping.estTotal} {formatMoney(totalEstimated, currency)}</span>
            <span style={{ color: budgetColor }} className="font-semibold">{budgetPct.toFixed(0)}{t.shopping.ofBudget}</span>
          </div>
          <div className="h-2 rounded-full" style={{ backgroundColor: '#F3F4F6' }}>
            <div className="h-full rounded-full transition-all duration-500" style={{ backgroundColor: budgetColor, width: `${budgetPct}%` }} />
          </div>
        </motion.div>
      )}

      {suggestions.length > 0 && !suggestDismissed && (
        <motion.div {...fadeUp(2)} className="mb-5 p-4 rounded-2xl flex items-center gap-3" style={{ backgroundColor: '#FEF3C7', border: '1px solid #FDE68A' }}>
          <AlertTriangle className="w-5 h-5 shrink-0" style={{ color: '#EA580C' }} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">{t.shopping.suggests.replace('{count}', String(suggestions.length))}</p>
            <p className="text-xs" style={{ color: '#6B7280' }}>{suggestions.slice(0, 3).map((s) => s.name).join(', ')}{suggestions.length > 3 ? '...' : ''}</p>
          </div>
          <button onClick={handleAddAllSuggestions} className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold text-white" style={{ backgroundColor: '#EA580C' }}>{t.shopping.addAll}</button>
          <button onClick={() => setSuggestDismissed(true)} className="shrink-0 p-1"><X className="w-4 h-4" style={{ color: '#9CA3AF' }} /></button>
        </motion.div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-7 h-7 border-[3px] rounded-full animate-spin" style={{ borderColor: '#EDE9FE', borderTopColor: '#7C3AED' }} />
        </div>
      ) : activeItems.length === 0 && purchasedItems.length === 0 ? (
        <motion.div {...fadeUp(3)} className="text-center py-16">
          <div className="text-5xl mb-4">🛒</div>
          <p className="text-base font-medium mb-1 text-foreground">{t.shopping.empty}</p>
          <p className="text-sm text-muted-foreground">{t.shopping.emptyHint}</p>
        </motion.div>
      ) : (
        <div className="space-y-4">
          {CATEGORIES.map((cat) => {
            const catItems = groupedActive[cat.id];
            if (!catItems || catItems.length === 0) return null;
            return (
              <motion.div key={cat.id} {...fadeUp(3)} style={cardStyle} className="p-4 bg-card">
                <h3 className="text-sm font-bold mb-3 flex items-center gap-1.5 text-foreground">
                  <span>{cat.emoji}</span> {cat.label}
                </h3>
                <div className="space-y-1">
                  <AnimatePresence>
                    {catItems.map((item) => (
                      <motion.div key={item.id} layout initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -60 }}
                        className="flex items-center gap-2 py-2 px-1 rounded-lg hover:bg-[#F5F3FF] transition-colors">
                        <button onClick={() => handleTogglePurchase(item)} className="w-5 h-5 rounded border-[1.5px] flex items-center justify-center shrink-0" style={{ borderColor: '#DDD6FE' }} />
                        <span className="flex-1 text-sm font-medium truncate text-foreground">{item.name}</span>
                        <span className="text-xs shrink-0" style={{ color: '#6B7280' }}>{item.quantity || 1} {(t.shopping as any).units?.[item.unit || 'pcs'] || item.unit || 'pcs'}</span>
                        {item.estimated_price && <span className="text-xs shrink-0" style={{ color: '#9CA3AF' }}>{formatMoney(item.estimated_price * (item.quantity || 1), currency)}</span>}
                        <button onClick={() => openEdit(item)} className="p-1.5 rounded-lg hover:bg-[#EDE9FE]"><Pencil className="w-3.5 h-3.5" style={{ color: '#7C3AED' }} /></button>
                        <button onClick={() => handleDelete(item.id)} className="p-1.5 rounded-lg hover:bg-red-50"><Trash2 className="w-3.5 h-3.5" style={{ color: '#DC2626' }} /></button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </motion.div>
            );
          })}

          {purchasedItems.length > 0 && (
            <motion.div {...fadeUp(4)} style={cardStyle} className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold flex items-center gap-1.5" style={{ color: '#059669' }}>
                  <Check className="w-4 h-4" /> {t.shopping.purchased} ({purchasedItems.length})
                </h3>
                <button onClick={handleClearPurchased} className="text-xs font-medium px-3 py-1 rounded-lg" style={{ color: '#DC2626', backgroundColor: '#FEE2E2' }}>
                  {t.shopping.clearPurchased}
                </button>
              </div>
              <div className="space-y-1">
                {purchasedItems.map((item) => (
                  <div key={item.id} className="flex items-center gap-2 py-2 px-1 rounded-lg">
                    <button onClick={() => handleTogglePurchase(item)} className="w-5 h-5 rounded flex items-center justify-center shrink-0" style={{ backgroundColor: '#059669' }}>
                      <Check className="w-3 h-3 text-white" />
                    </button>
                    <span className="flex-1 text-sm line-through truncate" style={{ color: '#9CA3AF' }}>{item.name}</span>
                    <span className="text-xs shrink-0" style={{ color: '#D1D5DB' }}>{item.quantity || 1} {(t.shopping as any).units?.[item.unit || 'pcs'] || item.unit || 'pcs'}</span>
                  </div>
                ))}
              </div>
              {purchasedTotal > 0 && <p className="text-xs mt-3 font-medium" style={{ color: '#059669' }}>{t.shopping.spent} {formatMoney(purchasedTotal, currency)}</p>}
            </motion.div>
          )}
        </div>
      )}

      {/* Store Deals Coming Soon */}
      <motion.div {...fadeUp(5)} className="mt-4">
        <StoreDealsCard />
      </motion.div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="rounded-2xl max-w-sm">
          <DialogHeader>
            <DialogTitle style={{ color: '#1E1B4B' }}>{editItem ? t.shopping.editItem : t.shopping.addItemTitle}</DialogTitle>
            <DialogDescription>{editItem ? t.shopping.editDesc : t.shopping.addDesc}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <div>
              <label className="text-xs font-medium mb-1 block" style={{ color: '#6B7280' }}>{t.shopping.name}</label>
              <input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder={t.shopping.namePlaceholder}
                className="w-full h-10 px-3 rounded-xl border text-sm outline-none focus:border-[#7C3AED]" style={{ borderColor: '#DDD6FE', backgroundColor: '#F5F3FF' }} />
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="text-xs font-medium mb-1 block" style={{ color: '#6B7280' }}>{t.shopping.qty}</label>
                <input type="number" value={formQty} onChange={(e) => setFormQty(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border text-sm outline-none focus:border-[#7C3AED]" style={{ borderColor: '#DDD6FE', backgroundColor: '#F5F3FF' }} />
              </div>
              <div className="flex-1">
                <label className="text-xs font-medium mb-1 block" style={{ color: '#6B7280' }}>{t.shopping.unit}</label>
                <select value={formUnit} onChange={(e) => setFormUnit(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border text-sm outline-none focus:border-[#7C3AED] appearance-none" style={{ borderColor: '#DDD6FE', backgroundColor: '#F5F3FF' }}>
                  {getUnits(language).map((u) => <option key={u.value} value={u.value}>{u.label}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block" style={{ color: '#6B7280' }}>{t.shopping.category}</label>
              <div className="flex flex-wrap gap-1.5">
                {CATEGORIES.map((c) => (
                  <button key={c.id} onClick={() => setFormCategory(c.id)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium border-[1.5px] transition-all"
                    style={{ borderColor: formCategory === c.id ? '#7C3AED' : '#DDD6FE', backgroundColor: formCategory === c.id ? '#EDE9FE' : 'white', color: formCategory === c.id ? '#7C3AED' : '#6B7280' }}>
                    {c.emoji} {c.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block" style={{ color: '#6B7280' }}>{t.shopping.estPrice}</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium" style={{ color: '#7C3AED' }}>{getCurrencySymbol(currency)}</span>
                <input type="number" step="0.01" value={formPrice} onChange={(e) => setFormPrice(e.target.value)} placeholder="0.00"
                  className="w-full h-10 pl-8 pr-3 rounded-xl border text-sm outline-none focus:border-[#7C3AED]" style={{ borderColor: '#DDD6FE', backgroundColor: '#F5F3FF' }} />
              </div>
            </div>
            <button onClick={handleSave} disabled={!formName.trim()} className="w-full h-11 rounded-xl text-sm font-semibold text-white disabled:opacity-50" style={{ backgroundColor: '#7C3AED' }}>
              {editItem ? t.shopping.update : t.shopping.addToList}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!confirmItem} onOpenChange={() => setConfirmItem(null)}>
        <DialogContent className="rounded-2xl max-w-xs text-center">
          <DialogHeader>
            <DialogTitle style={{ color: '#1E1B4B' }}>{t.shopping.addToInventory}</DialogTitle>
            <DialogDescription>{t.shopping.addToInventoryDesc.replace('{name}', confirmItem?.name || '')}</DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 mt-3">
            <button onClick={() => confirmPurchase(true)} className="flex-1 h-10 rounded-xl text-sm font-semibold text-white" style={{ backgroundColor: '#059669' }}>
              <PackagePlus className="w-4 h-4 inline mr-1" /> {t.shopping.yes}
            </button>
            <button onClick={() => confirmPurchase(false)} className="flex-1 h-10 rounded-xl text-sm font-semibold border-[1.5px]" style={{ borderColor: '#DDD6FE', color: '#6B7280' }}>
              {t.shopping.no}
            </button>
          </div>
        </DialogContent>
      </Dialog>
      <StoragePickerModal
        open={!!storagePickerItem}
        onClose={() => setStoragePickerItem(null)}
        itemName={storagePickerItem?.name || ''}
        onSelect={handleStorageSelect}
      />
      <ReceiptScanModal
        open={receiptModalOpen}
        onClose={() => setReceiptModalOpen(false)}
        onSaved={fetchItems}
      />
    </div>
  );
};

export default Shopping;
