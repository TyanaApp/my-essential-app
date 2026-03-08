import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Plus, ChevronRight, AlertTriangle, Check, Sparkles, Brain, RefreshCw } from 'lucide-react';
import CalorieTargetCard from '@/components/dashboard/CalorieTargetCard';
import EatingInsightsCard from '@/components/dashboard/EatingInsightsCard';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useSubscription } from '@/hooks/useSubscription';
import { usePageTitle } from '@/hooks/usePageTitle';
import SkeletonCard from '@/components/SkeletonCard';
import NotificationBanner from '@/components/NotificationBanner';
import FamilyWidget from '@/components/dashboard/FamilyWidget';
import WeeklySummaryCard from '@/components/dashboard/WeeklySummaryCard';
import { useTranslation } from '@/hooks/useTranslation';
import { formatMoney, getCurrencySymbol } from '@/lib/formatMoney';
import EditProfileModal from '@/components/profile/EditProfileModal';

// Russian pluralization helper
const pluralizeRu = (n: number, one: string, few: string, many: string) => {
  const abs = Math.abs(n);
  if (abs % 10 === 1 && abs % 100 !== 11) return one;
  if ([2, 3, 4].includes(abs % 10) && ![12, 13, 14].includes(abs % 100)) return few;
  return many;
};

interface ExpiringItem {
  id: string;
  name: string;
  days: number;
  suggestion?: string;
  action?: 'use' | 'use_or_discard' | 'discard';
}

interface DashboardData {
  displayName: string;
  caloriesConsumed: number;
  caloriesTarget: number;
  protein: number;
  fat: number;
  carbs: number;
  expiringItems: ExpiringItem[];
  recentRecipes: { id: string; title: string; prepTime: number | null; estimatedCost: number | null }[];
  spentThisMonth: number;
  savedThisMonth: number;
  monthlyBudget: number;
  currency: string;
  useItUpRecipe: { id: string; title: string; matchCount: number } | null;
  inventoryCount: number;
  streakCurrent: number;
  streakLongest: number;
  missingBodyData: boolean;
}

const MealPlanWidget = ({ t, language, navigate, fadeUp, cardClass }: any) => {
  const mp = (t as any).mealPlan || {};
  const { user } = useAuth();
  const [todayMeals, setTodayMeals] = useState<any[] | null>(null);
  const [hasPlan, setHasPlan] = useState(false);

  useEffect(() => {
    if (!user) return;
    const loadTodayPlan = async () => {
      const { data } = await supabase
        .from('meal_plans')
        .select('plan_data')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data?.plan_data) {
        setHasPlan(true);
        const today = new Date().toISOString().split('T')[0];
        const dayPlan = (data.plan_data as any)?.days?.find((d: any) => d.date === today);
        if (dayPlan?.meals) {
          const meals = ['breakfast', 'lunch', 'dinner', 'snack']
            .map(type => dayPlan.meals[type] ? { type, ...dayPlan.meals[type] } : null)
            .filter(Boolean);
          setTodayMeals(meals);
        }
      }
    };
    loadTodayPlan();
  }, [user]);

  return (
    <motion.div {...fadeUp(3.5)} className={`${cardClass} p-5`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
          📅 {hasPlan ? (mp.dashboardTitle || "Today's plan") : (mp.dashboardEmpty || 'Create your weekly meal plan')}
        </h3>
        <button
          onClick={() => navigate('/recipes?tab=plan')}
          className="text-xs font-medium flex items-center gap-0.5 text-primary"
        >
          {hasPlan ? (mp.dashboardOpen || 'Open plan →') : (mp.dashboardBtn || 'Create →')}
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
      {todayMeals && todayMeals.length > 0 ? (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {todayMeals.map((meal: any, i: number) => (
            <div key={i} className="flex items-center gap-1.5 px-2.5 py-1.5 bg-secondary rounded-lg text-xs font-medium text-foreground shrink-0">
              <span>{meal.emoji || '🍽'}</span>
              <span className="max-w-[100px] truncate">{meal.name}</span>
            </div>
          ))}
        </div>
      ) : hasPlan ? (
        <p className="text-xs text-muted-foreground">{mp.dashboardOpen || 'Open plan →'}</p>
      ) : (
        <p className="text-xs text-muted-foreground">{mp.emptySubtitle || 'TYANA will pick meals based on your goals'}</p>
      )}
    </motion.div>
  );
};

const Dashboard = () => {
  const { user } = useAuth();
  const { t, language } = useTranslation();
  usePageTitle(t.nav.home);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { checkSubscription } = useSubscription();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingBudget, setEditingBudget] = useState(false);
  const [budgetInput, setBudgetInput] = useState('');
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [advice, setAdvice] = useState<string>('');
  const [adviceLoading, setAdviceLoading] = useState(false);
  const [adviceGeneratedAt, setAdviceGeneratedAt] = useState<string | null>(null);
  const [adviceFading, setAdviceFading] = useState(false);
  const [lastCaloriesForAdvice, setLastCaloriesForAdvice] = useState<number>(0);
  const [zeroWasteTip, setZeroWasteTip] = useState<{ tip: string; emoji: string; title: string; category: string; product: string; confidence?: string; based_on?: string; why_valuable?: string } | null>(null);
  const [tipLoading, setTipLoading] = useState(false);

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return t.dashboard.morning;
    if (h < 18) return t.dashboard.afternoon;
    return t.dashboard.evening;
  };

  const formatDate = () => {
    const locale = language === 'ru' ? 'ru-RU' : language === 'lv' ? 'lv-LV' : language === 'uk' ? 'uk-UA' : 'en-US';
    return new Date().toLocaleDateString(locale, {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
  };

  // Handle upgrade success
  useEffect(() => {
    if (searchParams.get('upgrade') === 'success') {
      const planName = searchParams.get('plan') || 'Pro';
      toast.success(t.dashboard.upgradeSuccess.replace('{plan}', planName));
      checkSubscription();
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams, checkSubscription]);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const today = new Date().toISOString().split('T')[0];
      const threeDaysFromNow = new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0];
      const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

      const [profileRes, goalsRes, mealsRes, expiringRes, recipesRes, savingsRes, inventoryCountRes] = await Promise.all([
        supabase.from('profiles').select('display_name, currency, streak_current, streak_longest, gender').eq('user_id', user.id).maybeSingle(),
        supabase.from('user_goals').select('daily_calories_target, monthly_budget, weight_kg, height_cm, age, activity_level, goals').eq('user_id', user.id).maybeSingle(),
        supabase.from('meal_entries').select('total_calories, total_protein, total_fat, total_carbs').eq('user_id', user.id).eq('date', today),
        supabase.from('inventory_items').select('id, name, expires_at').eq('user_id', user.id).not('expires_at', 'is', null).lte('expires_at', threeDaysFromNow).order('expires_at', { ascending: true }).limit(10),
        supabase.from('recipes').select('id, title, prep_time, estimated_cost, ingredients').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20),
        supabase.from('savings_log').select('amount, type').eq('user_id', user.id).gte('created_at', monthStart),
        supabase.from('inventory_items').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
      ]);

      // Filter out corrupted meal entries (single meal > 3000 kcal is flagged as error)
      const validMeals = (mealsRes.data || []).filter(m => {
        const cal = Number(m.total_calories || 0);
        const prot = Number(m.total_protein || 0);
        const fatVal = Number(m.total_fat || 0);
        const carbVal = Number(m.total_carbs || 0);
        if (cal > 3000 || prot > 500 || fatVal > 500 || carbVal > 1000) {
          console.warn('Excluded corrupted meal entry:', m);
          return false;
        }
        return true;
      });
      const caloriesConsumed = validMeals.reduce((s, m) => s + (Number(m.total_calories) || 0), 0);
      const protein = validMeals.reduce((s, m) => s + (Number(m.total_protein) || 0), 0);
      const fat = validMeals.reduce((s, m) => s + (Number(m.total_fat) || 0), 0);
      const carbs = validMeals.reduce((s, m) => s + (Number(m.total_carbs) || 0), 0);

      const expiringItems = (expiringRes.data || []).map((i: any) => ({
        id: i.id,
        name: i.name,
        days: Math.ceil((new Date(i.expires_at).getTime() - Date.now()) / 86400000),
      }));

      const savingsLogs = savingsRes.data || [];
      const spentThisMonth = savingsLogs.filter((r: any) => r.type === 'purchase').reduce((s: number, r: any) => s + Math.abs(Number(r.amount || 0)), 0);
      const savedThisMonth = savingsLogs.filter((r: any) => r.type === 'saved' || r.type === 'waste_prevented').reduce((s: number, r: any) => s + Number(r.amount || 0), 0);

      // Find "use it up" recipe
      let useItUpRecipe: DashboardData['useItUpRecipe'] = null;
      if (expiringItems.length > 0 && recipesRes.data && recipesRes.data.length > 0) {
        const expiringNames = expiringItems.map(i => i.name.toLowerCase());
        let bestMatch = { id: '', title: '', matchCount: 0 };
        
        for (const recipe of recipesRes.data) {
          if (!recipe.ingredients) continue;
          const ingredients = Array.isArray(recipe.ingredients)
            ? recipe.ingredients
            : typeof recipe.ingredients === 'object'
              ? Object.values(recipe.ingredients)
              : [];
          
          let matchCount = 0;
          for (const ing of ingredients) {
            const ingName = typeof ing === 'string' ? ing.toLowerCase() : (ing as any)?.name?.toLowerCase() || '';
            if (expiringNames.some(en => ingName.includes(en) || en.includes(ingName))) {
              matchCount++;
            }
          }
          if (matchCount > bestMatch.matchCount) {
            bestMatch = { id: recipe.id, title: recipe.title, matchCount };
          }
        }
        if (bestMatch.matchCount > 0) {
          useItUpRecipe = bestMatch;
        }
      }

      // Calculate personal calorie target
      const goalsData = goalsRes.data;
      const profileData = profileRes.data;
      let caloriesTarget = goalsData?.daily_calories_target || 0;
      const weight = Number(goalsData?.weight_kg) || 0;
      const height = Number(goalsData?.height_cm) || 0;
      const userAge = Number(goalsData?.age) || 0;
      const gender = profileData?.gender || '';
      const activity = (goalsData as any)?.activity_level || 'normal';
      const userGoals: string[] = (goalsData as any)?.goals || [];
      const missingBodyData = !weight || !height || !userAge;

      if (!caloriesTarget && weight && height && userAge) {
        const activityMultiplier: Record<string, number> = {
          low: 1.2, normal: 1.375, moderate: 1.375, active: 1.55, very_active: 1.725,
        };
        const mult = activityMultiplier[activity] || 1.375;
        const BMR = gender === 'male'
          ? 10 * weight + 6.25 * height - 5 * userAge + 5
          : 10 * weight + 6.25 * height - 5 * userAge - 161;
        let TDEE = BMR * mult;
        if (userGoals.includes('lose_weight')) TDEE -= 400;
        if (userGoals.includes('gain_muscle')) TDEE += 300;
        caloriesTarget = Math.round(TDEE);

        if (goalsData) {
          supabase.from('user_goals').update({ daily_calories_target: caloriesTarget } as any).eq('user_id', user.id).then(() => {});
        }
      }

      if (!caloriesTarget) caloriesTarget = 2000;

      setData({
        displayName: profileData?.display_name || user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'there',
        caloriesConsumed,
        caloriesTarget,
        protein: Math.round(protein),
        fat: Math.round(fat),
        carbs: Math.round(carbs),
        expiringItems,
        recentRecipes: (recipesRes.data || []).slice(0, 3) as any,
        spentThisMonth,
        savedThisMonth,
        monthlyBudget: Number(goalsData?.monthly_budget) || 200,
        currency: profileData?.currency || 'EUR',
        useItUpRecipe,
        inventoryCount: inventoryCountRes.count || 0,
        streakCurrent: (profileData as any)?.streak_current || 0,
        streakLongest: (profileData as any)?.streak_longest || 0,
        missingBodyData,
      });
      setLoading(false);

      // Fetch AI suggestions for expiring items
      if (expiringItems.length > 0) {
        setLoadingSuggestions(true);
        try {
          const { data: sugData } = await supabase.functions.invoke('expiring-suggestions', {
            body: { items: expiringItems, language },
          });
          if (sugData?.suggestions && Array.isArray(sugData.suggestions)) {
            setData(prev => {
              if (!prev) return prev;
              const updated = prev.expiringItems.map(item => {
                const sug = sugData.suggestions.find((s: any) => 
                  s.name?.toLowerCase() === item.name.toLowerCase()
                );
                return sug ? { ...item, suggestion: sug.suggestion, action: sug.action } : item;
              });
              return { ...prev, expiringItems: updated };
            });
          }
        } catch (e) {
          console.error('Suggestions error:', e);
        }
        setLoadingSuggestions(false);
      }
    };
    load();
  }, [user]);

  // Fetch AI advice
  const fetchAdvice = useCallback(async (force = false) => {
    if (!user || !data) return;
    const cacheKey = `tyana_advice_${user.id}`;

    if (!force) {
      try {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          const { text, generatedAt } = JSON.parse(cached);
          if (generatedAt) {
            const ageMs = Date.now() - new Date(generatedAt).getTime();
            if (ageMs < 3 * 60 * 60 * 1000) {
              setAdvice(text);
              setAdviceGeneratedAt(generatedAt);
              setLastCaloriesForAdvice(data.caloriesConsumed);
              return;
            }
          }
        }
      } catch {}
    }

    if (force) {
      setAdviceFading(true);
      await new Promise(r => setTimeout(r, 300));
    }

    setAdviceLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
      const [todayMealsRes, weekMealsRes, inventoryRes, goalsRes, profileRes2] = await Promise.all([
        supabase.from('meal_entries').select('custom_name, meal_type, total_calories, total_protein, total_fat, total_carbs').eq('user_id', user.id).eq('date', today),
        supabase.from('meal_entries').select('total_calories, total_protein, total_fat, total_carbs').eq('user_id', user.id).gte('date', weekAgo),
        supabase.from('inventory_items').select('name').eq('user_id', user.id).limit(15),
        supabase.from('user_goals').select('*').eq('user_id', user.id).maybeSingle(),
        supabase.from('profiles').select('gender').eq('user_id', user.id).maybeSingle(),
      ]);

      const wm = weekMealsRes.data || [];
      const weekLen = Math.max(wm.length, 1);

      const { data: adviceData } = await supabase.functions.invoke('nutrition-advice', {
        body: {
          userProfile: {
            weight_kg: goalsRes.data?.weight_kg,
            height_cm: goalsRes.data?.height_cm,
            age: goalsRes.data?.age,
            activity_level: goalsRes.data?.activity_level,
            gender: profileRes2.data?.gender,
          },
          todayMeals: (todayMealsRes.data || []).map(m => ({
            name: m.custom_name, meal_type: m.meal_type,
            calories: m.total_calories, protein: m.total_protein, fat: m.total_fat, carbs: m.total_carbs,
          })),
          weekMeals: {
            avgCalories: Math.round(wm.reduce((s, m) => s + (m.total_calories || 0), 0) / weekLen),
            avgProtein: Math.round(wm.reduce((s, m) => s + Number(m.total_protein || 0), 0) / weekLen),
            avgFat: Math.round(wm.reduce((s, m) => s + Number(m.total_fat || 0), 0) / weekLen),
            avgCarbs: Math.round(wm.reduce((s, m) => s + Number(m.total_carbs || 0), 0) / weekLen),
          },
          inventory: inventoryRes.data || [],
          userGoals: goalsRes.data || {},
          language,
          mode: 'tip',
        },
      });

      if (adviceData?.advice) {
        const genAt = adviceData.generatedAt || new Date().toISOString();
        setAdvice(adviceData.advice);
        setAdviceGeneratedAt(genAt);
        setLastCaloriesForAdvice(data.caloriesConsumed);
        localStorage.setItem(cacheKey, JSON.stringify({ text: adviceData.advice, generatedAt: genAt }));
      }
    } catch (e) {
      console.error('Advice fetch error:', e);
    }
    setAdviceLoading(false);
    setAdviceFading(false);
  }, [user, data, language]);

  useEffect(() => {
    if (user && data) fetchAdvice();
  }, [user, data, fetchAdvice]);

  // Auto-refresh advice when calories change significantly (±200 kcal)
  useEffect(() => {
    if (!data || !advice || adviceLoading) return;
    const diff = Math.abs(data.caloriesConsumed - lastCaloriesForAdvice);
    if (diff >= 200) {
      const timer = setTimeout(() => fetchAdvice(true), 2000);
      return () => clearTimeout(timer);
    }
  }, [data?.caloriesConsumed, lastCaloriesForAdvice, advice, adviceLoading, fetchAdvice]);

  // Zero waste tip with daily cache
  const fetchZeroWasteTip = useCallback(async (force = false) => {
    if (!user) return;
    const cacheKey = `tyana_zwt_${user.id}`;
    if (!force) {
      try {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          const { date, data: tipData } = JSON.parse(cached);
          if (date === new Date().toISOString().split('T')[0]) {
            setZeroWasteTip(tipData);
            return;
          }
        }
      } catch {}
    }
    setTipLoading(true);
    try {
      const [invRes, mealsRes] = await Promise.all([
        supabase.from('inventory_items').select('name, expires_at, quantity, unit, storage_location').eq('user_id', user.id).limit(30),
        supabase.from('meal_entries').select('custom_name').eq('user_id', user.id).eq('date', new Date().toISOString().split('T')[0]),
      ]);
      const { data: tipData } = await supabase.functions.invoke('zero-waste-tip', {
        body: { inventory: invRes.data || [], recentMeals: mealsRes.data || [], language },
      });
      if (tipData && tipData.tip && tipData.confidence !== 'low') {
        setZeroWasteTip(tipData);
        localStorage.setItem(cacheKey, JSON.stringify({ date: new Date().toISOString().split('T')[0], data: tipData }));
      } else {
        setZeroWasteTip(null);
      }
    } catch (e) {
      console.error('Zero waste tip error:', e);
    }
    setTipLoading(false);
  }, [user, language]);

  useEffect(() => {
    if (user && data) fetchZeroWasteTip();
  }, [user, data, fetchZeroWasteTip]);

  if (loading) {
    return (
      <div className="min-h-screen p-6 pb-mobile-safe space-y-4">
        <SkeletonCard lines={2} />
        <SkeletonCard lines={5} />
        <SkeletonCard lines={3} />
        <SkeletonCard lines={3} />
        <SkeletonCard lines={2} />
      </div>
    );
  }

  const currSymbol = getCurrencySymbol(data?.currency || 'EUR');

  const saveBudget = async () => {
    if (!user) return;
    const val = parseFloat(budgetInput) || 200;
    await supabase.from('user_goals').update({ monthly_budget: val } as any).eq('user_id', user.id);
    setData(prev => prev ? { ...prev, monthlyBudget: val } : prev);
    setEditingBudget(false);
    toast.success(language === 'ru' ? 'Бюджет обновлён ✓' : language === 'uk' ? 'Бюджет оновлено ✓' : language === 'lv' ? 'Budžets atjaunināts ✓' : 'Budget updated ✓');
  };

  const saveCurrency = async (code: string) => {
    if (!user) return;
    await supabase.from('profiles').update({ currency: code } as any).eq('user_id', user.id);
    setData(prev => prev ? { ...prev, currency: code } : prev);
    setShowCurrencyPicker(false);
    toast.success(`${code} ✓`);
  };

   if (!data) return null;

  const caloriesConsumed = data.caloriesConsumed;
  const remaining = data.caloriesTarget - caloriesConsumed;
  const pct = Math.min(data.caloriesConsumed / data.caloriesTarget, 1);
  const circumference = 2 * Math.PI * 72;
  const strokeDashoffset = circumference * (1 - pct);

  const cardClass = "bg-card rounded-[20px] shadow-[0_2px_16px_rgba(124,58,237,0.08)]";

  const fadeUp = (i: number) => ({
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.3, delay: i * 0.1 },
  });

  return (
    <div className="min-h-screen p-6 pb-mobile-safe">
      {/* Notification opt-in banner */}
      <NotificationBanner />

      {/* Greeting */}
      <motion.div {...fadeUp(0)} className="mb-6">
        <h2 className="text-2xl font-bold text-foreground">
          {getGreeting()}, {data.displayName}! 👋
        </h2>
        <p className="text-sm mt-0.5 text-muted-foreground">{formatDate()}</p>
      </motion.div>

      {/* Family widget */}
      <FamilyWidget />
      <WeeklySummaryCard currency={data.currency} />

      {/* Streak card */}
      {data.streakCurrent > 0 && (
        <motion.div {...fadeUp(0.5)} className="mb-4">
          <button
            onClick={() => navigate('/achievements')}
            className={`${cardClass} w-full p-4 flex items-center gap-3 text-left`}
          >
            <span className="text-2xl">🔥</span>
            <div className="flex-1">
              <p className="text-base font-bold text-foreground">
                {data.streakCurrent} {(t as any).streak?.daysInRow || 'days in a row'}
              </p>
              <p className="text-xs text-muted-foreground">
                {(() => {
                  const milestones = [3, 7, 14, 30, 100];
                  const next = milestones.find(m => m > data.streakCurrent);
                  if (!next) return (t as any).streak?.keepGoing || 'Keep going!';
                  const daysLeft = next - data.streakCurrent;
                  return ((t as any).streak?.untilNext || '{days} days until next reward!').replace('{days}', String(daysLeft));
                })()}
              </p>
            </div>
            <div className="w-16 h-1.5 rounded-full bg-accent">
              <div
                className="h-full rounded-full bg-primary"
                style={{
                  width: `${Math.min(
                    (data.streakCurrent / ([3, 7, 14, 30, 100].find(m => m > data.streakCurrent) || 100)) * 100,
                    100
                  )}%`,
                }}
              />
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
        </motion.div>
      )}

      {/* Quick action: Nutrition Calculator */}
      <motion.div {...fadeUp(0.5)}>
        <button
          onClick={() => navigate('/nutrition-calculator')}
          className="px-4 py-2.5 rounded-xl bg-secondary text-primary text-xs font-medium hover:bg-accent transition-colors"
        >
          {(t as any).nutritionCalc?.dashboardBtn || '🧮 Nutrition calculator'}
        </button>
      </motion.div>

      <div className="space-y-4">
        {/* Card 1 — Calories */}
        <motion.div {...fadeUp(1)} className={`${cardClass} p-5`}>
          <div className="flex flex-col sm:flex-row items-center gap-5">
            <div className="relative shrink-0" style={{ width: 180, height: 180 }}>
              <svg width="180" height="180" viewBox="0 0 180 180">
                <circle cx="90" cy="90" r="72" fill="none" className="stroke-accent" strokeWidth="12" />
                <circle
                  cx="90" cy="90" r="72"
                  fill="none"
                  className="stroke-primary"
                  strokeWidth="12"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  transform="rotate(-90 90 90)"
                  style={{ transition: 'stroke-dashoffset 0.8s ease' }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-foreground">
                  {data.caloriesConsumed}
                </span>
                <span className="text-xs text-muted-foreground">
                  / {data.caloriesTarget} {(t as any).diary?.kcalUnit || 'kcal'}
                </span>
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="space-y-2 mb-3">
                {[
                  { label: t.dashboard.protein, value: data.protein, color: '#059669', max: 150 },
                  { label: t.dashboard.fat, value: data.fat, color: '#EA580C', max: 80 },
                  { label: t.dashboard.carbs, value: data.carbs, color: '#2563EB', max: 250 },
                ].map((m) => (
                  <div key={m.label}>
                    <div className="flex justify-between text-xs mb-0.5">
                      <span className="text-muted-foreground">{m.label}</span>
                      <span className="font-medium" style={{ color: m.color }}>{m.value}{(t.nutritionCalc as any)?.unitG || 'g'}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          backgroundColor: m.color,
                          width: `${Math.min((m.value / m.max) * 100, 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <p className="text-sm font-semibold" style={{ color: remaining >= 0 ? '#059669' : '#DC2626' }}>
                {remaining >= 0 ? `${remaining} ${t.dashboard.remaining}` : `${Math.abs(remaining)} ${t.dashboard.overTarget}`}
              </p>

              <button
                onClick={() => navigate('/diary')}
                className="mt-2 flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold border-[1.5px] border-primary text-primary"
              >
                <Plus className="w-3.5 h-3.5" /> {t.dashboard.logMeal}
              </button>
            </div>
          </div>
          <CalorieTargetCard />
        </motion.div>

        {/* Missing body data banner */}
        {data.missingBodyData && (
          <motion.div {...fadeUp(1.5)}>
            <button
              onClick={() => setEditProfileOpen(true)}
              className="w-full p-3 rounded-2xl flex items-center gap-3 text-left"
              style={{ backgroundColor: '#FEF3C7', border: '1px solid #FDE68A' }}
            >
              <span className="text-lg">⚙️</span>
              <span className="text-xs font-medium flex-1" style={{ color: '#92400E' }}>
                {(t.dashboard as any).missingBodyData || 'Enter your body data for accurate calorie calculation →'}
              </span>
              <ChevronRight className="w-4 h-4" style={{ color: '#92400E' }} />
            </button>
          </motion.div>
        )}

        {/* AI Nutrition Advice Card */}
        <motion.div
          {...fadeUp(1.8)}
          className="bg-card rounded-2xl p-5 shadow-[0_2px_16px_rgba(124,58,237,0.08)] border-l-4 border-primary"
          style={{ opacity: adviceFading ? 0.4 : 1, transition: 'opacity 0.3s ease' }}
        >
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-muted-foreground">
              {(t as any).nutritionAdvice?.title || "💜 TYANA's advice for you"}
            </p>
            {adviceGeneratedAt && !adviceLoading && (
              <span className="text-[10px] text-muted-foreground/50">
                {(() => {
                  const mins = Math.round((Date.now() - new Date(adviceGeneratedAt).getTime()) / 60000);
                  const template = (t as any).nutritionAdvice?.updatedAgo || 'updated {min} min ago';
                  return template.replace('{min}', mins < 1 ? '<1' : String(mins));
                })()}
              </span>
            )}
          </div>

          {adviceLoading ? (
            <div className="flex items-center gap-2 py-3">
              <div className="w-4 h-4 border-2 rounded-full animate-spin border-accent border-t-primary" />
              <span className="text-xs text-muted-foreground">{(t as any).nutritionAdvice?.loading || 'Thinking...'}</span>
            </div>
          ) : advice ? (
            <p className="text-[15px] leading-[1.7] text-foreground/90">{advice}</p>
          ) : (
            <p className="text-sm text-muted-foreground">{(t as any).nutritionAdvice?.noData || 'Log meals to get personalized advice'}</p>
          )}

          <div className="flex items-center justify-between mt-3 pt-2 border-t border-border/50">
            <button
              onClick={() => fetchAdvice(true)}
              disabled={adviceLoading}
              className="text-xs font-medium flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40"
            >
              <RefreshCw className={`w-3 h-3 ${adviceLoading ? 'animate-spin' : ''}`} />
              {(t as any).nutritionAdvice?.refreshAnalysis || 'Refresh'}
            </button>
            <button onClick={() => navigate('/nutrition-analysis')} className="text-xs font-semibold flex items-center gap-1 text-primary">
              📊 {(t as any).nutritionAdvice?.fullAnalysis || 'Full analysis'} →
            </button>
          </div>
        </motion.div>

        <motion.div {...fadeUp(2)} className={`${cardClass} p-5`}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold flex items-center gap-2 text-foreground">
              <AlertTriangle className="w-4 h-4" style={{ color: '#EA580C' }} />
              {data.expiringItems.length > 0
                ? (() => {
                    const n = data.expiringItems.length;
               if (language === 'ru') return `${n} ${pluralizeRu(n, 'продукт истекает', 'продукта истекают', 'продуктов истекают')}`;
                     if (language === 'uk') return `${n} ${n === 1 ? 'продукт закінчується' : 'продуктів закінчується'}`;
                     if (language === 'lv') return `${n} ${n === 1 ? 'produkts beidzas' : 'produkti beidzas'}`;
                     return `${n} ${n === 1 ? 'item expiring soon' : 'items expiring soon'}`;
                  })()
                : t.dashboard.nothingExpiring}
            </h3>
            <button
              onClick={() => navigate('/inventory?tab=expiring')}
              className="text-xs font-medium flex items-center gap-0.5 text-primary"
            >
              {t.dashboard.viewAll} <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {data.expiringItems.length > 0 ? (
            <div className="space-y-2">
              {data.expiringItems.map((item) => {
                const isExpired = item.days < 0;
                const isToday = item.days === 0;
                const actionDot = item.action === 'discard' ? '#DC2626' : item.action === 'use_or_discard' ? '#EA580C' : '#059669';
                return (
                  <div
                    key={item.id}
                    className="p-2.5 rounded-xl"
                    style={{ backgroundColor: isExpired ? '#FEE2E2' : '#FEF3C7' }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-foreground">{item.name}</span>
                      <span
                        className="text-xs font-semibold px-2 py-0.5 rounded-full"
                        style={{
                          backgroundColor: isExpired ? '#DC2626' : isToday ? '#FEE2E2' : '#FEF3C7',
                          color: isExpired ? 'white' : isToday ? '#DC2626' : '#EA580C',
                        }}
                      >
                        {isExpired
                          ? ((t.dashboard as any).expired || 'Expired')
                          : isToday
                          ? t.dashboard.today
                          : (() => {
                              const d = item.days;
                              if (language === 'ru') return `${d} ${pluralizeRu(d, 'день', 'дня', 'дней')}`;
                              if (language === 'lv') return `${d} ${d === 1 ? 'diena' : 'dienas'}`;
                              return `${d}d left`;
                            })()}
                      </span>
                    </div>
                    {isExpired ? (
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="text-[11px] font-medium" style={{ color: '#DC2626' }}>
                          ⚠️ {language === 'ru' ? `${item.name} просрочен — не рекомендуется употреблять` :
                               language === 'uk' ? `${item.name} прострочено — не рекомендується вживати` :
                               language === 'lv' ? `${item.name} beidzies — nav ieteicams lietot` :
                               `${item.name} is expired — not recommended to consume`}
                        </span>
                      </div>
                    ) : (
                      <>
                        {item.suggestion && (
                          <div className="flex items-center gap-1.5 mt-1">
                            <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: actionDot }} />
                            <span className="text-[11px] text-muted-foreground">{item.suggestion}</span>
                          </div>
                        )}
                        {loadingSuggestions && !item.suggestion && (
                          <span className="text-[11px] mt-1 block text-muted-foreground">
                            {(t.dashboard as any).loadingSuggestions || '...'}
                          </span>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          ) : null}
        </motion.div>

        {/* Card 2.5 — Use It Up suggestion */}
        {data.useItUpRecipe && (
          <motion.div {...fadeUp(2.5)} className={`${cardClass} p-5`}>
            <h3 className="text-sm font-bold mb-3 text-foreground">
              {t.notifications.useBeforeGone}
            </h3>
            <div
              className="flex items-center justify-between p-3 rounded-xl"
              style={{ backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0' }}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">🍳</span>
                <div>
                  <p className="text-sm font-semibold text-foreground">{data.useItUpRecipe.title}</p>
                  <p className="text-[11px]" style={{ color: '#059669' }}>
                    {data.useItUpRecipe.matchCount} {language === 'ru' ? pluralizeRu(data.useItUpRecipe.matchCount, 'совпадающий продукт', 'совпадающих продукта', 'совпадающих продуктов') : language === 'lv' ? 'atbilstoši produkti' : 'matching ingredients'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => navigate('/recipes')}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg text-white shrink-0"
                style={{ backgroundColor: '#059669' }}
              >
                {t.notifications.cookNow}
              </button>
            </div>
          </motion.div>
        )}

        {/* Card 3 — Recipe Ideas */}
        <motion.div {...fadeUp(3)} className={`${cardClass} p-5`}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-foreground">{t.dashboard.ideasToday}</h3>
            <button
              onClick={() => navigate('/recipes')}
              className="text-xs font-medium flex items-center gap-0.5 text-primary"
            >
              {t.recipes.allRecipes} <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {data.recentRecipes.length > 0 ? (
            <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1">
              {data.recentRecipes.map((r) => (
                <div
                  key={r.id}
                  className="shrink-0 w-40 rounded-xl overflow-hidden cursor-pointer bg-secondary border border-border"
                  onClick={() => navigate('/recipes')}
                >
                  <img
                    src={`https://source.unsplash.com/400x300/?${encodeURIComponent(r.title + ' food')}`}
                    alt={r.title}
                    className="w-full h-20 object-cover"
                    loading="lazy"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                  <div className="p-2.5">
                    <p className="text-xs font-semibold truncate text-foreground">{r.title}</p>
                    <p className="text-[10px] mt-0.5 text-muted-foreground">
                      {r.prepTime ? `⏱ ${r.prepTime} ${(t.recipes as any)?.minUnit || 'min'}` : ''}{r.estimatedCost ? ` · ${formatMoney(r.estimatedCost, data.currency)}` : ''}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : data.inventoryCount > 0 ? (
            <button
              onClick={() => navigate('/recipes?useHome=true')}
              className="w-full py-6 rounded-xl text-sm font-medium flex items-center justify-center gap-2 bg-secondary text-primary border border-dashed border-border"
            >
              <Sparkles className="w-4 h-4" />
              {(t.dashboard as any).generateFromFridge || '✨ Generate recipes from your fridge →'}
            </button>
          ) : (
            <button
              onClick={() => navigate('/recipes')}
              className="w-full py-6 rounded-xl text-sm font-medium bg-secondary text-primary border border-dashed border-border"
            >
              {t.dashboard.generateRecipes}
            </button>
          )}
        </motion.div>

        {/* Card — Meal Plan Widget */}
        <MealPlanWidget t={t} language={language} navigate={navigate} fadeUp={fadeUp} cardClass={cardClass} />

        {/* Card 4 — Budget & Savings */}
        <motion.div {...fadeUp(4)} className={`${cardClass} p-5`}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-foreground">
              {t.savings.title}
            </h3>
            <button
              onClick={() => navigate('/savings')}
              className="text-xs font-medium flex items-center gap-0.5 text-primary"
            >
              {t.dashboard.seeDetails} <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Spent this month */}
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground">💸 {t.savings.spent}</span>
            <span className="text-sm font-bold" style={{ color: '#DC2626' }}>{formatMoney(data.spentThisMonth, data.currency)}</span>
          </div>
          <div className="h-2 rounded-full bg-muted mb-3">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                backgroundColor: data.spentThisMonth > data.monthlyBudget ? '#DC2626' : '#EA580C',
                width: `${Math.min((data.spentThisMonth / data.monthlyBudget) * 100, 100)}%`,
              }}
            />
          </div>

          {/* Saved from waste */}
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground">💚 {t.savings.saved}</span>
            <span className="text-sm font-bold" style={{ color: '#059669' }}>{formatMoney(data.savedThisMonth, data.currency)}</span>
          </div>

          {/* Budget editing */}
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-border">
            <div className="flex items-center gap-1.5">
              {editingBudget ? (
                <div className="flex items-center gap-1">
                    <button
                    onClick={() => setShowCurrencyPicker(!showCurrencyPicker)}
                    className="text-xs font-bold px-1.5 py-0.5 rounded-md border border-border text-primary"
                  >
                    {currSymbol}
                  </button>
                  <input
                    type="number"
                    value={budgetInput}
                    onChange={e => setBudgetInput(e.target.value)}
                    className="w-20 h-7 px-2 rounded-lg border border-border text-xs outline-none focus:border-primary bg-background text-foreground"
                    autoFocus
                    onKeyDown={e => { if (e.key === 'Enter') saveBudget(); }}
                  />
                  <button onClick={saveBudget} className="p-0.5 rounded" style={{ color: '#059669' }}>
                    <Check className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => { setBudgetInput(String(data.monthlyBudget)); setEditingBudget(true); }}
                  className="text-xs cursor-pointer hover:underline text-muted-foreground"
                >
                  {t.dashboard.ofGoal.replace('{amount}', `${currSymbol}${data.monthlyBudget}`)}
                </button>
              )}
            </div>
            {!editingBudget && (
              <button
                onClick={() => setShowCurrencyPicker(!showCurrencyPicker)}
                className="text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-secondary text-primary"
              >
                {data.currency}
              </button>
            )}
          </div>
          {showCurrencyPicker && (
            <div className="flex flex-wrap gap-1 mt-2">
              {['EUR', 'USD', 'GBP', 'PLN', 'UAH', 'RUB'].map(code => (
                <button
                  key={code}
                  onClick={() => saveCurrency(code)}
                  className={`text-xs px-2 py-1 rounded-lg border-[1.5px] font-medium transition-all ${
                    data.currency === code
                      ? 'border-primary bg-accent text-primary'
                      : 'border-border bg-card text-foreground'
                  }`}
                >
                  {getCurrencySymbol(code)} {code}
                </button>
              ))}
            </div>
          )}
        </motion.div>

        {/* Card 5 — AI Zero Waste Tip */}
        {(tipLoading || zeroWasteTip) && (
        <motion.div {...fadeUp(5)} className={`${cardClass} p-5`}>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold flex items-center gap-1.5 text-foreground">
              {zeroWasteTip?.emoji || '♻️'} {zeroWasteTip?.title || ((t as any).tips?.title || 'Zero waste tip of the day')}
            </h3>
            <button
              onClick={() => fetchZeroWasteTip(true)}
              disabled={tipLoading}
              className="p-1.5 rounded-lg hover:bg-accent transition-colors text-primary"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${tipLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
          {tipLoading ? (
            <div className="flex items-center gap-2 py-2">
              <div className="w-4 h-4 border-2 rounded-full animate-spin border-accent border-t-primary" />
              <span className="text-xs text-muted-foreground">{(t.common as any)?.loading || 'Loading...'}</span>
            </div>
          ) : zeroWasteTip ? (
            <>
              <p className="text-sm leading-relaxed mb-2 text-muted-foreground">{zeroWasteTip.tip}</p>
              <div className="flex items-center gap-2 flex-wrap">
                {zeroWasteTip.category && (
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-accent text-primary">
                    {zeroWasteTip.category === 'food' ? '🍽' : zeroWasteTip.category === 'beauty' ? '💄' : zeroWasteTip.category === 'cleaning' ? '🧹' : zeroWasteTip.category === 'garden' ? '🌱' : '🏠'} {zeroWasteTip.category}
                  </span>
                )}
                {zeroWasteTip.confidence === 'high' && zeroWasteTip.based_on && (
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: '#F0FDF4', color: '#059669' }}>
                    {language === 'ru' ? 'На основе' : language === 'uk' ? 'На основі' : language === 'lv' ? 'Balstīts uz' : 'Based on'}: {zeroWasteTip.based_on}
                  </span>
                )}
              </div>
            </>
          ) : null}
        </motion.div>
        )}
      </div>
      <EditProfileModal open={editProfileOpen} onOpenChange={setEditProfileOpen} />
    </div>
  );
};

export default Dashboard;
