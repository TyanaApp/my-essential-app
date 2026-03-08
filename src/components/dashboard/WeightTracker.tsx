import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Scale, TrendingDown, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from '@/hooks/useTranslation';
import { toast } from 'sonner';

const WeightTracker = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const adaptive = (t as any).adaptive || {};
  const [showInput, setShowInput] = useState(false);
  const [weightInput, setWeightInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [history, setHistory] = useState<{ weight: number; date: string }[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('weight_history')
      .select('weight, date')
      .eq('user_id', user.id)
      .order('date', { ascending: true })
      .limit(30)
      .then(({ data }) => {
        if (data) setHistory(data.map((d: any) => ({ weight: Number(d.weight), date: d.date })));
      });
  }, [user]);

  const handleSave = async () => {
    if (!user || !weightInput.trim()) return;
    const weight = parseFloat(weightInput);
    if (isNaN(weight) || weight < 20 || weight > 500) return;

    setSaving(true);
    const today = new Date().toISOString().split('T')[0];

    // Upsert weight
    await supabase
      .from('weight_history')
      .upsert({ user_id: user.id, weight, date: today } as any, { onConflict: 'user_id,date' });

    // Update user_goals weight
    await supabase
      .from('user_goals')
      .update({ weight_kg: weight } as any)
      .eq('user_id', user.id);

    // Trigger calorie recalculation
    try {
      await supabase.functions.invoke('recalculate-daily-calories', {});
      localStorage.removeItem(`tyana_calorie_recalc_${user.id}`);
    } catch {}

    setHistory(prev => {
      const existing = prev.findIndex(h => h.date === today);
      if (existing >= 0) {
        const copy = [...prev];
        copy[existing] = { weight, date: today };
        return copy;
      }
      return [...prev, { weight, date: today }];
    });

    toast.success(adaptive.weightUpdated || 'Weight updated. Calories recalculated ✓');
    setShowInput(false);
    setWeightInput('');
    setSaving(false);
  };

  const weightChange = history.length >= 2
    ? Math.round((history[history.length - 1].weight - history[0].weight) * 10) / 10
    : null;

  return (
    <div className="space-y-2">
      {/* Log weight button */}
      <button
        onClick={() => setShowInput(!showInput)}
        className="flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-xl border-[1.5px] border-primary text-primary"
      >
        <Scale className="w-3.5 h-3.5" />
        {adaptive.logWeight || 'Log weight'}
      </button>

      {showInput && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="flex items-center gap-2"
        >
          <input
            type="number"
            step="0.1"
            value={weightInput}
            onChange={e => setWeightInput(e.target.value)}
            placeholder={adaptive.weightKg || 'Weight (kg)'}
            className="w-24 px-3 py-2 text-sm rounded-xl border border-border bg-background text-foreground outline-none focus:border-primary"
            autoFocus
            onKeyDown={e => { if (e.key === 'Enter') handleSave(); }}
          />
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-3 py-2 text-xs font-semibold rounded-xl text-white"
            style={{ backgroundColor: '#7C3AED' }}
          >
            {(t as any).common?.save || 'Save'}
          </button>
        </motion.div>
      )}

      {/* Weight change since start */}
      {weightChange !== null && (
        <div className="flex items-center gap-1.5 text-xs">
          {weightChange < 0 ? (
            <TrendingDown className="w-3.5 h-3.5" style={{ color: '#059669' }} />
          ) : weightChange > 0 ? (
            <TrendingUp className="w-3.5 h-3.5" style={{ color: '#EA580C' }} />
          ) : null}
          <span className="text-muted-foreground">{adaptive.sinceStart || 'Since start:'}</span>
          <span
            className="font-semibold"
            style={{ color: weightChange <= 0 ? '#059669' : '#EA580C' }}
          >
            {weightChange > 0 ? '+' : ''}{weightChange} kg
          </span>
        </div>
      )}

      {/* Mini weight chart */}
      {history.length >= 3 && (
        <div className="h-12 flex items-end gap-px">
          {history.slice(-14).map((h, i, arr) => {
            const min = Math.min(...arr.map(a => a.weight));
            const max = Math.max(...arr.map(a => a.weight));
            const range = max - min || 1;
            const pct = ((h.weight - min) / range) * 100;
            return (
              <div
                key={h.date}
                className="flex-1 rounded-t-sm transition-all"
                style={{
                  height: `${Math.max(pct, 10)}%`,
                  backgroundColor: i === arr.length - 1 ? '#7C3AED' : '#DDD6FE',
                }}
                title={`${h.date}: ${h.weight}kg`}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

export default WeightTracker;
