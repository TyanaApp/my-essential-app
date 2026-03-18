import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Camera, RotateCcw, Pencil, Loader2, Image } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useTranslation } from '@/hooks/useTranslation';
import { useLanguage } from '@/contexts/LanguageContext';

interface ScanItem { name: string; calories: number; portion: string; }

interface MealScanResult {
  meal_name: string;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  items: ScanItem[];
  confidence: 'high' | 'medium' | 'low';
}

interface MealScanModalProps {
  open: boolean;
  onClose: () => void;
  mealType: string;
  dateStr: string;
  onSaved: (entry: any) => void;
}

const PORTION_OPTIONS = [
  { id: 'extra', multiplier: 1.5, labelKey: 'portionExtra' },
  { id: 'full', multiplier: 1, labelKey: 'portionFull' },
  { id: 'three_quarters', multiplier: 0.75, labelKey: 'portionThreeQuarters' },
  { id: 'half', multiplier: 0.5, labelKey: 'portionHalf' },
  { id: 'quarter', multiplier: 0.25, labelKey: 'portionQuarter' },
];

const MealScanModal = ({ open, onClose, mealType, dateStr, onSaved }: MealScanModalProps) => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const { language } = useLanguage();
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<'capture' | 'analyzing' | 'results'>('capture');
  const [showSourcePicker, setShowSourcePicker] = useState(false);
  const [photo, setPhoto] = useState<string | null>(null);
  const [result, setResult] = useState<MealScanResult | null>(null);
  const [portion, setPortion] = useState('full');
  const [editName, setEditName] = useState('');
  const [saving, setSaving] = useState(false);
  const [editingItemIdx, setEditingItemIdx] = useState<number | null>(null);
  const [editingItemName, setEditingItemName] = useState('');
  const [recalculating, setRecalculating] = useState(false);

  const ds = t.diary as any;
  const ms = (t as any).mealScan || {} as any;

  const reset = () => {
    setStep('capture');
    setPhoto(null);
    setResult(null);
    setPortion('full');
    setEditName('');
    setEditingItemIdx(null);
    setEditingItemName('');
    setShowSourcePicker(false);
  };

  const handleClose = () => { reset(); onClose(); };

  const portionMultiplier = PORTION_OPTIONS.find(p => p.id === portion)?.multiplier || 1;

  const adjustedResult = result ? {
    calories: Math.round(result.calories * portionMultiplier),
    protein: Math.round(result.protein * portionMultiplier),
    fat: Math.round(result.fat * portionMultiplier),
    carbs: Math.round(result.carbs * portionMultiplier),
  } : null;

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target?.result as string;
      setPhoto(dataUrl);
      const base64 = dataUrl.split(',')[1];
      await scanMeal(base64);
    };
    reader.readAsDataURL(file);
  }, []);

  const scanMeal = async (base64: string) => {
    setStep('analyzing');
    try {
      const { data, error } = await supabase.functions.invoke('scan-meal-calories', {
        body: { imageBase64: base64, language },
      });

      if (error || !data || data?.error) {
        // Never block user — fall back to manual entry
        const fallbackMsg = language === 'ru' ? 'Не смогли распознать автоматически. Введите вручную:' :
          language === 'uk' ? 'Не вдалось розпізнати. Введіть вручну:' :
          language === 'lv' ? 'Nevarēja atpazīt. Ievadiet manuāli:' :
          'Could not recognize. Enter manually:';
        toast(fallbackMsg);
        setStep('capture');
        return;
      }

      setResult(data as MealScanResult);
      setEditName(data.meal_name || '');
      setStep('results');
    } catch {
      const fallbackMsg = language === 'ru' ? 'Не смогли распознать автоматически. Введите вручную:' :
        language === 'uk' ? 'Не вдалось розпізнати. Введіть вручну:' :
        language === 'lv' ? 'Nevarēja atpazīt. Ievadiet manuāli:' :
        'Could not recognize. Enter manually:';
      toast(fallbackMsg);
      setStep('capture');
    }
  };

  const recalculateItem = async (idx: number, newName: string) => {
    if (!result || !newName.trim()) return;
    const oldItem = result.items[idx];
    setRecalculating(true);
    try {
      const { data, error } = await supabase.functions.invoke('scan-meal-calories', {
        body: {
          recalculate: true,
          itemName: newName.trim(),
          portion: oldItem.portion,
          language,
        },
      });

      if (error || data?.error) {
        toast.error(ms.recalcFailed || 'Recalculation failed');
        setRecalculating(false);
        return;
      }

      const newNutrition = data as { calories: number; protein: number; fat: number; carbs: number };
      const oldCalRatio = result.calories > 0 ? oldItem.calories / result.calories : 0;
      const calDiff = newNutrition.calories - oldItem.calories;
      const protDiff = newNutrition.protein - (result.protein * oldCalRatio);
      const fatDiff = newNutrition.fat - (result.fat * oldCalRatio);
      const carbsDiff = newNutrition.carbs - (result.carbs * oldCalRatio);

      const updatedItems = [...result.items];
      updatedItems[idx] = { name: newName.trim(), calories: newNutrition.calories, portion: oldItem.portion };

      setResult({
        ...result,
        items: updatedItems,
        calories: Math.max(0, Math.round(result.calories + calDiff)),
        protein: Math.max(0, Math.round(result.protein + protDiff)),
        fat: Math.max(0, Math.round(result.fat + fatDiff)),
        carbs: Math.max(0, Math.round(result.carbs + carbsDiff)),
      });
      setEditingItemIdx(null);
      toast.success(ms.recalculated || 'Recalculated ✓');
    } catch {
      toast.error(ms.recalcFailed || 'Recalculation failed');
    } finally {
      setRecalculating(false);
    }
  };

  const handleLog = async () => {
    if (!user || !adjustedResult) return;
    setSaving(true);
    try {
      const { data, error } = await supabase.from('meal_entries').insert({
        user_id: user.id,
        date: dateStr,
        meal_type: mealType,
        custom_name: editName || result?.meal_name || 'Scanned meal',
        total_calories: adjustedResult.calories,
        total_protein: adjustedResult.protein,
        total_fat: adjustedResult.fat,
        total_carbs: adjustedResult.carbs,
      } as any).select().single();

      if (error) throw error;
      if (data) onSaved(data);
      toast.success(`${editName || result?.meal_name} ${t.diary.logged}`);
      handleClose();
    } catch {
      toast.error(t.common.error);
    } finally {
      setSaving(false);
    }
  };

  const handleEditManually = () => {
    onClose();
    if (result && adjustedResult) {
      onSaved({
        _prefill: true,
        custom_name: editName || result.meal_name,
        total_calories: adjustedResult.calories,
        total_protein: adjustedResult.protein,
        total_fat: adjustedResult.fat,
        total_carbs: adjustedResult.carbs,
      });
    }
  };

  const confidenceBadge = (conf: string) => {
    if (conf === 'high') return { emoji: '✅', label: ms.confHigh || 'High confidence', color: '#059669' };
    if (conf === 'medium') return { emoji: '⚠️', label: ms.confMedium || 'Estimated', color: '#EA580C' };
    return { emoji: '❓', label: ms.confLow || 'Low confidence', color: '#DC2626' };
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
            {step === 'capture' ? (ms.scanMeal || '📸 Scan meal') : step === 'analyzing' ? (ms.analyzing || '🤖 Analyzing...') : (ms.aiFound || '✅ AI found:')}
          </h2>
          <button onClick={handleClose} className="p-1 rounded-lg hover:bg-muted">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* CAPTURE */}
          {step === 'capture' && (
            <div className="text-center py-6">
              <input
                ref={cameraRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) handleFile(file);
                }}
              />
              <input
                ref={galleryRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) handleFile(file);
                }}
              />
              {photo ? (
                <img src={photo} alt="meal" className="w-full max-h-64 object-cover rounded-xl mb-4" />
              ) : (
                <div
                  onClick={() => setShowSourcePicker(true)}
                  className="w-full aspect-[4/3] rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-primary hover:bg-accent transition-colors border-border"
                >
                  <Camera className="w-12 h-12 text-primary" />
                  <span className="text-sm font-medium text-muted-foreground">
                    {ms.takePhoto || 'Take a photo of your meal'}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* ANALYZING */}
          {step === 'analyzing' && (
            <div className="py-8 text-center">
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 rounded-full flex items-center justify-center animate-pulse bg-accent">
                  <span className="text-3xl">🤖</span>
                </div>
              </div>
              {photo && (
                <img src={photo} alt="meal" className="w-32 h-32 object-cover rounded-xl mx-auto mb-4 opacity-60" />
              )}
              <p className="text-sm text-muted-foreground">{ms.analyzingHint || 'Analyzing your meal... ~10 seconds'}</p>
            </div>
          )}

          {/* RESULTS */}
          {step === 'results' && result && adjustedResult && (
            <div className="space-y-4">
              {photo && (
                <img src={photo} alt="meal" className="w-full h-40 object-cover rounded-xl" />
              )}

              <input
                value={editName}
                onChange={e => setEditName(e.target.value)}
                className="w-full text-lg font-bold bg-transparent border-b-2 pb-1 outline-none focus:border-primary text-foreground border-border"
              />

              {/* Big calorie number */}
              <div className="text-center py-2">
                {recalculating ? (
                  <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
                ) : (
                  <>
                    <span className="text-4xl font-bold text-primary">{adjustedResult.calories}</span>
                    <span className="text-lg ml-1 text-primary">kcal</span>
                  </>
                )}
              </div>

              {/* Macro bar */}
              <div className="flex justify-center gap-6">
                {[
                  { label: t.diary.protein.replace(' (g)', '').replace(' (г)', ''), value: adjustedResult.protein, color: '#3B82F6' },
                  { label: t.diary.fat.replace(' (g)', '').replace(' (г)', ''), value: adjustedResult.fat, color: '#F59E0B' },
                  { label: t.diary.carbs.replace(' (g)', '').replace(' (г)', ''), value: adjustedResult.carbs, color: '#10B981' },
                ].map(m => (
                  <div key={m.label} className="text-center">
                    <div className="text-lg font-bold" style={{ color: m.color }}>{m.value}g</div>
                    <div className="text-[10px] font-medium text-muted-foreground">{m.label}</div>
                  </div>
                ))}
              </div>

              {/* Confidence */}
              {result.confidence && (() => {
                const badge = confidenceBadge(result.confidence);
                return (
                  <div className="flex justify-center">
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: `${badge.color}15`, color: badge.color }}>
                      {badge.emoji} {badge.label}
                    </span>
                  </div>
                );
              })()}

              {/* Items breakdown — editable */}
              {result.items && result.items.length > 0 && (
                <div className="rounded-xl p-3 space-y-1.5 bg-accent">
                  {result.items.map((item, i) => (
                    <div key={i} className="flex items-center justify-between text-sm gap-2">
                      {editingItemIdx === i ? (
                        <div className="flex-1 flex items-center gap-1">
                          <input
                            value={editingItemName}
                            onChange={e => setEditingItemName(e.target.value)}
                            className="flex-1 h-7 px-2 rounded-lg border text-xs outline-none focus:border-primary border-border bg-card"
                            autoFocus
                            onKeyDown={e => { if (e.key === 'Enter') recalculateItem(i, editingItemName); }}
                          />
                          <button
                            onClick={() => recalculateItem(i, editingItemName)}
                            disabled={recalculating}
                            className="text-xs font-semibold px-2 py-1 rounded-lg text-primary-foreground shrink-0 bg-primary"
                          >
                            {recalculating ? <Loader2 className="w-3 h-3 animate-spin" /> : '✓'}
                          </button>
                          <button onClick={() => setEditingItemIdx(null)} className="text-xs px-1 py-1 rounded-lg text-muted-foreground">✕</button>
                        </div>
                      ) : (
                        <>
                          <button
                            onClick={() => { setEditingItemIdx(i); setEditingItemName(item.name); }}
                            className="flex items-center gap-1 text-left text-foreground"
                          >
                            <Pencil className="w-3 h-3 shrink-0 text-muted-foreground" />
                            {item.name}
                          </button>
                          <span className="text-muted-foreground">
                            {Math.round(item.calories * portionMultiplier)} kcal · {item.portion}
                          </span>
                        </>
                      )}
                    </div>
                  ))}
                  <p className="text-[10px] mt-1 text-muted-foreground">
                    {ms.tapToEdit || 'Tap item name to edit & recalculate'}
                  </p>
                </div>
              )}

              {/* Portion selector */}
              <div>
                <p className="text-xs font-medium mb-2 text-muted-foreground">{ms.portionEaten || 'Portion eaten:'}</p>
                <div className="flex gap-1.5">
                  {PORTION_OPTIONS.map(p => (
                    <button
                      key={p.id}
                      onClick={() => setPortion(p.id)}
                      className="flex-1 py-2 rounded-xl text-xs font-semibold transition-all border-[1.5px]"
                      style={{
                        borderColor: portion === p.id ? 'hsl(var(--primary))' : 'hsl(var(--border))',
                        backgroundColor: portion === p.id ? 'hsl(var(--primary) / 0.15)' : 'transparent',
                        color: portion === p.id ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
                      }}
                    >
                      {(ms as any)?.[p.labelKey] || (p.id === 'extra' ? '150%' : p.id === 'full' ? '100%' : p.id === 'three_quarters' ? '75%' : p.id === 'half' ? '50%' : '25%')}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Fixed bottom buttons */}
        {step === 'capture' && !photo && (
          <div className="modal-actions rounded-b-2xl">
            <button
              onClick={() => fileRef.current?.click()}
              className="w-full h-14 rounded-2xl text-primary-foreground font-semibold text-sm bg-primary"
            >
              📸 {ms.scanMeal || 'Scan meal'}
            </button>
          </div>
        )}

        {step === 'results' && (
          <div className="modal-actions rounded-b-2xl space-y-2">
            <button
              onClick={handleLog}
              disabled={saving}
              className="w-full h-12 rounded-xl text-primary-foreground font-semibold text-sm transition-opacity disabled:opacity-40 bg-primary"
            >
              {saving ? t.common.loading : (ms.logThisMeal || 'Log this meal')}
            </button>
            <div className="flex gap-2">
              <button
                onClick={handleEditManually}
                className="flex-1 h-10 rounded-xl text-sm font-medium border-[1.5px] flex items-center justify-center gap-1 border-border text-muted-foreground"
              >
                <Pencil className="w-3.5 h-3.5" /> {ms.editManually || 'Edit manually'}
              </button>
              <button
                onClick={() => { reset(); fileRef.current?.click(); }}
                className="flex-1 h-10 rounded-xl text-sm font-medium border-[1.5px] flex items-center justify-center gap-1 border-border text-muted-foreground"
              >
                <RotateCcw className="w-3.5 h-3.5" /> {ms.scanAgain || 'Scan again'}
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default MealScanModal;
