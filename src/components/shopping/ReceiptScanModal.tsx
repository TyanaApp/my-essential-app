import { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { X, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useTranslation } from '@/hooks/useTranslation';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatMoney, getCurrencySymbol } from '@/lib/formatMoney';

interface ReceiptItem {
  name: string;
  quantity: number;
  unit: string;
  price: number;
  isFood: boolean;
  suggestedStorage: string | null;
  checked: boolean;
}

interface ReceiptData {
  store: string;
  total: number;
  currency: string;
  date: string;
  items: ReceiptItem[];
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

const STORAGE_OPTIONS = [
  { id: 'fridge', emoji: '🧊' },
  { id: 'pantry', emoji: '🏠' },
  { id: 'freezer', emoji: '❄️' },
];

const ReceiptScanModal = ({ open, onClose, onSaved }: Props) => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const { language } = useLanguage();
  const receipt = (t as any).receipt || {};
  const fileRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<'upload' | 'scanning' | 'results'>('upload');
  const [photo, setPhoto] = useState<string | null>(null);
  const [data, setData] = useState<ReceiptData | null>(null);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<'food' | 'other'>('food');

  const reset = () => {
    setStep('upload');
    setPhoto(null);
    setData(null);
    setTab('food');
  };

  const handleClose = () => { reset(); onClose(); };

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target?.result as string;
      setPhoto(dataUrl);
      const base64 = dataUrl.split(',')[1];
      setStep('scanning');

      try {
        const { data: result, error } = await supabase.functions.invoke('scan-receipt', {
          body: { imageBase64: base64, language },
        });
        if (error) throw error;
        if (result?.error) throw new Error('Scan failed');

        const items: ReceiptItem[] = (result.items || []).map((i: any) => ({
          name: String(i.name || ''),
          quantity: Number(i.quantity) || 1,
          unit: i.unit || 'pcs',
          price: Number(i.price) || 0,
          isFood: Boolean(i.isFood),
          suggestedStorage: i.suggestedStorage || (i.isFood ? 'fridge' : null),
          checked: Boolean(i.isFood),
        }));

        setData({
          store: result.store || '',
          total: Number(result.total) || 0,
          currency: result.currency || 'EUR',
          date: result.date || new Date().toISOString().split('T')[0],
          items,
        });
        setStep('results');
      } catch (err) {
        console.error('Receipt scan error:', err);
        toast.error(receipt.scanFailed || 'Scan failed');
        setStep('upload');
      }
    };
    reader.readAsDataURL(file);
  }, [language, receipt]);

  const foodItems = data?.items.filter(i => i.isFood) || [];
  const otherItems = data?.items.filter(i => !i.isFood) || [];
  const foodTotal = foodItems.reduce((s, i) => s + i.price * i.quantity, 0);
  const otherTotal = otherItems.reduce((s, i) => s + i.price * i.quantity, 0);
  const checkedFood = foodItems.filter(i => i.checked);

  const toggleItem = (idx: number) => {
    if (!data) return;
    const newItems = [...data.items];
    newItems[idx] = { ...newItems[idx], checked: !newItems[idx].checked };
    setData({ ...data, items: newItems });
  };

  const updateStorage = (idx: number, storage: string) => {
    if (!data) return;
    const newItems = [...data.items];
    newItems[idx] = { ...newItems[idx], suggestedStorage: storage };
    setData({ ...data, items: newItems });
  };

  const updateName = (idx: number, name: string) => {
    if (!data) return;
    const newItems = [...data.items];
    newItems[idx] = { ...newItems[idx], name };
    setData({ ...data, items: newItems });
  };

  const handleSave = async () => {
    if (!user || !data) return;
    const toSave = data.items.filter(i => i.isFood && i.checked && i.name.trim());
    if (toSave.length === 0) return;

    setSaving(true);
    try {
      // Save food items to inventory
      const inserts = toSave.map(i => ({
        user_id: user.id,
        name: i.name.trim(),
        quantity: i.quantity,
        unit: i.unit,
        storage_location: i.suggestedStorage || 'fridge',
        price_per_unit: i.price,
        category: 'other',
      }));
      const { error } = await supabase.from('inventory_items').insert(inserts as any);
      if (error) throw error;

      // Save total spending to savings_log
      const totalSpent = data.total || (foodTotal + otherTotal);
      if (totalSpent > 0) {
        await supabase.from('savings_log').insert({
          user_id: user.id,
          type: 'purchase',
          amount: totalSpent,
          description: `🧾 ${data.store || receipt.receipt || 'Receipt'} ${data.date}`,
        } as any);
      }

      toast.success((receipt.itemsAddedToInventory || '{count} items added').replace('{count}', String(toSave.length)));
      onSaved();
      handleClose();
    } catch (err) {
      console.error('Save receipt error:', err);
      toast.error(receipt.saveFailed || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  const cur = data?.currency || 'EUR';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: '#EDE9FE' }}>
          <h2 className="text-lg font-bold" style={{ color: '#1E1B4B' }}>
            {step === 'upload' ? (receipt.title || '🧾 Scan Receipt') :
             step === 'scanning' ? (receipt.analyzing || '🤖 Analyzing...') :
             `🧾 ${data?.store || ''} ${data?.date ? `• ${data.date}` : ''}`}
          </h2>
          <button onClick={handleClose} className="p-1 rounded-lg hover:bg-gray-100">
            <X className="w-5 h-5" style={{ color: '#6B7280' }} />
          </button>
        </div>

        <div className="p-4">
          {/* UPLOAD */}
          {step === 'upload' && (
            <div className="text-center py-8">
              <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
              <div className="text-6xl mb-4">🧾</div>
              <p className="text-sm mb-4" style={{ color: '#6B7280' }}>{receipt.hint || 'Take a photo of your receipt'}</p>
              <button onClick={() => fileRef.current?.click()}
                className="px-6 h-12 rounded-2xl text-white font-semibold text-sm"
                style={{ backgroundColor: '#7C3AED' }}>
                📷 {receipt.takePhoto || 'Take Photo'}
              </button>
            </div>
          )}

          {/* SCANNING */}
          {step === 'scanning' && (
            <div className="py-8 text-center">
              <div className="w-16 h-16 mx-auto rounded-full flex items-center justify-center animate-pulse mb-4" style={{ backgroundColor: '#EDE9FE' }}>
                <span className="text-3xl">🤖</span>
              </div>
              <div className="space-y-3 mb-6">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex items-center gap-3 px-4">
                    <div className="w-10 h-10 rounded-lg animate-pulse" style={{ backgroundColor: '#EDE9FE' }} />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 rounded-full animate-pulse" style={{ backgroundColor: '#EDE9FE', width: `${80 - i * 10}%` }} />
                      <div className="h-2 rounded-full animate-pulse" style={{ backgroundColor: '#F5F3FF', width: `${50 + i * 5}%` }} />
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-sm" style={{ color: '#6B7280' }}>{receipt.analyzingHint || 'Reading your receipt... ~10 seconds'}</p>
            </div>
          )}

          {/* RESULTS */}
          {step === 'results' && data && (
            <div>
              {/* Total header */}
              {data.total > 0 && (
                <p className="text-sm font-medium mb-3" style={{ color: '#6B7280' }}>
                  {receipt.totalLabel || 'Total'}: {formatMoney(data.total, cur)}
                </p>
              )}

              {/* Tabs */}
              <div className="flex gap-2 mb-3">
                <button onClick={() => setTab('food')}
                  className="flex-1 py-2 rounded-xl text-sm font-medium transition-all"
                  style={{ backgroundColor: tab === 'food' ? '#7C3AED' : '#F5F3FF', color: tab === 'food' ? 'white' : '#7C3AED' }}>
                  🥗 {receipt.foodItems || 'Food'} ({foodItems.length})
                </button>
                <button onClick={() => setTab('other')}
                  className="flex-1 py-2 rounded-xl text-sm font-medium transition-all"
                  style={{ backgroundColor: tab === 'other' ? '#7C3AED' : '#F5F3FF', color: tab === 'other' ? 'white' : '#7C3AED' }}>
                  🧴 {receipt.otherItems || 'Other'} ({otherItems.length})
                </button>
              </div>

              {/* Items list */}
              <div className="space-y-1.5 max-h-[40vh] overflow-y-auto pr-1">
                {(tab === 'food' ? foodItems : otherItems).map((item) => {
                  const globalIdx = data.items.indexOf(item);
                  return (
                    <div key={globalIdx} className="flex items-center gap-2 p-2 rounded-xl" style={{ backgroundColor: '#F5F3FF' }}>
                      {tab === 'food' && (
                        <button onClick={() => toggleItem(globalIdx)}
                          className="w-5 h-5 rounded border-[1.5px] flex items-center justify-center shrink-0"
                          style={{ borderColor: item.checked ? '#7C3AED' : '#DDD6FE', backgroundColor: item.checked ? '#7C3AED' : 'transparent' }}>
                          {item.checked && <Check className="w-3 h-3 text-white" />}
                        </button>
                      )}
                      <input value={item.name} onChange={e => updateName(globalIdx, e.target.value)}
                        className="flex-1 min-w-0 text-sm font-medium bg-white rounded-lg px-2 py-1.5 border outline-none focus:border-[#7C3AED]"
                        style={{ borderColor: '#DDD6FE', color: '#1E1B4B' }} />
                      <span className="text-xs shrink-0" style={{ color: '#6B7280' }}>{item.quantity} {item.unit}</span>
                      <span className="text-xs font-medium shrink-0" style={{ color: '#7C3AED' }}>{formatMoney(item.price, cur)}</span>
                      {tab === 'food' && item.suggestedStorage && (
                        <div className="flex gap-0.5">
                          {STORAGE_OPTIONS.map(s => (
                            <button key={s.id} onClick={() => updateStorage(globalIdx, s.id)}
                              className="w-7 h-7 rounded-lg text-xs flex items-center justify-center"
                              style={{ backgroundColor: item.suggestedStorage === s.id ? '#EDE9FE' : 'transparent', border: item.suggestedStorage === s.id ? '1.5px solid #7C3AED' : '1.5px solid transparent' }}>
                              {s.emoji}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Summary */}
              <div className="mt-4 p-3 rounded-xl space-y-1" style={{ backgroundColor: '#F5F3FF' }}>
                <div className="flex justify-between text-xs">
                  <span style={{ color: '#6B7280' }}>{receipt.foodItemsLabel || 'Food items'}: {foodItems.length}</span>
                  <span className="font-medium" style={{ color: '#1E1B4B' }}>{formatMoney(foodTotal, cur)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span style={{ color: '#6B7280' }}>{receipt.otherItemsLabel || 'Other items'}: {otherItems.length}</span>
                  <span className="font-medium" style={{ color: '#1E1B4B' }}>{formatMoney(otherTotal, cur)}</span>
                </div>
                <div className="border-t pt-1 flex justify-between text-sm font-bold" style={{ borderColor: '#DDD6FE' }}>
                  <span style={{ color: '#1E1B4B' }}>{receipt.totalSpent || 'Total spent'}</span>
                  <span style={{ color: '#7C3AED' }}>{formatMoney(data.total || (foodTotal + otherTotal), cur)}</span>
                </div>
              </div>

              {/* Action buttons */}
              <button onClick={handleSave} disabled={saving || checkedFood.length === 0}
                className="w-full mt-3 h-12 rounded-xl text-white font-semibold text-sm transition-opacity disabled:opacity-40"
                style={{ backgroundColor: '#7C3AED' }}>
                {saving ? (t.common.loading) : `✓ ${(receipt.addToInventory || 'Add food to inventory')} (${checkedFood.length})`}
              </button>
              <button onClick={handleClose} className="w-full mt-2 text-sm font-medium" style={{ color: '#6B7280' }}>
                {t.common.cancel}
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default ReceiptScanModal;
