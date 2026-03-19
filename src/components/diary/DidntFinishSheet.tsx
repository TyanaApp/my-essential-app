import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '@/hooks/useTranslation';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface MealEntry {
  id: string;
  total_calories: number | null;
  total_protein: number | null;
  total_fat: number | null;
  total_carbs: number | null;
}

interface Props {
  open: boolean;
  onClose: () => void;
  entry: MealEntry | null;
  onUpdated: (id: string, updated: Partial<MealEntry>) => void;
}

const PERCENT_OPTIONS = [25, 50, 75, 90];

const DidntFinishSheet = ({ open, onClose, entry, onUpdated }: Props) => {
  const { t } = useTranslation();
  const df = (t as any).didntFinish || {};

  const [mode, setMode] = useState<'percent' | 'grams'>('percent');
  const [selectedPct, setSelectedPct] = useState(75);
  const [gramsEaten, setGramsEaten] = useState('');
  const [saving, setSaving] = useState(false);

  if (!entry) return null;

  const totalCal = entry.total_calories || 0;

  const handleRecalculate = async () => {
    if (!entry) return;
    setSaving(true);

    let ratio: number;
    if (mode === 'grams' && gramsEaten) {
      // Approximate: use grams as percentage of "total" grams
      // We don't have total grams, so treat the input as percentage of original calories
      // Actually we'll use proportion: gramsEaten / totalGrams
      // Since we don't store total grams, use percentage approach
      ratio = Number(gramsEaten) / 100;
    } else {
      ratio = selectedPct / 100;
    }

    const updated = {
      total_calories: Math.round((entry.total_calories || 0) * ratio),
      total_protein: Math.round((entry.total_protein || 0) * ratio),
      total_fat: Math.round((entry.total_fat || 0) * ratio),
      total_carbs: Math.round((entry.total_carbs || 0) * ratio),
    };

    const { error } = await supabase
      .from('meal_entries')
      .update(updated)
      .eq('id', entry.id);

    setSaving(false);

    if (error) {
      toast.error(df.error || 'Error');
      return;
    }

    onUpdated(entry.id, updated);
    toast.success(df.recalculated || 'Calories recalculated ✓');
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-card rounded-t-2xl p-5 pb-8 shadow-xl"
          >
            <div className="w-10 h-1 bg-muted rounded-full mx-auto mb-4" />
            <h3 className="text-base font-bold text-foreground mb-4">
              {df.title || 'How much did you leave?'}
            </h3>

            {/* Percentage mode */}
            <p className="text-sm text-muted-foreground mb-2">
              {df.ateAbout || 'Ate approximately:'}
            </p>
            <div className="flex gap-2 mb-4">
              {PERCENT_OPTIONS.map((pct) => (
                <button
                  key={pct}
                  onClick={() => { setMode('percent'); setSelectedPct(pct); }}
                  className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${
                    mode === 'percent' && selectedPct === pct
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {pct}%
                </button>
              ))}
            </div>

            {/* Grams mode */}
            <p className="text-sm text-muted-foreground mb-2">
              {df.orExact || 'Or specify exactly:'}
            </p>
            <div className="flex items-center gap-2 mb-5">
              <input
                type="number"
                inputMode="numeric"
                value={gramsEaten}
                onChange={(e) => { setGramsEaten(e.target.value); setMode('grams'); }}
                placeholder="0"
                className="w-20 px-3 py-2 rounded-xl bg-muted text-foreground text-sm border border-border text-center"
              />
              <span className="text-sm text-muted-foreground">
                % {df.of || 'of'} {totalCal} {(t as any).diary?.kcalUnit || 'kcal'}
              </span>
            </div>

            {/* Preview */}
            {(() => {
              const ratio = mode === 'grams' && gramsEaten ? Number(gramsEaten) / 100 : selectedPct / 100;
              const newCal = Math.round(totalCal * ratio);
              return (
                <p className="text-xs text-muted-foreground mb-4">
                  {df.result || 'Result'}: <span className="font-bold text-foreground">{newCal} {(t as any).diary?.kcalUnit || 'kcal'}</span>
                  {' '}({df.was || 'was'} {totalCal})
                </p>
              );
            })()}

            <button
              onClick={handleRecalculate}
              disabled={saving}
              className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm disabled:opacity-50"
            >
              {saving ? '⏳...' : (df.recalculateBtn || '✓ Recalculate')}
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default DidntFinishSheet;
