import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, Calendar, ShoppingCart, ChevronRight, BookOpen, Check, Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useTranslation } from '@/hooks/useTranslation';
import { usePageTitle } from '@/hooks/usePageTitle';
import { toast } from 'sonner';
import { format, addDays, startOfWeek } from 'date-fns';

interface Meal {
  name: string;
  emoji: string;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  ingredients: string[];
  cookTime: string;
  difficulty: string;
  fromInventory: boolean;
  missingIngredients: string[];
}

interface DayPlan {
  date: string;
  dayName: string;
  meals: {
    breakfast: Meal;
    lunch: Meal;
    dinner: Meal;
    snack: Meal;
  };
  dayTotal: {
    calories: number;
    protein: number;
    fat: number;
    carbs: number;
  };
}

interface ShoppingItem {
  name: string;
  amount: string;
  category?: string;
  forDays: string[];
  forMeals?: string[];
}

interface MealPlanData {
  days: DayPlan[];
  weekSummary: {
    avgCalories: number;
    avgProtein: number;
    avgFat: number;
    avgCarbs: number;
    daysFromInventory: number;
    estimatedShoppingCost: number;
  };
  shoppingList: ShoppingItem[];
}

const MEAL_ICONS: Record<string, string> = {
  breakfast: '🌅',
  lunch: '☀️',
  dinner: '🌙',
  snack: '🍎',
};

const LOADING_TIPS_EN = [
  'Analyzing your products... 🧊',
  'Picking recipes for your goals... 🎯',
  'Calculating weekly calories... 📊',
  'Almost ready... ✨',
];
const LOADING_TIPS_RU = [
  'Анализируем твои продукты... 🧊',
  'Подбираем рецепты под цели... 🎯',
  'Считаем калории на неделю... 📊',
  'Почти готово... ✨',
];
const LOADING_TIPS_UK = [
  'Аналізуємо твої продукти... 🧊',
  'Підбираємо рецепти під цілі... 🎯',
  'Рахуємо калорії на тиждень... 📊',
  'Майже готово... ✨',
];
const LOADING_TIPS_LV = [
  'Analizējam tavus produktus... 🧊',
  'Atlasām receptes taviem mērķiem... 🎯',
  'Aprēķinām kalorijas nedēļai... 📊',
  'Gandrīz gatavs... ✨',
];

const MealPlan = ({ embedded }: { embedded?: boolean }) => {
  const { user } = useAuth();
  const { t, language } = useTranslation();
  const mp = (t as any).mealPlan || {};
  if (!embedded) usePageTitle(mp.title || 'Meal Plan');

  const [planData, setPlanData] = useState<MealPlanData | null>(null);
  const [planId, setPlanId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedDay, setSelectedDay] = useState(0);
  const [activeTab, setActiveTab] = useState<'plan' | 'shopping'>('plan');
  const [recipeModal, setRecipeModal] = useState<{ open: boolean; meal: Meal | null; mealType: string }>({ open: false, meal: null, mealType: '' });
  const [loggedMeals, setLoggedMeals] = useState<Set<string>>(new Set());
  const [tipIndex, setTipIndex] = useState(0);
  const [regenerateModal, setRegenerateModal] = useState(false);

  const loadingTips = language === 'ru' ? LOADING_TIPS_RU : language === 'uk' ? LOADING_TIPS_UK : language === 'lv' ? LOADING_TIPS_LV : LOADING_TIPS_EN;

  // Rotate loading tips
  useEffect(() => {
    if (!generating) return;
    const interval = setInterval(() => {
      setTipIndex(prev => (prev + 1) % loadingTips.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [generating, loadingTips.length]);

  // Load existing plan
  useEffect(() => {
    if (!user) return;
    loadPlan();
  }, [user]);

  const loadPlan = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('meal_plans')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setPlanData(data.plan_data as unknown as MealPlanData);
        setPlanId(data.id);
        // Set selected day to today if within the plan
        const today = format(new Date(), 'yyyy-MM-dd');
        const dayIndex = (data.plan_data as any)?.days?.findIndex((d: any) => d.date === today);
        if (dayIndex >= 0) setSelectedDay(dayIndex);
      }
    } catch (e) {
      console.error('Error loading meal plan:', e);
    } finally {
      setLoading(false);
    }
  };

  const generatePlan = async () => {
    if (!user) return;
    setGenerating(true);
    setTipIndex(0);

    try {
      // Fetch user data in parallel
      const [profileRes, goalsRes, inventoryRes, familyRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('user_id', user.id).single(),
        supabase.from('user_goals').select('*').eq('user_id', user.id).single(),
        supabase.from('inventory_items').select('*').eq('user_id', user.id),
        supabase.from('family_members').select('*'),
      ]);

      const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
      const weekStartDate = format(weekStart, 'yyyy-MM-dd');

      const { data: planResult, error } = await supabase.functions.invoke('generate-meal-plan', {
        body: {
          profile: profileRes.data,
          goals: goalsRes.data,
          inventory: inventoryRes.data || [],
          familyMembers: familyRes.data || [],
          language,
          weekStartDate,
        },
      });

      if (error) throw error;
      if (planResult?.error) throw new Error(planResult.error);

      // Archive old plans
      if (planId) {
        await supabase.from('meal_plans').update({ status: 'archived' }).eq('id', planId);
      }

      // Save new plan
      const { data: saved, error: saveError } = await supabase
        .from('meal_plans')
        .insert({
          user_id: user.id,
          week_start_date: weekStartDate,
          plan_data: planResult as any,
          status: 'active',
        })
        .select()
        .single();

      if (saveError) throw saveError;

      setPlanData(planResult as MealPlanData);
      setPlanId(saved.id);
      setSelectedDay(0);
      toast.success(mp.planGenerated || 'Meal plan generated! ✨');
    } catch (e: any) {
      console.error('Error generating plan:', e);
      toast.error(e.message || (t.common as any)?.error || 'Error');
    } finally {
      setGenerating(false);
    }
  };

  const logMealToDiary = async (meal: Meal, mealType: string, date: string) => {
    if (!user) return;
    const key = `${date}-${mealType}`;
    if (loggedMeals.has(key)) return;

    try {
      const { error } = await supabase.from('meal_entries').insert({
        user_id: user.id,
        date,
        meal_type: mealType,
        custom_name: meal.name,
        total_calories: meal.calories,
        total_protein: meal.protein,
        total_fat: meal.fat,
        total_carbs: meal.carbs,
      });
      if (error) throw error;
      setLoggedMeals(prev => new Set(prev).add(key));
      toast.success(mp.loggedToDiary || 'Added to diary ✓');
    } catch (e) {
      console.error('Error logging meal:', e);
      toast.error((t.common as any)?.error || 'Error');
    }
  };

  const addShoppingListToShopping = async () => {
    if (!user || !planData?.shoppingList) return;
    try {
      const items = planData.shoppingList.map(item => ({
        user_id: user.id,
        name: `${item.name} ${item.amount}`,
        category: item.category || 'other',
      }));
      const { error } = await supabase.from('shopping_items').insert(items);
      if (error) throw error;
      toast.success(mp.addedToShoppingList || 'Added to shopping list ✓');
    } catch (e) {
      console.error('Error adding to shopping:', e);
      toast.error((t.common as any)?.error || 'Error');
    }
  };

  const mealTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      breakfast: mp.breakfast || t.diary.breakfast,
      lunch: mp.lunch || t.diary.lunch,
      dinner: mp.dinner || t.diary.dinner,
      snack: mp.snackLabel || t.diary.snack,
    };
    return labels[type] || type;
  };

  const categoryIcon = (cat: string) => {
    const icons: Record<string, string> = { meat: '🥩', dairy: '🥛', produce: '🥬', grains: '🫙', other: '🛒' };
    return icons[cat] || '🛒';
  };

  // ─── EMPTY STATE ─────────────────────────
  if (loading) {
    return (
      <div className="p-4 pb-24 md:p-6 max-w-2xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/2" />
          <div className="h-32 bg-muted rounded-xl" />
          <div className="h-48 bg-muted rounded-xl" />
        </div>
      </div>
    );
  }

  // ─── GENERATING STATE ─────────────────────
  if (generating) {
    return (
      <div className="p-4 pb-24 md:p-6 max-w-2xl mx-auto flex flex-col items-center justify-center min-h-[60vh] gap-6">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="w-16 h-16 rounded-full border-4 border-primary border-t-transparent"
        />
        <motion.p
          key={tipIndex}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="text-sm text-muted-foreground text-center"
        >
          {loadingTips[tipIndex]}
        </motion.p>
      </div>
    );
  }

  if (!planData) {
    return (
      <div className="p-4 pb-24 md:p-6 max-w-2xl mx-auto flex flex-col items-center justify-center min-h-[60vh] gap-6">
        <div className="text-6xl">📅</div>
        <h2 className="text-xl font-bold text-foreground text-center">
          {mp.emptyTitle || 'Create your weekly meal plan'}
        </h2>
        <p className="text-sm text-muted-foreground text-center max-w-xs">
          {mp.emptySubtitle || 'TYANA will pick meals based on your goals, using products you already have at home'}
        </p>
        <div className="space-y-2 text-sm text-muted-foreground">
          <div>✓ {mp.bullet1 || 'Considers your goals'}</div>
          <div>✓ {mp.bullet2 || 'Counts calories automatically'}</div>
          <div>✓ {mp.bullet3 || 'Uses products from your fridge'}</div>
        </div>
        <Button onClick={generatePlan} size="lg" className="gap-2 mt-4">
          <Sparkles className="w-4 h-4" />
          {mp.generateBtn || 'Create plan'}
        </Button>
      </div>
    );
  }

  // ─── PLAN VIEW ─────────────────────────
  const day = planData.days?.[selectedDay];
  const summary = planData.weekSummary;
  const today = format(new Date(), 'yyyy-MM-dd');

  const MealCard = ({ meal, mealType, date }: { meal: Meal; mealType: string; date: string }) => {
    const logged = loggedMeals.has(`${date}-${mealType}`);
    return (
      <Card className="overflow-hidden">
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-lg">{MEAL_ICONS[mealType]}</span>
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {mealTypeLabel(mealType)}
              </span>
            </div>
            <span className="text-xs text-muted-foreground">{meal.cookTime}</span>
          </div>

          <div className="flex items-start justify-between mb-2">
            <h4 className="font-semibold text-foreground text-sm leading-snug flex-1">
              {meal.name}
            </h4>
            <span className="text-xl ml-2">{meal.emoji}</span>
          </div>

          <div className="text-sm font-bold text-foreground mb-1">{meal.calories} {(t.diary as any)?.kcalUnit || 'kcal'}</div>
          <div className="text-xs text-muted-foreground mb-3">
            {mp.proteinShort || 'P'}:{meal.protein}{mp.gramShort || 'g'}  {mp.fatShort || 'F'}:{meal.fat}{mp.gramShort || 'g'}  {mp.carbsShort || 'C'}:{meal.carbs}{mp.gramShort || 'g'}
          </div>

          {meal.fromInventory ? (
            <Badge className="text-[10px] bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-0 mb-3">
              ✅ {mp.allFromHome || 'All from home'}
            </Badge>
          ) : (
            <div className="mb-3">
              <Badge className="text-[10px] bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-0">
                🛒 {mp.needToBuy || 'Need to buy'}
              </Badge>
              {meal.missingIngredients?.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {meal.missingIngredients.map((ing, i) => (
                    <span key={i} className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
                      {ing}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="text-xs gap-1 flex-1"
              onClick={() => setRecipeModal({ open: true, meal, mealType })}
            >
              <BookOpen className="w-3 h-3" />
              {mp.recipeBtn || 'Recipe'}
            </Button>
            <Button
              variant={logged ? 'secondary' : 'default'}
              size="sm"
              className="text-xs gap-1 flex-1"
              disabled={logged}
              onClick={() => logMealToDiary(meal, mealType, date)}
            >
              <Check className="w-3 h-3" />
              {logged ? (mp.logged || 'Logged') : (mp.logBtn || 'Log')}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="p-4 pb-24 md:p-6 max-w-2xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            📅 {mp.title || 'Meal Plan'}
          </h1>
          {planData.days?.length > 0 && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {planData.days[0].date} — {planData.days[planData.days.length - 1].date}
            </p>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 text-xs"
          onClick={() => setRegenerateModal(true)}
        >
          <RefreshCw className="w-3.5 h-3.5" />
          {mp.newPlan || 'New plan'}
        </Button>
      </div>

      {/* Week Summary */}
      {summary && (
        <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="p-4">
            <div className="text-sm font-semibold text-foreground mb-2">
              {mp.avgCalories || 'Avg calories'}: {summary.avgCalories} {(t.diary as any)?.kcalUnit || 'kcal'}/{mp.dayWord || 'day'}
            </div>
            <div className="text-xs text-muted-foreground mb-1">
              {mp.proteinShort || 'P'}: {summary.avgProtein}{mp.gramShort || 'g'} • {mp.fatShort || 'F'}: {summary.avgFat}{mp.gramShort || 'g'} • {mp.carbsShort || 'C'}: {summary.avgCarbs}{mp.gramShort || 'g'}
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-2">
              {summary.daysFromInventory > 0 && (
                <span>✅ {summary.daysFromInventory} {mp.daysFromHome || 'days from home products'}</span>
              )}
              {summary.estimatedShoppingCost > 0 && (
                <span>🛒 ~€{summary.estimatedShoppingCost}</span>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Plan / Shopping tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'plan' | 'shopping')}>
        <TabsList className="w-full">
          <TabsTrigger value="plan" className="flex-1 gap-1">
            <Calendar className="w-3.5 h-3.5" />
            {mp.planTab || 'Plan'}
          </TabsTrigger>
          <TabsTrigger value="shopping" className="flex-1 gap-1">
            <ShoppingCart className="w-3.5 h-3.5" />
            {mp.shoppingTab || 'Shopping list'}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="plan" className="space-y-4 mt-4">
          {/* Day tabs - horizontal scroll */}
          <div className="flex gap-1.5 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
            {planData.days?.map((d, i) => {
              const isToday = d.date === today;
              const isSelected = i === selectedDay;
              return (
                <button
                  key={d.date}
                  onClick={() => setSelectedDay(i)}
                  className={`flex flex-col items-center min-w-[52px] px-2 py-2 rounded-xl text-xs font-medium transition-all shrink-0 ${
                    isSelected
                      ? 'bg-primary text-primary-foreground shadow-md'
                      : isToday
                      ? 'bg-primary/10 text-primary border border-primary/30'
                      : 'bg-card text-muted-foreground border border-border'
                  }`}
                >
                  <span className="font-semibold">{d.dayName?.slice(0, 2)}</span>
                  <span className="text-[10px] mt-0.5 opacity-80">{d.dayTotal?.calories}</span>
                </button>
              );
            })}
          </div>

          {/* Selected day */}
          {day && (
            <div className="space-y-3">
              <div>
                <h3 className="font-semibold text-foreground">{day.dayName}, {day.date}</h3>
                <div className="text-xs text-muted-foreground">
                  {day.dayTotal?.calories} {(t.diary as any)?.kcalUnit || 'kcal'} • {mp.proteinShort || 'P'}:{day.dayTotal?.protein}{mp.gramShort || 'g'} {mp.fatShort || 'F'}:{day.dayTotal?.fat}{mp.gramShort || 'g'} {mp.carbsShort || 'C'}:{day.dayTotal?.carbs}{mp.gramShort || 'g'}
                </div>
              </div>

              {['breakfast', 'lunch', 'dinner', 'snack'].map(type => {
                const meal = day.meals?.[type as keyof typeof day.meals];
                if (!meal) return null;
                return <MealCard key={type} meal={meal} mealType={type} date={day.date} />;
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="shopping" className="space-y-4 mt-4">
          {planData.shoppingList?.length > 0 ? (
            <>
              {/* Group by category */}
              {['meat', 'dairy', 'produce', 'grains', 'other'].map(cat => {
                const items = planData.shoppingList.filter(i => (i.category || 'other') === cat);
                if (items.length === 0) return null;
                return (
                  <div key={cat}>
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2 flex items-center gap-1">
                      {categoryIcon(cat)} {mp[`cat_${cat}`] || cat}
                    </h4>
                    <div className="space-y-1.5">
                      {items.map((item, i) => (
                        <div key={i} className="flex items-center justify-between p-2.5 bg-card rounded-lg border border-border">
                          <div>
                            <span className="text-sm font-medium text-foreground">{item.name}</span>
                            <span className="text-xs text-muted-foreground ml-2">{item.amount}</span>
                          </div>
                          <span className="text-[10px] text-muted-foreground">
                            {item.forDays?.join(', ')}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}

              <Button onClick={addShoppingListToShopping} className="w-full gap-2">
                <ShoppingCart className="w-4 h-4" />
                {mp.addAllToShopping || 'Add all to shopping list'}
              </Button>
            </>
          ) : (
            <div className="text-center py-8 text-muted-foreground text-sm">
              ✅ {mp.noShoppingNeeded || 'Everything is at home!'}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Recipe detail modal */}
      <Dialog open={recipeModal.open} onOpenChange={(open) => setRecipeModal(prev => ({ ...prev, open }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {recipeModal.meal?.emoji} {recipeModal.meal?.name}
            </DialogTitle>
            <DialogDescription>
              {recipeModal.meal?.cookTime} • {recipeModal.meal?.difficulty}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-semibold mb-2">{mp.ingredientsTitle || 'Ingredients'}</h4>
              <ul className="space-y-1">
                {recipeModal.meal?.ingredients?.map((ing, i) => (
                  <li key={i} className="text-sm text-muted-foreground flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                    {ing}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex gap-3 text-xs text-muted-foreground pt-2 border-t border-border">
              <span>{recipeModal.meal?.calories} kcal</span>
              <span>{mp.proteinShort || 'P'}: {recipeModal.meal?.protein}g</span>
              <span>{mp.fatShort || 'F'}: {recipeModal.meal?.fat}g</span>
              <span>{mp.carbsShort || 'C'}: {recipeModal.meal?.carbs}g</span>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Regenerate modal */}
      <Dialog open={regenerateModal} onOpenChange={setRegenerateModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{mp.regenerateTitle || 'What to change?'}</DialogTitle>
            <DialogDescription>{mp.regenerateDesc || 'Choose an option'}</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Button
              variant="outline"
              className="w-full justify-start gap-2 text-sm"
              onClick={() => { setRegenerateModal(false); generatePlan(); }}
            >
              🎲 {mp.fullNewPlan || 'Completely new plan'}
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start gap-2 text-sm"
              onClick={() => { setRegenerateModal(false); generatePlan(); }}
            >
              ➕ {mp.withNewProducts || 'Include new products'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MealPlan;
