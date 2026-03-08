import { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { X, Plus, Minus, ChevronDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useTranslation } from '@/hooks/useTranslation';
import { useNavigate } from 'react-router-dom';
import { getUnits } from '@/lib/units';

interface ScannedItem {
  name: string;
  quantity: number;
  unit: string;
  category: string;
  storage_location: string;
  unknown?: boolean;
}
const STORAGE_OPTIONS: Record<string, { id: string; emoji: string; labels: Record<string, string> }[]> = {
  default: [
    { id: 'fridge', emoji: '🧊', labels: { en: 'Fridge', ru: 'Холодильник', uk: 'Холодильник', lv: 'Ledusskapis' } },
    { id: 'pantry', emoji: '🏠', labels: { en: 'Pantry', ru: 'Кладовая', uk: 'Комора', lv: 'Pieliekamais' } },
    { id: 'freezer', emoji: '❄️', labels: { en: 'Freezer', ru: 'Морозилка', uk: 'Морозилка', lv: 'Saldētava' } },
  ],
};

const CATEGORIES_DATA: { id: string; emoji: string; labels: Record<string, string> }[] = [
  { id: 'dairy', emoji: '🥛', labels: { en: 'Dairy', ru: 'Молочное', uk: 'Молочне', lv: 'Piena prod.' } },
  { id: 'meat', emoji: '🥩', labels: { en: 'Meat & Fish', ru: 'Мясо и рыба', uk: 'М\'ясо та риба', lv: 'Gaļa un zivis' } },
  { id: 'produce', emoji: '🥬', labels: { en: 'Produce', ru: 'Овощи/Фрукты', uk: 'Овочі/Фрукти', lv: 'Dārzeņi' } },
  { id: 'drinks', emoji: '🧃', labels: { en: 'Drinks', ru: 'Напитки', uk: 'Напої', lv: 'Dzērieni' } },
  { id: 'eggs', emoji: '🥚', labels: { en: 'Eggs', ru: 'Яйца', uk: 'Яйця', lv: 'Olas' } },
  { id: 'other', emoji: '🧀', labels: { en: 'Other', ru: 'Другое', uk: 'Інше', lv: 'Cits' } },
];

const PHOTO_SLOTS_DATA: Record<string, { id: number; label: string }[]> = {
  en: [{ id: 0, label: '📷 Shelf 1' }, { id: 1, label: '📷 Shelf 2' }, { id: 2, label: '📷 Drawer' }, { id: 3, label: '📷 Door' }],
  ru: [{ id: 0, label: '📷 Полка 1' }, { id: 1, label: '📷 Полка 2' }, { id: 2, label: '📷 Ящик' }, { id: 3, label: '📷 Дверца' }],
  uk: [{ id: 0, label: '📷 Полиця 1' }, { id: 1, label: '📷 Полиця 2' }, { id: 2, label: '📷 Ящик' }, { id: 3, label: '📷 Дверцята' }],
  lv: [{ id: 0, label: '📷 Plaukts 1' }, { id: 1, label: '📷 Plaukts 2' }, { id: 2, label: '📷 Atvilktne' }, { id: 3, label: '📷 Durvis' }],
};

interface ScanModalProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

const ScanModal = ({ open, onClose, onSaved }: ScanModalProps) => {
  const { user } = useAuth();
  const { t, language } = useTranslation();
  const units = getUnits(language);
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [photos, setPhotos] = useState<(string | null)[]>([null, null, null, null]);
  const [base64s, setBase64s] = useState<(string | null)[]>([null, null, null, null]);
  const [scannedItems, setScannedItems] = useState<ScannedItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const fileRefs = useRef<(HTMLInputElement | null)[]>([]);

  const reset = () => {
    setStep(1);
    setPhotos([null, null, null, null]);
    setBase64s([null, null, null, null]);
    setScannedItems([]);
    setShowBanner(false);
  };

  const handleClose = () => { reset(); onClose(); };

  const photoCount = base64s.filter(Boolean).length;

  const handleFile = useCallback((file: File, slotIdx: number) => {
    if (!file.type.startsWith('image/')) {
      toast.error(t.scan.selectImage);
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setPhotos(prev => { const n = [...prev]; n[slotIdx] = dataUrl; return n; });
      setBase64s(prev => { const n = [...prev]; n[slotIdx] = dataUrl.split(',')[1]; return n; });
    };
    reader.readAsDataURL(file);
  }, [t]);

  const handleScan = async () => {
    const images = base64s.filter(Boolean) as string[];
    if (images.length === 0) return;
    setStep(2);

    try {
      const { data, error } = await supabase.functions.invoke('scan-fridge', {
        body: { images },
      });

      if (error) throw error;

      const items: ScannedItem[] = (data?.items || []).map((i: any) => ({
        name: String(i.name || ''),
        quantity: Number(i.quantity) || 1,
        unit: units.some(u => u.value === i.unit) ? i.unit : 'pcs',
        category: CATEGORIES_DATA.some(c => c.id === i.category) ? i.category : 'other',
        storage_location: 'fridge',
        unknown: Boolean(i.unknown),
      }));

      setScannedItems(items);
      setStep(3);
    } catch (err) {
      console.error('Scan error:', err);
      toast.error(t.scan.scanFailed);
      setStep(1);
    }
  };

  const removeItem = (idx: number) => {
    setScannedItems(prev => prev.filter((_, i) => i !== idx));
  };

  const updateItem = (idx: number, field: keyof ScannedItem, value: any) => {
    setScannedItems(prev =>
      prev.map((item, i) => (i === idx ? { ...item, [field]: value } : item))
    );
  };

  const addManualItem = () => {
    setScannedItems(prev => [...prev, { name: '', quantity: 1, unit: 'pcs', category: 'other', storage_location: 'fridge' }]);
  };

  const groupedItems = CATEGORIES_DATA.map(cat => ({
    ...cat,
    label: cat.labels[language] || cat.labels.en,
    items: scannedItems
      .map((item, idx) => ({ ...item, _idx: idx }))
      .filter(item => item.category === cat.id),
  })).filter(g => g.items.length > 0);

  const validCount = scannedItems.filter(i => i.name.trim()).length;

  const handleSaveAll = async () => {
    if (!user) return;
    const valid = scannedItems.filter(i => i.name.trim());
    if (valid.length === 0) { toast.error(t.scan.noItems); return; }

    setSaving(true);
    try {
      const { data: existing } = await supabase
        .from('inventory_items')
        .select('id, name, quantity')
        .eq('user_id', user.id);

      const existingMap = new Map<string, { id: string; quantity: number }>();
      (existing || []).forEach((e: any) => {
        existingMap.set(e.name.toLowerCase(), { id: e.id, quantity: Number(e.quantity) || 0 });
      });

      const toInsert: any[] = [];
      const toUpdate: { id: string; quantity: number }[] = [];

      for (const item of valid) {
        const key = item.name.toLowerCase().trim();
        const match = existingMap.get(key);
        if (match) {
          toUpdate.push({ id: match.id, quantity: match.quantity + item.quantity });
        } else {
          toInsert.push({
            user_id: user.id,
            name: item.name.trim(),
            quantity: item.quantity,
            unit: item.unit,
            category: item.category,
            storage_location: item.storage_location,
          });
        }
      }

      if (toInsert.length > 0) {
        const { error } = await supabase.from('inventory_items').insert(toInsert);
        if (error) throw error;
      }

      for (const u of toUpdate) {
        await supabase.from('inventory_items').update({ quantity: u.quantity }).eq('id', u.id);
      }

      toast.success(t.scan.itemsSaved.replace('{count}', String(valid.length)));
      onSaved();
      setShowBanner(true);
      setStep(4);
    } catch (err) {
      console.error('Save error:', err);
      toast.error(t.scan.failedSave);
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        className="bg-card rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg flex flex-col"
        style={{ boxShadow: '0 -4px 40px rgba(0,0,0,0.15)', maxHeight: '90vh' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border shrink-0">
          <h2 className="text-lg font-bold text-foreground">
            {step === 1 ? t.scan.title : step === 2 ? t.scan.analyzing : step === 3 ? t.scan.results : '✅ ' + t.scan.savedTitle}
          </h2>
          <button onClick={handleClose} className="p-1 rounded-lg hover:bg-gray-100">
            <X className="w-5 h-5" style={{ color: '#6B7280' }} />
          </button>
        </div>

        {/* Progress */}
        <div className="flex gap-1 px-4 pt-3">
          {[1, 2, 3, 4].map(s => (
            <div key={s} className="flex-1 h-1 rounded-full" style={{ backgroundColor: step >= s ? '#7C3AED' : '#EDE9FE' }} />
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {/* STEP 1: Multi-photo upload */}
          {step === 1 && (
            <div>
              <p className="text-sm mb-3" style={{ color: '#6B7280' }}>{t.scan.multiPhotoHint}</p>
              <div className="grid grid-cols-2 gap-3">
                {(PHOTO_SLOTS_DATA[language] || PHOTO_SLOTS_DATA.en).map((slot) => (
                  <div key={slot.id}>
                    <input
                      ref={el => { fileRefs.current[slot.id] = el; }}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) handleFile(file, slot.id);
                      }}
                    />
                    <button
                      onClick={() => fileRefs.current[slot.id]?.click()}
                      className="w-full aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-1 transition-colors hover:border-[#7C3AED] hover:bg-[#F5F3FF] overflow-hidden"
                      style={{ borderColor: photos[slot.id] ? '#7C3AED' : '#DDD6FE' }}
                    >
                      {photos[slot.id] ? (
                        <img src={photos[slot.id]!} alt={slot.label} className="w-full h-full object-cover rounded-lg" />
                      ) : (
                        <>
                          <span className="text-2xl">📷</span>
                          <span className="text-xs font-medium" style={{ color: '#9CA3AF' }}>{slot.label}</span>
                        </>
                      )}
                    </button>
                  </div>
                ))}
              </div>
              <button
                onClick={handleScan}
                disabled={photoCount === 0}
                className="w-full mt-4 h-14 rounded-2xl text-white font-semibold text-sm transition-opacity disabled:opacity-40"
                style={{ backgroundColor: '#7C3AED' }}
              >
                {t.scan.scanAllPhotos} ✨
              </button>
            </div>
          )}

          {/* STEP 2: Processing */}
          {step === 2 && (
            <div className="py-8">
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 rounded-full flex items-center justify-center animate-pulse" style={{ backgroundColor: '#EDE9FE' }}>
                  <span className="text-3xl">🤖</span>
                </div>
              </div>
              <div className="space-y-3 mb-6">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg animate-pulse" style={{ backgroundColor: '#EDE9FE' }} />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 rounded-full animate-pulse" style={{ backgroundColor: '#EDE9FE', width: `${70 - i * 8}%` }} />
                      <div className="h-2 rounded-full animate-pulse" style={{ backgroundColor: '#F5F3FF', width: `${40 + i * 5}%` }} />
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-center text-sm" style={{ color: '#6B7280' }}>{t.scan.aiAnalyzing}</p>
            </div>
          )}

          {/* STEP 3: Categorized results */}
          {step === 3 && (
            <div>
              <p className="text-sm font-medium mb-3" style={{ color: '#1E1B4B' }}>{t.scan.aiFound}</p>

              {scannedItems.length === 0 ? (
                <p className="text-sm text-center py-6" style={{ color: '#9CA3AF' }}>{t.inventory.noItemsDetected}</p>
              ) : (
                <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1 pb-28">
                  {groupedItems.map(group => (
                    <div key={group.id}>
                      <div className="flex items-center gap-1.5 mb-2">
                        <span>{group.emoji}</span>
                        <span className="text-xs font-bold uppercase tracking-wide" style={{ color: '#7C3AED' }}>{group.label}</span>
                        <span className="text-xs" style={{ color: '#9CA3AF' }}>({group.items.length})</span>
                      </div>
                      <div className="space-y-1.5">
                        {group.items.map(item => (
                          <div key={item._idx} className={`flex items-center gap-1.5 p-2 rounded-xl ${item.unknown ? 'border border-dashed' : ''}`} style={{ backgroundColor: item.unknown ? '#F3F4F6' : '#F5F3FF', borderColor: item.unknown ? '#9CA3AF' : undefined }}>
                            {item.unknown && <span className="text-lg shrink-0">❓</span>}
                            <input
                              value={item.name}
                              onChange={e => updateItem(item._idx, 'name', e.target.value)}
                              placeholder={item.unknown ? (t.scan as any).unknownPlaceholder || "What's inside? (optional)" : t.inventory.itemName}
                              className="flex-1 min-w-0 text-sm font-medium bg-white rounded-lg px-2 py-1.5 border outline-none focus:border-[#7C3AED]"
                              style={{ borderColor: '#DDD6FE', color: '#1E1B4B' }}
                            />
                            {/* Qty with +/- */}
                            <div className="flex items-center gap-0.5">
                              <button
                                onClick={() => updateItem(item._idx, 'quantity', Math.max(0, item.quantity - 1))}
                                className="w-6 h-6 rounded flex items-center justify-center hover:bg-white"
                                style={{ color: '#7C3AED' }}
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <input
                                type="number"
                                value={item.quantity}
                                onChange={e => updateItem(item._idx, 'quantity', Number(e.target.value) || 0)}
                                className="w-10 text-xs text-center bg-white rounded px-0.5 py-1 border outline-none focus:border-[#7C3AED]"
                                style={{ borderColor: '#DDD6FE' }}
                                min={0}
                              />
                              <button
                                onClick={() => updateItem(item._idx, 'quantity', item.quantity + 1)}
                                className="w-6 h-6 rounded flex items-center justify-center hover:bg-white"
                                style={{ color: '#7C3AED' }}
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                            {/* Unit */}
                            <select
                              value={item.unit}
                              onChange={e => updateItem(item._idx, 'unit', e.target.value)}
                              className="text-[11px] bg-white rounded-lg px-1 py-1.5 border outline-none"
                              style={{ borderColor: '#DDD6FE', color: '#6B7280' }}
                            >
                              {units.map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
                            </select>
                            {/* Storage location chip */}
                            <select
                              value={item.storage_location}
                              onChange={e => updateItem(item._idx, 'storage_location', e.target.value)}
                              className="text-[11px] bg-white rounded-lg px-1 py-1.5 border outline-none"
                              style={{ borderColor: '#DDD6FE', color: '#6B7280' }}
                            >
                              {STORAGE_OPTIONS.default.map(s => (
                                <option key={s.id} value={s.id}>{s.emoji} {s.labels[language] || s.labels.en}</option>
                              ))}
                            </select>
                            {/* Remove */}
                            <button onClick={() => removeItem(item._idx)} className="p-1 rounded-lg hover:bg-red-50 text-xs shrink-0" style={{ color: '#DC2626' }}>
                              ❌
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <button onClick={addManualItem} className="flex items-center gap-1.5 mt-3 text-sm font-medium" style={{ color: '#7C3AED' }}>
                <Plus className="w-4 h-4" /> {t.scan.addSomethingElse}
              </button>
              <p className="text-xs mt-2" style={{ color: '#9CA3AF' }}>{t.scan.skipHint}</p>

              {/* Confirm area */}
              <div className="bottom-action-bar">
                <button
                  onClick={handleSaveAll}
                  disabled={saving || validCount === 0}
                  className="w-full rounded-xl bg-primary px-4 py-4 text-base font-bold text-primary-foreground disabled:opacity-50"
                  style={{ minHeight: '52px' }}
                >
                  {saving ? t.common.loading : t.scan.saveToInventory}
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: Success + recipe banner */}
          {step === 4 && (
            <div className="py-6 text-center">
              <div className="text-5xl mb-4">🎉</div>
              <p className="text-lg font-bold mb-2" style={{ color: '#1E1B4B' }}>{t.scan.savedTitle}</p>
              <p className="text-sm mb-6" style={{ color: '#6B7280' }}>
                {t.scan.itemsSaved.replace('{count}', String(validCount))}
              </p>

              {/* Recipe banner */}
              <div className="p-4 rounded-xl mb-4" style={{ backgroundColor: '#F5F3FF', border: '1px solid #DDD6FE' }}>
                <p className="text-sm font-medium mb-2" style={{ color: '#1E1B4B' }}>
                  🍽 {t.scan.recipeBanner}
                </p>
                <button
                  onClick={() => { handleClose(); navigate('/recipes'); }}
                  className="w-full h-10 rounded-xl text-sm font-semibold text-white"
                  style={{ backgroundColor: '#7C3AED' }}
                >
                  {t.scan.goToRecipes}
                </button>
              </div>

              <button
                onClick={() => setStep(3)}
                className="text-sm font-medium"
                style={{ color: '#7C3AED' }}
              >
                {t.scan.editMore}
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default ScanModal;
