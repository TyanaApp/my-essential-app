import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from '@/hooks/useTranslation';
import { formatMoney, getCurrencySymbol } from '@/lib/formatMoney';

const DISMISS_KEY = 'tyana_weekly_summary_dismissed';

interface WeekStats {
  avgCalories: number;
  mealsLogged: number;
  moneySaved: number;
  recipesCooked: number;
  streak: number;
}

const WeeklySummaryCard = ({ currency = 'EUR' }: { currency?: string }) => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [stats, setStats] = useState<WeekStats | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Only show on Mondays
    if (new Date().getDay() !== 1) return;
    
    const lastDismissed = localStorage.getItem(DISMISS_KEY);
    if (lastDismissed) {
      const diff = Date.now() - Number(lastDismissed);
      if (diff < 6 * 24 * 60 * 60 * 1000) {
        setDismissed(true);
        return;
      }
    }

    if (!user) return;

    const load = async () => {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - 7);
      const weekStartISO = weekStart.toISOString();

      const [mealsRes, savingsRes, recipesRes, profileRes] = await Promise.all([
        supabase.from('meal_entries').select('total_calories').eq('user_id', user.id).gte('created_at', weekStartISO),
        supabase.from('savings_log').select('amount').eq('user_id', user.id).gte('created_at', weekStartISO),
        supabase.from('meal_entries').select('id', { count: 'exact', head: true }).eq('user_id', user.id).not('recipe_id', 'is', null).gte('created_at', weekStartISO),
        supabase.from('profiles').select('streak_current').eq('user_id', user.id).maybeSingle(),
      ]);

      const meals = mealsRes.data || [];
      if (meals.length === 0) return;

      setStats({
        avgCalories: Math.round(meals.reduce((s, m) => s + (m.total_calories || 0), 0) / 7),
        mealsLogged: meals.length,
        moneySaved: (savingsRes.data || []).reduce((s, r) => s + Number(r.amount || 0), 0),
        recipesCooked: recipesRes.count || 0,
        streak: profileRes.data?.streak_current || 0,
      });
    };
    load();
  }, [user]);

  if (dismissed || !stats || new Date().getDay() !== 1) return null;

  const wt = (t as any).weeklyReport || {};
  const dismiss = () => {
    setDismissed(true);
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-4 p-4 rounded-2xl"
      style={{ backgroundColor: '#F5F3FF', boxShadow: '0 2px 12px rgba(124,58,237,0.08)' }}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold" style={{ color: '#1E1B4B' }}>
          📊 {wt.lastWeekTitle || 'Last week summary'}
        </h3>
        <button onClick={dismiss} className="p-1 rounded-full hover:bg-white/50">
          <X className="w-4 h-4" style={{ color: '#9CA3AF' }} />
        </button>
      </div>
      <div className="grid grid-cols-3 gap-2 text-center">
        {[
          { val: String(stats.avgCalories), label: wt.calDay || 'kcal/day' },
          { val: String(stats.mealsLogged), label: wt.meals || 'meals' },
          { val: `${getCurrencySymbol(currency)}${stats.moneySaved.toFixed(0)}`, label: wt.saved || 'saved' },
        ].map((item, i) => (
          <div key={i} className="p-2 rounded-xl" style={{ backgroundColor: 'white' }}>
            <p className="text-lg font-bold" style={{ color: '#7C3AED' }}>{item.val}</p>
            <p className="text-[10px]" style={{ color: '#6B7280' }}>{item.label}</p>
          </div>
        ))}
      </div>
      {stats.streak > 0 && (
        <p className="text-center text-xs mt-2" style={{ color: '#7C3AED' }}>
          🔥 {stats.streak} {wt.streakDays || 'days streak'}
        </p>
      )}
    </motion.div>
  );
};

export default WeeklySummaryCard;
