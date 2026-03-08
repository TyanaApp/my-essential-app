import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useTranslation } from '@/hooks/useTranslation';
import { usePageTitle } from '@/hooks/usePageTitle';
import { Progress } from '@/components/ui/progress';

const NutritionAnalysis = () => {
  const { user } = useAuth();
  const { t, language } = useTranslation();
  const navigate = useNavigate();
  const tr = (t as any).nutritionAdvice || {};
  usePageTitle(tr.fullAnalysis || 'Nutrition Analysis');

  const [analysis, setAnalysis] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [macros, setMacros] = useState<{ protein: number; fat: number; carbs: number; calories: number; targets: { protein: number; fat: number; carbs: number; calories: number } }>({
    protein: 0, fat: 0, carbs: 0, calories: 0,
    targets: { protein: 120, fat: 60, carbs: 250, calories: 2000 },
  });

  const fetchAnalysis = async () => {
    if (!user) return;
    setLoading(true);

    try {
      const today = new Date().toISOString().split('T')[0];
      const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];

      const [profileRes, goalsRes, todayMealsRes, weekMealsRes, inventoryRes] = await Promise.all([
        supabase.from('profiles').select('gender').eq('user_id', user.id).maybeSingle(),
        supabase.from('user_goals').select('*').eq('user_id', user.id).maybeSingle(),
        supabase.from('meal_entries').select('*').eq('user_id', user.id).eq('date', today),
        supabase.from('meal_entries').select('total_calories, total_protein, total_fat, total_carbs').eq('user_id', user.id).gte('date', weekAgo),
        supabase.from('inventory_items').select('name').eq('user_id', user.id).limit(10),
      ]);

      const goals = goalsRes.data || {};
      const todayMeals = todayMealsRes.data || [];
      const weekMeals = weekMealsRes.data || [];

      const avgCalories = weekMeals.length ? Math.round(weekMeals.reduce((s, m) => s + (m.total_calories || 0), 0) / Math.max(weekMeals.length, 1)) : 0;
      const avgProtein = weekMeals.length ? Math.round(weekMeals.reduce((s, m) => s + Number(m.total_protein || 0), 0) / Math.max(weekMeals.length, 1)) : 0;
      const avgFat = weekMeals.length ? Math.round(weekMeals.reduce((s, m) => s + Number(m.total_fat || 0), 0) / Math.max(weekMeals.length, 1)) : 0;
      const avgCarbs = weekMeals.length ? Math.round(weekMeals.reduce((s, m) => s + Number(m.total_carbs || 0), 0) / Math.max(weekMeals.length, 1)) : 0;

      const todayTotals = todayMeals.reduce((acc, m) => ({
        calories: acc.calories + (m.total_calories || 0),
        protein: acc.protein + Number(m.total_protein || 0),
        fat: acc.fat + Number(m.total_fat || 0),
        carbs: acc.carbs + Number(m.total_carbs || 0),
      }), { calories: 0, protein: 0, fat: 0, carbs: 0 });

      // Calculate macro targets
      const weight = Number((goals as any)?.weight_kg) || 70;
      const caloriesTarget = (goals as any)?.daily_calories_target || 2000;
      const userGoals: string[] = (goals as any)?.goals || [];
      const macroTargets = calcMacroTargets(weight, caloriesTarget, userGoals);

      setMacros({
        ...todayTotals,
        targets: { ...macroTargets, calories: caloriesTarget },
      });

      const { data: adviceData } = await supabase.functions.invoke('nutrition-advice', {
        body: {
          userProfile: { weight_kg: (goals as any)?.weight_kg, height_cm: (goals as any)?.height_cm, age: (goals as any)?.age, activity_level: (goals as any)?.activity_level },
          todayMeals: todayMeals.map(m => ({ name: m.custom_name, calories: m.total_calories, protein: m.total_protein, fat: m.total_fat, carbs: m.total_carbs })),
          weekMeals: { avgCalories, avgProtein, avgFat, avgCarbs },
          inventory: inventoryRes.data || [],
          userGoals: goals,
          language,
          mode: 'full',
        },
      });

      setAnalysis(adviceData?.advice || tr.errorLoading || 'Could not load analysis');
    } catch (e) {
      console.error('Analysis error:', e);
      setAnalysis(tr.errorLoading || 'Could not load analysis');
    }
    setLoading(false);
  };

  useEffect(() => { fetchAnalysis(); }, [user]);

  const macroColor = (value: number, target: number) => {
    if (target === 0) return '#6B7280';
    const ratio = value / target;
    if (ratio > 1.15) return '#DC2626';
    if (ratio >= 0.7) return '#059669';
    return '#EA580C';
  };

  const macroItems = [
    { label: tr.protein || 'Protein', value: Math.round(macros.protein), target: macros.targets.protein, color: '#059669' },
    { label: tr.fat || 'Fat', value: Math.round(macros.fat), target: macros.targets.fat, color: '#EA580C' },
    { label: tr.carbs || 'Carbs', value: Math.round(macros.carbs), target: macros.targets.carbs, color: '#2563EB' },
  ];

  return (
    <div className="min-h-screen p-6 pb-mobile-safe">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl" style={{ backgroundColor: '#F5F3FF' }}>
          <ArrowLeft className="w-5 h-5" style={{ color: '#7C3AED' }} />
        </button>
        <h1 className="text-xl font-bold text-foreground">
          🧠 {tr.fullAnalysis || 'Nutrition Analysis'}
        </h1>
      </div>

      {/* Macro progress bars */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-2xl p-5 mb-4" style={{ boxShadow: '0 2px 16px rgba(124,58,237,0.08)' }}>
        <h3 className="text-sm font-bold mb-3 text-foreground">
          📊 {tr.todayMacros || "Today's macros"}
        </h3>
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span style={{ color: '#6B7280' }}>{tr.calories || 'Calories'}</span>
              <span className="font-bold" style={{ color: macroColor(macros.calories, macros.targets.calories) }}>
                {macros.calories} / {macros.targets.calories} kcal
              </span>
            </div>
            <div className="h-2 rounded-full" style={{ backgroundColor: '#F3F4F6' }}>
              <div className="h-full rounded-full transition-all duration-500" style={{ backgroundColor: macroColor(macros.calories, macros.targets.calories), width: `${Math.min((macros.calories / macros.targets.calories) * 100, 100)}%` }} />
            </div>
          </div>
          {macroItems.map(m => (
            <div key={m.label}>
              <div className="flex justify-between text-xs mb-1">
                <span style={{ color: '#6B7280' }}>{m.label}</span>
                <span className="font-bold" style={{ color: macroColor(m.value, m.target) }}>
                  {m.value} / {m.target}g
                </span>
              </div>
              <div className="h-2 rounded-full" style={{ backgroundColor: '#F3F4F6' }}>
                <div className="h-full rounded-full transition-all duration-500" style={{ backgroundColor: macroColor(m.value, m.target), width: `${Math.min((m.value / m.target) * 100, 100)}%` }} />
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* AI Analysis */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-card rounded-2xl p-5 mb-4" style={{ boxShadow: '0 2px 16px rgba(124,58,237,0.08)', borderLeft: '4px solid #7C3AED' }}>
        {loading ? (
          <div className="flex flex-col items-center py-8 gap-3">
            <div className="w-7 h-7 border-[3px] rounded-full animate-spin" style={{ borderColor: '#EDE9FE', borderTopColor: '#7C3AED' }} />
            <span className="text-sm" style={{ color: '#9CA3AF' }}>{tr.analyzing || 'Analyzing your data...'}</span>
          </div>
        ) : (
          <div className="space-y-4">
            {analysis.split('\n').map((line, i) => {
              const trimmed = line.trim();
              if (!trimmed) return null;
              const isHeader = /^(📊|✅|⚠️|🍽|📈)/.test(trimmed);
              if (isHeader) {
                  return (
                    <h3 key={i} className="text-base font-bold mt-3 text-foreground">
                    {trimmed}
                  </h3>
                );
              }
              return (
                <p key={i} className="text-sm leading-relaxed" style={{ color: '#374151' }}>
                  {trimmed}
                </p>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* Refresh button */}
      <button
        onClick={fetchAnalysis}
        disabled={loading}
        className="w-full py-3 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2"
        style={{ backgroundColor: '#7C3AED', color: 'white', opacity: loading ? 0.5 : 1 }}
      >
        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        {tr.refreshAnalysis || 'Refresh analysis'}
      </button>
    </div>
  );
};

export function calcMacroTargets(weightKg: number, caloriesTarget: number, goals: string[]) {
  let proteinPerKg = 1.6;
  let fatPct = 0.3;

  if (goals.includes('lose_weight')) {
    proteinPerKg = 2.0;
    fatPct = 0.25;
  } else if (goals.includes('gain_muscle')) {
    proteinPerKg = 2.2;
    fatPct = 0.3;
  }

  const protein = Math.round(weightKg * proteinPerKg);
  const fat = Math.round((caloriesTarget * fatPct) / 9);
  const carbs = Math.round((caloriesTarget - protein * 4 - fat * 9) / 4);

  return { protein, fat, carbs: Math.max(carbs, 0) };
}

export default NutritionAnalysis;
