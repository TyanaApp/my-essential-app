import { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { X, Plus, Minus } from 'lucide-react';
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
  shelf?: number;
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

const MAX_SLOTS = 5;

const TEXTS: Record<string, Record<string, string>> = {
  en: {
    photoTitle: 'Photo all shelves of your fridge',
    photoHint: 'Minimum 1 photo • Up to 5 shelves',
    shelf: 'Shelf',
    scanBtn: 'Scan',
    scanBtnPhotos: 'Scan ({count} photos)',
    scanningShelf: 'Scanning shelf {current} of {total}... ⏳',
    scanDone: 'Done! Found {count} products ✅',
    addMoreShelf: '+ Add another shelf',
    shelfFound: '📸 Shelf {n} — found {count} products',
  },
  ru: {
    photoTitle: 'Сфотографируй все полки холодильника',
    photoHint: 'Минимум 1 фото • До 5 полок',
    shelf: 'Полка',
    scanBtn: 'Сканировать',
    scanBtnPhotos: 'Сканировать ({count} фото)',
    scanningShelf: 'Сканирую полку {current} из {total}... ⏳',
    scanDone: 'Готово! Найдено {count} продуктов ✅',
    addMoreShelf: '+ Добавить ещё полку',
    shelfFound: '📸 Полка {n} — найдено {count} продуктов',
  },
  uk: {
    photoTitle: 'Сфотографуй всі полиці холодильника',
    photoHint: 'Мінімум 1 фото • До 5 полиць',
    shelf: 'Полиця',
    scanBtn: 'Сканувати',
    scanBtnPhotos: 'Сканувати ({count} фото)',
    scanningShelf: 'Скануємо полицю {current} з {total}... ⏳',
    scanDone: 'Готово! Знайдено {count} продуктів ✅',
    addMoreShelf: '+ Додати ще полицю',
    shelfFound: '📸 Полиця {n} — знайдено {count} продуктів',
  },
  lv: {
    photoTitle: 'Nofotografē visus ledusskapja plauktus',
    photoHint: 'Minimums 1 foto • Līdz 5 plauktiem',
    shelf: 'Plaukts',
    scanBtn: 'Skenēt',
    scanBtnPhotos: 'Skenēt ({count} foto)',
    scanningShelf: 'Skenē plauktu {current} no {total}... ⏳',
    scanDone: 'Gatavs! Atrasti {count} produkti ✅',
    addMoreShelf: '+ Pievienot vēl plauktu',
    shelfFound: '📸 Plaukts {n} — atrasti {count} produkti',
  },
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
  const tx = TEXTS[language] || TEXTS.en;

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [photos, setPhotos] = useState<(string | null)[]>(Array(MAX_SLOTS).fill(null));
  const [base64s, setBase64s] = useState<(string | null)[]>(Array(MAX_SLOTS).fill(null));
  const [scannedItems, setScannedItems] = useState<ScannedItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [scanProgress, setScanProgress] = useState('');
  const fileRefs = useRef<(HTMLInputElement | null)[]>([]);
  // For adding more shelves from results screen
  const extraFileRef = useRef<HTMLInputElement | null>(null);

  const reset = () => {
    setStep(1);
    setPhotos(Array(MAX_SLOTS).fill(null));
    setBase64s(Array(MAX_SLOTS).fill(null));
    setScannedItems([]);
    setScanProgress('');
  };

  const handleClose = () => { reset(); onClose(); };

  const filledSlots = base64s.map((b, i) => b ? i : -1).filter(i => i >= 0);
  const photoCount = filledSlots.length;

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

  const removePhoto = (slotIdx: number) => {
    setPhotos(prev => { const n = [...prev]; n[slotIdx] = null; return n; });
    setBase64s(prev => { const n = [...prev]; n[slotIdx] = null; return n; });
  };

  const handleScan = async () => {
    const activeSlots = filledSlots;
    if (activeSlots.length === 0) return;
    setStep(2);

    try {
      // Send ALL images at once for parallel processing in the edge function
      const allBase64s = activeSlots.map(slotIdx => base64s[slotIdx]!);
      
      setScanProgress(tx.scanningShelf.replace('{current}', '1').replace('{total}', String(activeSlots.length)));

      // Start progress animation
      const progressInterval = setInterval(() => {
        setScanProgress(prev => {
          if (prev.includes('⏳')) return prev.replace('⏳', '🔍');
          return prev.replace('🔍', '⏳');
        });
      }, 3000);

      const { data, error } = await supabase.functions.invoke('scan-fridge', {
        body: { images: allBase64s, language },
      });

      clearInterval(progressInterval);

      if (error) throw error;

      const items: ScannedItem[] = (data?.items || []).map((item: any) => ({
        name: String(item.name || ''),
        quantity: Number(item.quantity) || 1,
        unit: units.some(u => u.value === item.unit) ? item.unit : 'pcs',
        category: CATEGORIES_DATA.some(c => c.id === item.category) ? item.category : 'other',
        storage_location: 'fridge',
        unknown: Boolean(item.unknown),
      }));

      setScanProgress(tx.scanDone.replace('{count}', String(items.length)));
      setScannedItems(items);
      setTimeout(() => setStep(3), 800);
    } catch (err) {
      console.error('Scan error:', err);
      toast.error(t.scan.scanFailed);
      setStep(1);
    }
  };

  // Add more shelf from results screen
  const handleExtraShelfFile = async (file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target?.result as string;
      const b64 = dataUrl.split(',')[1];
      const shelfNum = (scannedItems.reduce((max, i) => Math.max(max, i.shelf || 0), 0)) + 1;
      
      setScanProgress(tx.scanningShelf.replace('{current}', String(shelfNum)).replace('{total}', String(shelfNum)));
      setStep(2);

      try {
        const { data, error } = await supabase.functions.invoke('scan-fridge', {
          body: { images: [b64], shelfNumber: shelfNum },
        });
        if (error) throw error;

        const newItems: ScannedItem[] = (data?.items || []).map((item: any) => ({
          name: String(item.name || ''),
          quantity: Number(item.quantity) || 1,
          unit: units.some(u => u.value === item.unit) ? item.unit : 'pcs',
          category: CATEGORIES_DATA.some(c => c.id === item.category) ? item.category : 'other',
          storage_location: 'fridge',
          unknown: Boolean(item.unknown),
          shelf: shelfNum,
        }));

        const deduped = newItems.filter(
          ni => !scannedItems.some(ex => ex.name.toLowerCase().trim() === ni.name.toLowerCase().trim())
        );

        setScannedItems(prev => [...prev, ...deduped]);
        toast.success(tx.shelfFound.replace('{n}', String(shelfNum)).replace('{count}', String(deduped.length)));
        setStep(3);
      } catch {
        toast.error(t.scan.scanFailed);
        setStep(3);
      }
    };
    reader.readAsDataURL(file);
  };

  const removeItem = (idx: number) => setScannedItems(prev => prev.filter((_, i) => i !== idx));

  const updateItem = (idx: number, field: keyof ScannedItem, value: any) => {
    setScannedItems(prev => prev.map((item, i) => (i === idx ? { ...item, [field]: value } : item)));
  };

  const addManualItem = () => {
    setScannedItems(prev => [...prev, { name: '', quantity: 1, unit: 'pcs', category: 'other', storage_location: 'fridge' }]);
  };

  const groupedItems = CATEGORIES_DATA.map(cat => ({
    ...cat,
    label: cat.labels[language] || cat.labels.en,
    items: scannedItems.map((item, idx) => ({ ...item, _idx: idx })).filter(item => item.category === cat.id),
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
          <button onClick={handleClose} className="p-1 rounded-lg hover:bg-secondary">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="flex gap-1 px-4 pt-3">
          {[1, 2, 3, 4].map(s => (
            <div key={s} className="flex-1 h-1 rounded-full" style={{ backgroundColor: step >= s ? 'hsl(var(--primary))' : 'hsl(var(--muted))' }} />
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {/* STEP 1: Multi-photo upload with 5 slots */}
          {step === 1 && (
            <div>
              <p className="text-sm font-semibold text-foreground mb-1">{tx.photoTitle}</p>
              <p className="text-xs text-muted-foreground mb-3">{tx.photoHint}</p>

              <div className="grid grid-cols-3 gap-2.5">
                {Array.from({ length: MAX_SLOTS }).map((_, i) => (
                  <div key={i}>
                    <input
                      ref={el => { fileRefs.current[i] = el; }}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) handleFile(file, i);
                      }}
                    />
                    <button
                      onClick={() => photos[i] ? removePhoto(i) : fileRefs.current[i]?.click()}
                      className="w-full aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-1 transition-colors overflow-hidden relative"
                      style={{ borderColor: photos[i] ? 'hsl(var(--primary))' : 'hsl(var(--border))' }}
                    >
                      {photos[i] ? (
                        <>
                          <img src={photos[i]!} alt="" className="w-full h-full object-cover rounded-lg" />
                          <span className="absolute top-1 right-1 w-5 h-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center font-bold">✕</span>
                        </>
                      ) : (
                        <>
                          <span className="text-2xl">{i === 0 ? '📷' : '+'}</span>
                          <span className="text-[10px] font-medium text-muted-foreground">
                            {tx.shelf} {i + 1}
                          </span>
                          {i === 0 && (
                            <span className="text-[9px] text-muted-foreground">*</span>
                          )}
                        </>
                      )}
                    </button>
                  </div>
                ))}
              </div>

              <button
                onClick={handleScan}
                disabled={photoCount === 0}
                className="w-full mt-4 h-14 rounded-2xl text-primary-foreground font-semibold text-sm transition-opacity disabled:opacity-40 bg-primary"
              >
                {photoCount > 0
                  ? `🔍 ${tx.scanBtnPhotos.replace('{count}', String(photoCount))}`
                  : `🔍 ${tx.scanBtn}`
                }
              </button>
            </div>
          )}

          {/* STEP 2: Processing with per-shelf progress */}
          {step === 2 && (
            <div className="py-8">
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 rounded-full flex items-center justify-center animate-pulse bg-muted">
                  <span className="text-3xl">🤖</span>
                </div>
              </div>
              <div className="space-y-3 mb-6">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg animate-pulse bg-muted" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 rounded-full animate-pulse bg-muted" style={{ width: `${70 - i * 8}%` }} />
                      <div className="h-2 rounded-full animate-pulse bg-muted/50" style={{ width: `${40 + i * 5}%` }} />
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-center text-sm font-medium text-muted-foreground">{scanProgress || t.scan.aiAnalyzing}</p>
            </div>
          )}

          {/* STEP 3: Results with shelf badges */}
          {step === 3 && (
            <div>
              <p className="text-sm font-medium text-foreground mb-3">{t.scan.aiFound}</p>

              {scannedItems.length === 0 ? (
                <p className="text-sm text-center py-6 text-muted-foreground">{t.inventory.noItemsDetected}</p>
              ) : (
                <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1 pb-28">
                  {groupedItems.map(group => (
                    <div key={group.id}>
                      <div className="flex items-center gap-1.5 mb-2">
                        <span>{group.emoji}</span>
                        <span className="text-xs font-bold uppercase tracking-wide text-primary">{group.label}</span>
                        <span className="text-xs text-muted-foreground">({group.items.length})</span>
                      </div>
                      <div className="space-y-1.5">
                        {group.items.map(item => (
                          <div key={item._idx} className={`flex items-center gap-1.5 p-2 rounded-xl ${item.unknown ? 'border border-dashed border-muted-foreground' : ''} bg-secondary`}>
                            {item.unknown && <span className="text-lg shrink-0">❓</span>}
                            <input
                              value={item.name}
                              onChange={e => updateItem(item._idx, 'name', e.target.value)}
                              placeholder={item.unknown ? (t.scan as any).unknownPlaceholder || "What's inside?" : t.inventory.itemName}
                              className="flex-1 min-w-0 text-sm font-medium bg-background rounded-lg px-2 py-1.5 border border-border outline-none focus:border-primary"
                            />
                            {/* Qty */}
                            <div className="flex items-center gap-0.5">
                              <button onClick={() => updateItem(item._idx, 'quantity', Math.max(0, item.quantity - 1))} className="w-6 h-6 rounded flex items-center justify-center hover:bg-background text-primary">
                                <Minus className="w-3 h-3" />
                              </button>
                              <input
                                type="number"
                                value={item.quantity}
                                onChange={e => updateItem(item._idx, 'quantity', Number(e.target.value) || 0)}
                                className="w-10 text-xs text-center bg-background rounded px-0.5 py-1 border border-border outline-none focus:border-primary"
                                min={0}
                              />
                              <button onClick={() => updateItem(item._idx, 'quantity', item.quantity + 1)} className="w-6 h-6 rounded flex items-center justify-center hover:bg-background text-primary">
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                            {/* Unit */}
                            <select
                              value={item.unit}
                              onChange={e => updateItem(item._idx, 'unit', e.target.value)}
                              className="text-[11px] bg-background rounded-lg px-1 py-1.5 border border-border outline-none text-muted-foreground"
                            >
                              {units.map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
                            </select>
                            {/* Storage */}
                            <select
                              value={item.storage_location}
                              onChange={e => updateItem(item._idx, 'storage_location', e.target.value)}
                              className="text-[11px] bg-background rounded-lg px-1 py-1.5 border border-border outline-none text-muted-foreground"
                            >
                              {STORAGE_OPTIONS.default.map(s => (
                                <option key={s.id} value={s.id}>{s.emoji} {s.labels[language] || s.labels.en}</option>
                              ))}
                            </select>
                            {/* Shelf badge */}
                            {item.shelf && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium shrink-0">
                                {tx.shelf} {item.shelf}
                              </span>
                            )}
                            {/* Remove */}
                            <button onClick={() => removeItem(item._idx)} className="p-1 rounded-lg hover:bg-destructive/10 text-xs shrink-0 text-destructive">
                              ❌
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-2 mt-3">
                <button onClick={addManualItem} className="flex items-center gap-1.5 text-sm font-medium text-primary">
                  <Plus className="w-4 h-4" /> {t.scan.addSomethingElse}
                </button>
                <span className="text-muted-foreground">•</span>
                <input
                  ref={extraFileRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) handleExtraShelfFile(file);
                  }}
                />
                <button onClick={() => extraFileRef.current?.click()} className="flex items-center gap-1.5 text-sm font-medium text-primary">
                  📷 {tx.addMoreShelf}
                </button>
              </div>
              <p className="text-xs mt-2 text-muted-foreground">{t.scan.skipHint}</p>

              {/* Save button */}
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

          {/* STEP 4: Success */}
          {step === 4 && (
            <div className="py-6 text-center">
              <div className="text-5xl mb-4">🎉</div>
              <p className="text-lg font-bold text-foreground mb-2">{t.scan.savedTitle}</p>
              <p className="text-sm text-muted-foreground mb-6">
                {t.scan.itemsSaved.replace('{count}', String(validCount))}
              </p>

              <div className="p-4 rounded-xl mb-4 bg-secondary border border-border">
                <p className="text-sm font-medium text-foreground mb-2">
                  🍽 {t.scan.recipeBanner}
                </p>
                <button
                  onClick={() => { handleClose(); navigate('/recipes'); }}
                  className="w-full h-10 rounded-xl text-sm font-semibold text-primary-foreground bg-primary"
                >
                  {t.scan.goToRecipes}
                </button>
              </div>

              <button onClick={() => setStep(3)} className="text-sm font-medium text-primary">
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
