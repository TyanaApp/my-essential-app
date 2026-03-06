import { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { X, Camera, RotateCcw, Pencil } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useTranslation } from '@/hooks/useTranslation';
import { useLanguage } from '@/contexts/LanguageContext';

interface MealScanResult {
  meal_name: string;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  items: { name: string; calories: number; portion: string }[];
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
  { id: 'full', multiplier: 1, labelKey: 'portionFull' },
  { id: 'three_quarters', multiplier: 0.75, labelKey: 'portionThreeQuarters' },
  { id: 'half', multiplier: 0.5, labelKey: 'portionHalf' },
  { id: 'quarter', multiplier: 0.25, labelKey: 'portionQuarter' },
];

const MealScanModal = ({ open, onClose, mealType, dateStr, onSaved }: MealScanModalProps) => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const { language } = useLanguage();
  const fileRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<'capture' | 'analyzing' | 'results'>('capture');
  const [photo, setPhoto] = useState<string | null>(null);
  const [result, setResult] = useState<MealScanResult | null>(null);
  const [portion, setPortion] = useState('full');
  const [editName, setEditName] = useState('');
  const [saving, setSaving] = useState(false);

  const ds = t.diary as any;
  const ms = (t as any).mealScan || {} as any;

  const reset = () => {
    setStep('capture');
    setPhoto(null);
    setResult(null);
    setPortion('full');
    setEditName('');
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

      if (error || data?.error) {
        toast.error(ms.scanFailed || 'Scan failed');
        setStep('capture');
        return;
      }

      setResult(data as MealScanResult);
      setEditName(data.meal_name || '');
      setStep('results');
    } catch {
      toast.error(ms.scanFailed || 'Scan failed');
      setStep('capture');
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
    // Close this modal — parent will open manual modal with pre-filled values
    onClose();
    // We pass data through the onSaved callback with a special flag
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: '#EDE9FE' }}>
          <h2 className="text-lg font-bold" style={{ color: '#1E1B4B' }}>
            {step === 'capture' ? (ms.scanMeal || '📸 Scan meal') : step === 'analyzing' ? (ms.analyzing || '🤖 Analyzing...') : (ms.aiFound || '✅ AI found:')}
          </h2>
          <button onClick={handleClose} className="p-1 rounded-lg hover:bg-gray-100">
            <X className="w-5 h-5" style={{ color: '#6B7280' }} />
          </button>
        </div>

        <div className="p-4">
          {/* CAPTURE */}
          {step === 'capture' && (
            <div className="text-center py-6">
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                capture="environment"
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
                  onClick={() => fileRef.current?.click()}
                  className="w-full aspect-[4/3] rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-[#7C3AED] hover:bg-[#F5F3FF] transition-colors"
                  style={{ borderColor: '#DDD6FE' }}
                >
                  <Camera className="w-12 h-12" style={{ color: '#7C3AED' }} />
                  <span className="text-sm font-medium" style={{ color: '#6B7280' }}>
                    {ms.takePhoto || 'Take a photo of your meal'}
                  </span>
                </div>
              )}
              {!photo && (
                <button
                  onClick={() => fileRef.current?.click()}
                  className="w-full mt-4 h-14 rounded-2xl text-white font-semibold text-sm"
                  style={{ backgroundColor: '#7C3AED' }}
                >
                  📸 {ms.scanMeal || 'Scan meal'}
                </button>
              )}
            </div>
          )}

          {/* ANALYZING */}
          {step === 'analyzing' && (
            <div className="py-8 text-center">
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 rounded-full flex items-center justify-center animate-pulse" style={{ backgroundColor: '#EDE9FE' }}>
                  <span className="text-3xl">🤖</span>
                </div>
              </div>
              {photo && (
                <img src={photo} alt="meal" className="w-32 h-32 object-cover rounded-xl mx-auto mb-4 opacity-60" />
              )}
              <p className="text-sm" style={{ color: '#6B7280' }}>{ms.analyzingHint || 'Analyzing your meal... ~10 seconds'}</p>
            </div>
          )}

          {/* RESULTS */}
          {step === 'results' && result && adjustedResult && (
            <div className="space-y-4">
              {/* Photo preview */}
              {photo && (
                <img src={photo} alt="meal" className="w-full h-40 object-cover rounded-xl" />
              )}

              {/* Meal name (editable) */}
              <input
                value={editName}
                onChange={e => setEditName(e.target.value)}
                className="w-full text-lg font-bold bg-transparent border-b-2 pb-1 outline-none focus:border-[#7C3AED]"
                style={{ color: '#1E1B4B', borderColor: '#EDE9FE' }}
              />

              {/* Big calorie number */}
              <div className="text-center py-2">
                <span className="text-4xl font-bold" style={{ color: '#7C3AED' }}>
                  {adjustedResult.calories}
                </span>
                <span className="text-lg ml-1" style={{ color: '#7C3AED' }}>kcal</span>
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
                    <div className="text-[10px] font-medium" style={{ color: '#6B7280' }}>{m.label}</div>
                  </div>
                ))}
              </div>

              {/* Confidence badge */}
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

              {/* Items breakdown */}
              {result.items && result.items.length > 0 && (
                <div className="rounded-xl p-3 space-y-1.5" style={{ backgroundColor: '#F5F3FF' }}>
                  {result.items.map((item, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <span style={{ color: '#1E1B4B' }}>{item.name}</span>
                      <span style={{ color: '#6B7280' }}>
                        {Math.round(item.calories * portionMultiplier)} kcal · {item.portion}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Portion selector */}
              <div>
                <p className="text-xs font-medium mb-2" style={{ color: '#6B7280' }}>{ms.portionEaten || 'Portion eaten:'}</p>
                <div className="flex gap-1.5">
                  {PORTION_OPTIONS.map(p => (
                    <button
                      key={p.id}
                      onClick={() => setPortion(p.id)}
                      className="flex-1 py-2 rounded-xl text-xs font-semibold transition-all border-[1.5px]"
                      style={{
                        borderColor: portion === p.id ? '#7C3AED' : '#DDD6FE',
                        backgroundColor: portion === p.id ? '#EDE9FE' : 'white',
                        color: portion === p.id ? '#7C3AED' : '#6B7280',
                      }}
                    >
                      {(ms as any)?.[p.labelKey] || (p.id === 'full' ? '100%' : p.id === 'three_quarters' ? '75%' : p.id === 'half' ? '50%' : '25%')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action buttons */}
              <div className="space-y-2 pt-2">
                <button
                  onClick={handleLog}
                  disabled={saving}
                  className="w-full h-12 rounded-xl text-white font-semibold text-sm transition-opacity disabled:opacity-40"
                  style={{ backgroundColor: '#7C3AED' }}
                >
                  {saving ? t.common.loading : (ms.logThisMeal || 'Log this meal')}
                </button>
                <div className="flex gap-2">
                  <button
                    onClick={handleEditManually}
                    className="flex-1 h-10 rounded-xl text-sm font-medium border-[1.5px] flex items-center justify-center gap-1"
                    style={{ borderColor: '#DDD6FE', color: '#6B7280' }}
                  >
                    <Pencil className="w-3.5 h-3.5" /> {ms.editManually || 'Edit manually'}
                  </button>
                  <button
                    onClick={() => { reset(); fileRef.current?.click(); }}
                    className="flex-1 h-10 rounded-xl text-sm font-medium border-[1.5px] flex items-center justify-center gap-1"
                    style={{ borderColor: '#DDD6FE', color: '#6B7280' }}
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> {ms.scanAgain || 'Scan again'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default MealScanModal;
