import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Info } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from '@/hooks/useTranslation';

interface CalorieTargetData {
  target: number;
  base_tdee: number;
  adjustment: number;
  avg_last_7_days: number;
  change: number;
  day_type: string;
  goal_adjustment: number;
}

const CalorieTargetCard = () => {
  const { user } = useAuth();
  const { t, language } = useTranslation();
  const [data, setData] = useState<CalorieTargetData | null>(null);
  const [expanded, setExpanded] = useState(false);
  const adaptive = (t as any).adaptive || {};

  useEffect(() => {
    if (!user) return;

    const recalculate = async () => {
      const cacheKey = `tyana_calorie_recalc_${user.id}`;
      const cached = localStorage.getItem(cacheKey);
      const today = new Date().toISOString().split('T')[0];

      if (cached) {
        try {
          const { date, data: cachedData } = JSON.parse(cached);
          if (date === today) {
            setData(cachedData);
            return;
          }
        } catch {}
      }

      try {
        const { data: result, error } = await supabase.functions.invoke('recalculate-daily-calories', {});
        if (!error && result && result.target) {
          setData(result);
          localStorage.setItem(cacheKey, JSON.stringify({ date: today, data: result }));
        }
      } catch (e) {
        console.error('Calorie recalculation error:', e);
      }
    };

    recalculate();
  }, [user]);

  if (!data) return null;

  const goalLabel = data.goal_adjustment < 0
    ? (adaptive.loseWeight || 'weight loss')
    : data.goal_adjustment > 0
      ? (adaptive.gainMuscle || 'muscle gain')
      : null;

  const dayLabel = data.day_type === 'weekend'
    ? (adaptive.weekend || 'weekend')
    : data.day_type === 'monday'
      ? (adaptive.monday || 'Monday recovery')
      : (adaptive.weekday || 'weekday');

  return (
    <div className="mt-2">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <Info className="w-3 h-3" />
        <span>{(adaptive.todayTarget || '🎯 Your goal today: {target} kcal').replace('{target}', String(data.target))}</span>
        {data.change !== 0 && (
          <span
            className="font-semibold ml-1"
            style={{ color: data.change > 0 ? '#059669' : '#EA580C' }}
          >
            {data.change > 0
              ? (adaptive.changeUp || '↑ +{change} kcal').replace('{change}', String(data.change))
              : (adaptive.changeDown || '↓ -{change} kcal').replace('{change}', String(Math.abs(data.change)))}
          </span>
        )}
        <ChevronDown className={`w-3 h-3 transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-3 p-3 rounded-xl bg-secondary/50 text-xs space-y-1.5">
              <p className="font-semibold text-foreground mb-2">{adaptive.howCalculated || 'How is your goal calculated:'}</p>

              <div className="flex justify-between">
                <span className="text-muted-foreground">{adaptive.baseTDEE || 'Base (TDEE)'}</span>
                <span className="font-medium text-foreground">{data.base_tdee} kcal</span>
              </div>

              {data.goal_adjustment !== 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{adaptive.goalAdj || 'Goal adjustment'} ({goalLabel})</span>
                  <span className="font-medium" style={{ color: data.goal_adjustment < 0 ? '#EA580C' : '#059669' }}>
                    {data.goal_adjustment > 0 ? '+' : ''}{data.goal_adjustment} kcal
                  </span>
                </div>
              )}

              {data.adjustment !== 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{adaptive.dayAdj || 'Day adjustment'} ({dayLabel})</span>
                  <span className="font-medium" style={{ color: data.adjustment > 0 ? '#059669' : '#EA580C' }}>
                    {data.adjustment > 0 ? '+' : ''}{data.adjustment} kcal
                  </span>
                </div>
              )}

              {data.avg_last_7_days > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{adaptive.avg7Days || 'Your 7-day avg'}</span>
                  <span className="font-medium text-foreground">{data.avg_last_7_days} kcal</span>
                </div>
              )}

              <div className="border-t border-border my-1.5" />

              <div className="flex justify-between font-semibold">
                <span className="text-foreground">{adaptive.todayTargetLabel || "Today's target"}</span>
                <span className="text-primary">{data.target} kcal</span>
              </div>

              <p className="text-[10px] text-muted-foreground/70 mt-1">
                {adaptive.recalcNote || 'Recalculated automatically every day'}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CalorieTargetCard;
