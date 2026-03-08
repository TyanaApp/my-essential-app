import { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { X, Check, Plus, Trash2, Minus, ChevronDown } from 'lucide-react';
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
  receiptTotal: number;
  foodTotal: number;
  nonFoodTotal: number;
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

const UNIT_OPTIONS = ['pcs', 'kg', 'g', 'L', 'ml', 'pack'];

const ReceiptScanModal = ({ open, onClose, onSaved }: Props) => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const { language } = useLanguage();
  const receipt = (t as any).receipt || {};
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<'upload' | 'scanning' | 'results' | 'error' | 'manual' | 'no-food'>('upload');
  const [photo, setPhoto] = useState<string | null>(null);
  const [data, setData] = useState<ReceiptData | null>(null);
  const [saving, setSaving] = useState(false);
  const [nonFoodExpanded, setNonFoodExpanded] = useState(false);

  const reset = () => {
    setStep('upload');
    setPhoto(null);
    setData(null);
    setNonFoodExpanded(false);
  };

  const handleClose = () => { reset(); onClose(); };

  const initManualEntry = () => {
    setData({
      store: '',
      receiptTotal: 0,
      foodTotal: 0,
      nonFoodTotal: 0,
      currency: 'EUR',
      date: new Date().toISOString().split('T')[0],
      items: [],
    });
    setStep('manual');
  };

  const recalcTotals = (items: ReceiptItem[]) => {
    const foodTotal = items.filter(i => i.isFood).reduce((s, i) => s + i.price * i.quantity, 0);
    const nonFoodTotal = items.filter(i => !i.isFood).reduce((s, i) => s + i.price * i.quantity, 0);
    return { foodTotal, nonFoodTotal, receiptTotal: foodTotal + nonFoodTotal };
  };

  const handleFile = useCallback((file: File) => {
    const isImage = file.type.startsWith('image/');
    const isPdf = file.type === 'application/pdf';
    if (!isImage && !isPdf) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target?.result as string;
      setPhoto(dataUrl);
      const base64 = dataUrl.split(',')[1];
      setStep('scanning');

      try {
        const { data: result, error } = await supabase.functions.invoke('scan-receipt', {
          body: {
            imageBase64: base64,
            language,
            fileType: isPdf ? 'pdf' : 'image',
          },
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

        if (items.length === 0) {
          setStep('error');
          return;
        }

        const hasFood = items.some(i => i.isFood);
        const totals = recalcTotals(items);

        setData({
          store: result.store || '',
          receiptTotal: Number(result.receiptTotal) || totals.receiptTotal,
          foodTotal: Number(result.foodTotal) || totals.foodTotal,
          nonFoodTotal: Number(result.nonFoodTotal) || totals.nonFoodTotal,
          currency: result.currency || 'EUR',
          date: result.date || new Date().toISOString().split('T')[0],
          items,
        });

        setStep(hasFood ? 'results' : 'no-food');
      } catch (err) {
        console.error('Receipt scan error:', err);
        setStep('error');
      }
    };
    reader.readAsDataURL(file);
  }, [language]);

  const foodItems = data?.items.filter(i => i.isFood) || [];
  const otherItems = data?.items.filter(i => !i.isFood) || [];
  const foodTotal = foodItems.reduce((s, i) => s + i.price * i.quantity, 0);
  const nonFoodTotal = otherItems.reduce((s, i) => s + i.price * i.quantity, 0);
  const checkedFood = foodItems.filter(i => i.checked);

  const toggleItem = (idx: number) => {
    if (!data) return;
    const newItems = [...data.items];
    newItems[idx] = { ...newItems[idx], checked: !newItems[idx].checked };
    setData({ ...data, items: newItems });
  };

  const updateItemField = (idx: number, field: keyof ReceiptItem, value: any) => {
    if (!data) return;
    const newItems = [...data.items];
    newItems[idx] = { ...newItems[idx], [field]: value };
    const totals = recalcTotals(newItems);
    setData({ ...data, items: newItems, ...totals });
  };

  const deleteItem = (idx: number) => {
    if (!data) return;
    const newItems = data.items.filter((_, i) => i !== idx);
    const totals = recalcTotals(newItems);
    setData({ ...data, items: newItems, ...totals });
  };

  const addEmptyItem = (isFood: boolean) => {
    if (!data) return;
    const newItem: ReceiptItem = {
      name: '',
      quantity: 1,
      unit: 'pcs',
      price: 0,
      isFood,
      suggestedStorage: isFood ? 'fridge' : null,
      checked: isFood,
    };
    setData({ ...data, items: [...data.items, newItem] });
  };

  const handleSave = async () => {
    if (!user || !data) return;
    const toSave = data.items.filter(i => i.isFood && i.checked && i.name.trim());
    if (toSave.length === 0 && data.items.length === 0) return;

    setSaving(true);
    try {
      // Save food items to inventory
      if (toSave.length > 0) {
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
      }

      // Save receipt to receipts table
      await supabase.from('receipts' as any).insert({
        user_id: user.id,
        store_name: data.store || null,
        total_amount: data.receiptTotal,
        currency: data.currency || 'EUR',
        receipt_date: data.date || new Date().toISOString().split('T')[0],
        items: data.items.map(i => ({
          name: i.name,
          quantity: i.quantity,
          unit: i.unit,
          price: i.price,
          isFood: i.isFood,
          storage: i.suggestedStorage,
          addedToInventory: i.isFood && i.checked,
        })),
      });

      // Save FOOD spending only to savings_log
      if (foodTotal > 0) {
        await supabase.from('savings_log').insert({
          user_id: user.id,
          type: 'purchase',
          amount: foodTotal,
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
  const isResultsOrManual = step === 'results' || step === 'manual';

  const renderItemRow = (item: ReceiptItem, globalIdx: number, isFood: boolean) => (
    <div key={globalIdx} className="p-2.5 rounded-xl bg-accent/50 space-y-1.5">
      <div className="flex items-center gap-2">
        {isFood && (
          <button onClick={() => toggleItem(globalIdx)}
            className="w-5 h-5 rounded border-[1.5px] flex items-center justify-center shrink-0"
            style={{ borderColor: item.checked ? 'hsl(var(--primary))' : 'hsl(var(--border))', backgroundColor: item.checked ? 'hsl(var(--primary))' : 'transparent' }}>
            {item.checked && <Check className="w-3 h-3 text-white" />}
          </button>
        )}
        <input value={item.name} onChange={e => updateItemField(globalIdx, 'name', e.target.value)}
          placeholder={receipt.itemName || 'Item name'}
          className="flex-1 min-w-0 text-sm font-medium bg-background rounded-lg px-2 py-1.5 border border-border outline-none focus:border-primary text-foreground" />
        <button onClick={() => deleteItem(globalIdx)} className="p-1 rounded hover:bg-destructive/10">
          <Trash2 className="w-3.5 h-3.5 text-destructive" />
        </button>
      </div>
      <div className="flex items-center gap-1.5 flex-wrap">
        <div className="flex items-center gap-0.5 bg-background rounded-lg border border-border">
          <button onClick={() => updateItemField(globalIdx, 'quantity', Math.max(0.5, item.quantity - 1))}
            className="w-6 h-7 flex items-center justify-center text-muted-foreground hover:text-foreground">
            <Minus className="w-3 h-3" />
          </button>
          <input type="number" value={item.quantity} onChange={e => updateItemField(globalIdx, 'quantity', Number(e.target.value) || 1)}
            className="w-10 h-7 text-center text-xs bg-transparent outline-none text-foreground" />
          <button onClick={() => updateItemField(globalIdx, 'quantity', item.quantity + 1)}
            className="w-6 h-7 flex items-center justify-center text-muted-foreground hover:text-foreground">
            <Plus className="w-3 h-3" />
          </button>
        </div>
        <select value={item.unit} onChange={e => updateItemField(globalIdx, 'unit', e.target.value)}
          className="h-7 px-1.5 rounded-lg border border-border text-xs bg-background text-foreground outline-none">
          {UNIT_OPTIONS.map(u => <option key={u} value={u}>{u}</option>)}
        </select>
        <div className="flex items-center gap-0.5 bg-background rounded-lg border border-border px-1.5">
          <span className="text-xs text-muted-foreground">{getCurrencySymbol(cur)}</span>
          <input type="number" step="0.01" value={item.price} onChange={e => updateItemField(globalIdx, 'price', Number(e.target.value) || 0)}
            className="w-14 h-7 text-xs bg-transparent outline-none text-foreground text-right" />
        </div>
        {isFood && (
          <div className="flex gap-0.5 ml-auto">
            {STORAGE_OPTIONS.map(s => (
              <button key={s.id} onClick={() => updateItemField(globalIdx, 'suggestedStorage', s.id)}
                className="w-7 h-7 rounded-lg text-xs flex items-center justify-center border-[1.5px]"
                style={{
                  backgroundColor: item.suggestedStorage === s.id ? 'hsl(var(--accent))' : 'transparent',
                  borderColor: item.suggestedStorage === s.id ? 'hsl(var(--primary))' : 'transparent',
                }}>
                {s.emoji}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg flex flex-col"
        style={{ boxShadow: '0 -4px 40px rgba(0,0,0,0.15)', maxHeight: '90vh' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-bold text-foreground">
            {step === 'upload' ? (receipt.title || '🧾 Scan Receipt') :
             step === 'scanning' ? (receipt.analyzing || '🤖 Analyzing...') :
             step === 'error' ? '😔' :
             step === 'no-food' ? '🤔' :
             step === 'manual' ? `✏️ ${receipt.manualEntry || 'Manual Entry'}` :
             `🧾 ${data?.store || ''} ${data?.date ? `• ${data.date}` : ''}`}
          </h2>
          <button onClick={handleClose} className="p-1 rounded-lg hover:bg-accent">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {/* UPLOAD */}
          {step === 'upload' && (
            <div className="py-4">
              <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
              <input ref={galleryRef} type="file" accept="image/*" className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
              <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
              <div className="space-y-2.5">
                {/* Take photo */}
                <button onClick={() => cameraRef.current?.click()}
                  className="w-full flex items-center gap-3 p-4 rounded-2xl border-2 border-border hover:border-primary transition-colors text-left bg-accent/30">
                  <span className="text-3xl">📸</span>
                  <div>
                    <p className="text-sm font-bold text-foreground">{receipt.takePhoto || 'Take photo'}</p>
                    <p className="text-xs text-muted-foreground">{receipt.takePhotoHint || 'Take a photo of a paper receipt'}</p>
                  </div>
                </button>
                {/* Choose from gallery */}
                <button onClick={() => galleryRef.current?.click()}
                  className="w-full flex items-center gap-3 p-4 rounded-2xl border-2 border-border hover:border-primary transition-colors text-left bg-accent/30">
                  <span className="text-3xl">🖼</span>
                  <div>
                    <p className="text-sm font-bold text-foreground">{receipt.choosePhoto || 'Choose from gallery'}</p>
                    <p className="text-xs text-muted-foreground">{receipt.choosePhotoHint || 'Upload a photo from gallery'}</p>
                  </div>
                </button>
                {/* Upload file */}
                <button onClick={() => fileRef.current?.click()}
                  className="w-full flex items-center gap-3 p-4 rounded-2xl border-2 border-border hover:border-primary transition-colors text-left bg-accent/30">
                  <span className="text-3xl">📄</span>
                  <div>
                    <p className="text-sm font-bold text-foreground">{receipt.uploadFile || 'Upload file'}</p>
                    <p className="text-xs text-muted-foreground">{receipt.uploadFileHint || 'PDF or digital receipt'}</p>
                  </div>
                </button>
              </div>
              <button onClick={initManualEntry}
                className="w-full mt-3 text-sm font-medium text-primary text-center">
                ✏️ {receipt.manualEntry || 'Enter manually'}
              </button>
            </div>
          )}

          {/* SCANNING */}
          {step === 'scanning' && (
            <div className="py-8 text-center">
              <div className="w-16 h-16 mx-auto rounded-full flex items-center justify-center animate-pulse mb-4 bg-accent">
                <span className="text-3xl">🤖</span>
              </div>
              <div className="space-y-3 mb-6">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex items-center gap-3 px-4">
                    <div className="w-10 h-10 rounded-lg animate-pulse bg-accent" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 rounded-full animate-pulse bg-accent" style={{ width: `${80 - i * 10}%` }} />
                      <div className="h-2 rounded-full animate-pulse bg-secondary" style={{ width: `${50 + i * 5}%` }} />
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-sm text-muted-foreground">{receipt.analyzingHint || 'Reading your receipt... ~10 seconds'}</p>
            </div>
          )}

          {/* ERROR */}
          {step === 'error' && (
            <div className="text-center py-8">
              <div className="text-5xl mb-4">😔</div>
              <p className="text-sm mb-6 text-muted-foreground">
                {receipt.scanFailedLong || 'Could not read the receipt. Try taking a clearer photo with good lighting.'}
              </p>
              <div className="flex flex-col gap-2 items-center">
                <button onClick={() => { setStep('upload'); setPhoto(null); }}
                  className="px-5 h-10 rounded-xl text-white font-medium text-sm bg-primary">
                  📸 {receipt.tryAgain || 'Try again'}
                </button>
                <button onClick={initManualEntry}
                  className="text-sm font-medium text-primary">
                  ✏️ {receipt.manualEntry || 'Enter manually'}
                </button>
              </div>
            </div>
          )}

          {/* NO FOOD ITEMS */}
          {step === 'no-food' && (
            <div className="text-center py-8">
              <div className="text-5xl mb-4">🤔</div>
              <p className="text-sm mb-6 text-muted-foreground">
                {receipt.noFoodInReceipt || 'No food items found in this receipt. Only household items.'}
              </p>
              <button onClick={handleClose}
                className="px-6 h-10 rounded-xl font-medium text-sm bg-secondary text-secondary-foreground">
                {t.common.close || 'Close'}
              </button>
            </div>
          )}

          {/* RESULTS / MANUAL */}
          {isResultsOrManual && data && (
            <div>
              {/* Store & date for manual */}
              {step === 'manual' && (
                <div className="flex gap-2 mb-3">
                  <input
                    value={data.store}
                    onChange={e => setData({ ...data, store: e.target.value })}
                    placeholder={receipt.storeName || 'Store name'}
                    className="flex-1 h-9 px-3 rounded-xl border border-border text-sm bg-background text-foreground outline-none focus:border-primary"
                  />
                  <input
                    type="date"
                    value={data.date}
                    onChange={e => setData({ ...data, date: e.target.value })}
                    className="w-36 h-9 px-2 rounded-xl border border-border text-sm bg-background text-foreground outline-none focus:border-primary"
                  />
                </div>
              )}

              {/* Header totals card */}
              <div className="p-3 rounded-xl mb-3 bg-accent/50 space-y-1">
                <p className="text-sm font-bold text-foreground">
                  {receipt.receiptTotalLabel || 'Receipt total'}: {formatMoney(data.receiptTotal || (foodTotal + nonFoodTotal), cur)}
                </p>
                <div className="flex items-center gap-1 text-xs">
                  <span style={{ color: '#059669' }}>🥗 {receipt.forFood || 'Food'}: {formatMoney(foodTotal, cur)}</span>
                  <span className="text-muted-foreground mx-1">•</span>
                  <span className="text-muted-foreground">🧴 {receipt.otherLabel || 'Other'}: {formatMoney(nonFoodTotal, cur)}</span>
                </div>
                <p className="text-[10px] text-muted-foreground">{receipt.onlyFoodCounted || 'Only food spending counts toward your budget'}</p>
              </div>

              {/* FOOD SECTION */}
              <div className="mb-3">
                <div className="flex items-center gap-2 mb-2 px-1">
                  <span className="text-sm font-bold text-primary">🥗 {receipt.foodItems || 'Food'}</span>
                  <span className="text-xs font-medium text-primary">— {formatMoney(foodTotal, cur)}</span>
                </div>
                <div className="space-y-2 max-h-[30vh] overflow-y-auto pr-1">
                  {foodItems.map((item) => {
                    const globalIdx = data.items.indexOf(item);
                    return renderItemRow(item, globalIdx, true);
                  })}
                </div>
                <button onClick={() => addEmptyItem(true)}
                  className="w-full mt-2 py-2 rounded-xl border-2 border-dashed border-border text-sm font-medium flex items-center justify-center gap-1.5 text-muted-foreground hover:text-primary hover:border-primary transition-colors">
                  <Plus className="w-4 h-4" /> {receipt.addManually || 'Add manually'}
                </button>
              </div>

              {/* NON-FOOD SECTION (collapsed) */}
              {otherItems.length > 0 && (
                <div className="mb-3">
                  <button onClick={() => setNonFoodExpanded(!nonFoodExpanded)}
                    className="w-full flex items-center justify-between px-1 py-1.5 text-left">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-muted-foreground">🧴 {receipt.otherItems || 'Other'}</span>
                      <span className="text-xs text-muted-foreground">— {formatMoney(nonFoodTotal, cur)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-muted-foreground">{receipt.notCountedInBudget || 'not in budget'}</span>
                      <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${nonFoodExpanded ? 'rotate-180' : ''}`} />
                    </div>
                  </button>
                  {nonFoodExpanded && (
                    <div className="space-y-2 mt-1">
                      {otherItems.map((item) => {
                        const globalIdx = data.items.indexOf(item);
                        return renderItemRow(item, globalIdx, false);
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Summary */}
              <div className="p-3 rounded-xl space-y-1 bg-accent/50">
                <div className="flex justify-between text-xs">
                  <span style={{ color: '#059669' }}>🥗 {receipt.foodItemsLabel || 'Food items'}: {checkedFood.length}/{foodItems.length}</span>
                  <span className="font-medium text-foreground">{formatMoney(foodTotal, cur)}</span>
                </div>
                {otherItems.length > 0 && (
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">🧴 {receipt.otherItemsLabel || 'Other items'}: {otherItems.length}</span>
                    <span className="font-medium text-muted-foreground">{formatMoney(nonFoodTotal, cur)}</span>
                  </div>
                )}
                <div className="border-t border-border pt-1 flex justify-between text-sm font-bold">
                  <span className="text-foreground">{receipt.goesToBudget || 'Goes to food budget'}</span>
                  <span style={{ color: '#059669' }}>{formatMoney(foodTotal, cur)}</span>
                </div>
              </div>

              {/* Action buttons */}
              <button onClick={handleSave} disabled={saving || checkedFood.length === 0}
                className="w-full mt-3 h-12 rounded-xl text-white font-semibold text-sm transition-opacity disabled:opacity-40 bg-primary">
                {saving ? (t.common.loading) : `✓ ${(receipt.addToInventory || 'Add food to inventory')} (${checkedFood.length})`}
              </button>
              <button onClick={handleClose} className="w-full mt-2 text-sm font-medium text-muted-foreground">
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
