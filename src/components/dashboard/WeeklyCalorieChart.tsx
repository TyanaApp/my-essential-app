import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from '@/hooks/useTranslation';

const WeeklyCalorieChart = () => {
  const { user } = useAuth();
  const { t, language } = useTranslation();
  const adaptive = (t as any).adaptive || {};
  const [weekData, setWeekData] = useState<{ date: string; eaten: number; target: number; label: string }[]>([]);

  useEffect(() => {
    if (!user) return;

    const load = async () => {
      const days: { date: string; label: string }[] = [];
      const dayNames = language === 'ru' ? ['Вс','Пн','Вт','Ср','Чт','Пт','Сб'] :
                        language === 'uk' ? ['Нд','Пн','Вт','Ср','Чт','Пт','Сб'] :
                        language === 'lv' ? ['Sv','P','O','T','C','Pk','S'] :
                        ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        days.push({
          date: d.toISOString().split('T')[0],
          label: dayNames[d.getDay()],
        });
      }

      const weekAgo = days[0].date;
      const [mealsRes, historyRes, goalsRes] = await Promise.all([
        supabase.from('meal_entries')
          .select('date, total_calories')
          .eq('user_id', user.id)
          .gte('date', weekAgo),
        supabase.from('calorie_history')
          .select('date, target')
          .eq('user_id', user.id)
          .gte('date', weekAgo),
        supabase.from('user_goals')
          .select('daily_calories_target')
          .eq('user_id', user.id)
          .maybeSingle(),
      ]);

      const defaultTarget = goalsRes.data?.daily_calories_target || 2000;
      const mealsByDate: Record<string, number> = {};
      const targetsByDate: Record<string, number> = {};

      (mealsRes.data || []).forEach((m: any) => {
        mealsByDate[m.date] = (mealsByDate[m.date] || 0) + (m.total_calories || 0);
      });
      (historyRes.data || []).forEach((h: any) => {
        targetsByDate[h.date] = h.target;
      });

      setWeekData(days.map(d => ({
        date: d.date,
        label: d.label,
        eaten: mealsByDate[d.date] || 0,
        target: targetsByDate[d.date] || defaultTarget,
      })));
    };

    load();
  }, [user, language]);

  const maxVal = useMemo(() => {
    if (weekData.length === 0) return 2500;
    return Math.max(...weekData.map(d => Math.max(d.eaten, d.target)), 1500);
  }, [weekData]);

  if (weekData.length === 0) return null;

  const barColor = (eaten: number, target: number) => {
    if (target === 0) return '#6B7280';
    const ratio = eaten / target;
    if (ratio > 1.1) return '#DC2626';
    if (ratio >= 0.9) return '#059669';
    return '#EA580C';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="bg-card rounded-2xl p-5 mb-4"
      style={{ boxShadow: '0 2px 16px rgba(124,58,237,0.08)' }}
    >
      <h3 className="text-sm font-bold mb-4 text-foreground">
        📊 {adaptive.weeklyChart || 'Weekly calories'}
      </h3>

      <div className="flex items-end gap-1.5 h-32">
        {weekData.map((d) => {
          const eatenH = maxVal > 0 ? (d.eaten / maxVal) * 100 : 0;
          const targetH = maxVal > 0 ? (d.target / maxVal) * 100 : 0;
          return (
            <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full relative flex items-end justify-center gap-0.5" style={{ height: 100 }}>
                {/* Target line */}
                <div
                  className="absolute left-0 right-0 border-t border-dashed border-primary/30"
                  style={{ bottom: `${targetH}%` }}
                />
                {/* Eaten bar */}
                <div
                  className="w-full rounded-t-md transition-all duration-300"
                  style={{
                    height: `${Math.max(eatenH, 2)}%`,
                    backgroundColor: barColor(d.eaten, d.target),
                    minHeight: d.eaten > 0 ? 4 : 2,
                  }}
                />
              </div>
              <span className="text-[9px] text-muted-foreground">{d.label}</span>
              {d.eaten > 0 && (
                <span className="text-[8px] font-medium text-foreground/60">{d.eaten}</span>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-4 mt-3 text-[10px] text-muted-foreground">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: '#059669' }} />
          {adaptive.eaten || 'Eaten'}
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 border-t border-dashed border-primary/30" />
          {adaptive.target || 'Target'}
        </div>
      </div>
    </motion.div>
  );
};

export default WeeklyCalorieChart;
