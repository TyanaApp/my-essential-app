import { useState, useEffect, lazy, Suspense } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, X, ShoppingCart, Clock, DollarSign, Check, ChevronDown, Plus, Trash2, ChefHat, CalendarDays } from 'lucide-react';
import RecipePhoto from '@/components/RecipePhoto';
import RecipeDetailModal from '@/components/recipes/RecipeDetailModal';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useFamily } from '@/hooks/useFamily';
import { toast } from 'sonner';
import { useSubscription, PLAN_LIMITS } from '@/hooks/useSubscription';
import UpgradeModal from '@/components/UpgradeModal';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useTranslation } from '@/hooks/useTranslation';
import { useStreak } from '@/hooks/useStreak';
import MealPlan from '@/pages/MealPlan';
const NutritionCalculator = lazy(() => import('@/pages/NutritionCalculator'));

interface Ingredient { name: string; amount: string; inFridge: boolean; }
interface Nutrition { calories: number; protein: number; fat: number; carbs: number; }
interface Recipe { title: string; ingredients: Ingredient[]; instructions: string[]; nutrition: Nutrition; prepTime: number; estimatedCost: number; }
interface SavedRecipe { id: string; title: string; ingredients: Ingredient[] | null; instructions: string[] | null; nutrition: Nutrition | null; prep_time: number | null; estimated_cost: number | null; is_favorite: boolean; }

const MEAL_TYPE_KEYS = ['breakfast', 'lunch', 'dinner', 'snack'] as const;
const TIME_OPTION_KEYS = ['time15', 'time30', 'time1h', 'timeAny'] as const;
const TIME_VALUES = ['<15 min', '30 min', '1 hour', 'Any'];
const SERVING_OPTIONS = [1, 2, 3, 4, 5];

const Recipes = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t, language } = useTranslation();
  usePageTitle(t.recipes.title);
  const { plan } = useSubscription();
  const { updateStreak } = useStreak();
  const { subMembers, familyMode } = useFamily();
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const [cookingFor, setCookingFor] = useState(2);
  const [selectedMeals, setSelectedMeals] = useState<string[]>(['dinner']);
  const [timeAvailable, setTimeAvailable] = useState('30 min');
  const [useOnlyInventory, setUseOnlyInventory] = useState(false);
  const [generating, setGenerating] = useState(false);

  const [generatedRecipes, setGeneratedRecipes] = useState<Recipe[]>([]);
  const [savedRecipes, setSavedRecipes] = useState<SavedRecipe[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [userGoals, setUserGoals] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [detailRecipe, setDetailRecipe] = useState<Recipe | SavedRecipe | null>(null);
  const [addedIngredients, setAddedIngredients] = useState<Set<string>>(new Set());
  const [showSettings, setShowSettings] = useState(true);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const [invRes, goalsRes, recipesRes] = await Promise.all([
        supabase.from('inventory_items').select('id, name, quantity, unit, price_per_unit, expires_at').eq('user_id', user.id),
        supabase.from('user_goals').select('*').eq('user_id', user.id).maybeSingle(),
        supabase.from('recipes').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      ]);
      if (invRes.data) setInventory(invRes.data);
      if (goalsRes.data) setUserGoals(goalsRes.data);
      if (recipesRes.data) setSavedRecipes(recipesRes.data as unknown as SavedRecipe[]);
      setLoading(false);
    };
    load();
  }, [user]);

  const toggleMeal = (m: string) => {
    setSelectedMeals((prev) => prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]);
  };

  const handleGenerate = async () => {
    if (!user || inventory.length === 0) return;
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-recipes', {
        body: {
          mealType: selectedMeals.join(', '), cookingFor, timeAvailable, useOnlyInventory,
          inventory, userGoals: userGoals || {}, language,
          familyMembers: familyMode ? subMembers.map(m => ({
            name: m.name, age: m.age, allergies: m.allergies, diet_type: m.diet_type,
          })) : undefined,
        },
      });
      if (error) throw error;
      const recipes: Recipe[] = data?.recipes || [];
      if (recipes.length === 0) {
        toast.error(t.recipes.noRecipesGenerated);
      } else {
        setGeneratedRecipes(recipes);
        setShowSettings(false);
        toast.success(t.recipes.recipesGenerated.replace('{count}', String(recipes.length)));
        await updateStreak();
      }
    } catch {
      toast.error(t.recipes.failedGenerate);
    } finally { setGenerating(false); }
  };

  const handleSaveRecipe = async (recipe: Recipe) => {
    if (!user) return;
    const limit = PLAN_LIMITS[plan].maxRecipes;
    if (savedRecipes.length >= limit) { setUpgradeOpen(true); return; }
    try {
      const { error } = await supabase.from('recipes').insert({
        user_id: user.id, title: recipe.title, ingredients: recipe.ingredients as any,
        instructions: recipe.instructions, nutrition: recipe.nutrition as any,
        prep_time: recipe.prepTime, estimated_cost: recipe.estimatedCost, is_favorite: false,
      });
      if (error) throw error;
      toast.success(`"${recipe.title}" ${t.recipes.recipeSaved}`);
      const { data } = await supabase.from('recipes').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
      if (data) setSavedRecipes(data as unknown as SavedRecipe[]);
    } catch { toast.error(t.recipes.failedSave); }
  };

  const toggleFavorite = async (id: string, current: boolean) => {
    await supabase.from('recipes').update({ is_favorite: !current }).eq('id', id);
    setSavedRecipes((prev) => prev.map((r) => (r.id === id ? { ...r, is_favorite: !current } : r)));
  };

  const handleDeleteRecipe = async (id: string) => {
    if (!user) return;
    try {
      const { error } = await supabase.from('recipes').delete().eq('id', id).eq('user_id', user.id);
      if (error) throw error;
      setSavedRecipes((prev) => prev.filter((r) => r.id !== id));
      setDeleteConfirmId(null);
      setDetailRecipe(null);
      toast.success((t.recipes as any).recipeDeleted || 'Recipe removed');
    } catch {
      toast.error(t.common.error);
    }
  };

  const addMissingToShopping = async (ingredients: Ingredient[]) => {
    if (!user) return;
    const missing = ingredients.filter((i) => !i.inFridge);
    if (missing.length === 0) { toast.info(t.recipes.allIngredients); return; }
    const items = missing.map((i) => ({ user_id: user.id, name: i.name, quantity: 1, unit: 'pcs' }));
    await supabase.from('shopping_items').insert(items as any);
    setAddedIngredients(prev => {
      const next = new Set(prev);
      missing.forEach(i => next.add(i.name));
      return next;
    });
    toast.success(t.recipes.itemsAdded.replace('{count}', String(missing.length)));
  };

  const addSingleToShopping = async (ing: Ingredient) => {
    if (!user) return;
    await supabase.from('shopping_items').insert({
      user_id: user.id, name: ing.name, quantity: 1, unit: 'pcs',
    } as any);
    setAddedIngredients(prev => new Set(prev).add(ing.name));
    toast.success(`${ing.name} ${t.inventory.addedToShopping}`);
  };

  const dailyTarget = userGoals?.daily_calories_target || 2000;
  const calorieColor = (cal: number) => {
    const pct = cal / dailyTarget;
    if (pct <= 0.3) return { bg: '#D1FAE5', text: '#059669' };
    if (pct <= 0.5) return { bg: '#FEF3C7', text: '#EA580C' };
    return { bg: '#FEE2E2', text: '#DC2626' };
  };

  const normalizeRecipe = (r: Recipe | SavedRecipe) => {
    if ('id' in r) {
      return { title: r.title, ingredients: (r.ingredients || []) as Ingredient[], instructions: (r.instructions || []) as string[], nutrition: (r.nutrition || { calories: 0, protein: 0, fat: 0, carbs: 0 }) as Nutrition, prepTime: r.prep_time || 0, estimatedCost: r.estimated_cost || 0 };
    }
    return r;
  };

  const RecipeCard = ({ recipe, isSaved, savedId, isFav }: { recipe: Recipe | SavedRecipe; isSaved?: boolean; savedId?: string; isFav?: boolean }) => {
    const n = normalizeRecipe(recipe);
    const cc = calorieColor(n.nutrition.calories);
    const missingCount = n.ingredients.filter((i) => !i.inFridge).length;

    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-2xl overflow-hidden cursor-pointer"
        style={{ boxShadow: '0 2px 12px rgba(124,58,237,0.06)' }}
        onClick={() => { setAddedIngredients(new Set()); setDetailRecipe(recipe); }}
      >
        <RecipePhoto title={n.title} size="sm" />
        <div className="p-4">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="text-base font-bold leading-tight text-foreground">{n.title}</h3>
            <div className="flex items-center gap-0.5 shrink-0">
              {isSaved && savedId && (
                <button onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(savedId); }} className="p-1">
                  <Trash2 className="w-4 h-4" style={{ color: '#DC2626' }} />
                </button>
              )}
              {isSaved && savedId ? (
                <button onClick={(e) => { e.stopPropagation(); toggleFavorite(savedId, !!isFav); }} className="p-1">
                  <Heart className="w-5 h-5" fill={isFav ? '#7C3AED' : 'none'} style={{ color: '#7C3AED' }} />
                </button>
              ) : (
                <button onClick={(e) => { e.stopPropagation(); handleSaveRecipe(recipe as Recipe); }} className="p-1">
                  <Heart className="w-5 h-5" style={{ color: '#7C3AED' }} />
                </button>
              )}
            </div>
          </div>
          <span className="inline-block text-xs font-semibold px-2 py-0.5 rounded-full mb-2" style={{ backgroundColor: cc.bg, color: cc.text }}>
            {n.nutrition.calories} {(t.diary as any)?.kcalUnit || 'kcal'}
          </span>
          <div className="flex items-center gap-3 text-xs mb-2" style={{ color: '#6B7280' }}>
            <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {n.prepTime} {(t.recipes as any)?.minUnit || 'min'}</span>
            <span className="flex items-center gap-1">💰 {(t.recipes as any)?.estCost || 'est.'} €{n.estimatedCost?.toFixed(2)}</span>
          </div>
          <p className="text-xs font-medium" style={{ color: missingCount === 0 ? '#059669' : '#EA580C' }}>
            {missingCount === 0 ? t.recipes.allAvailable : t.recipes.needItems.replace('{count}', String(missingCount))}
          </p>
        </div>
      </motion.div>
    );
  };

  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') === 'plan' ? 'plan' : searchParams.get('tab') === 'calc' ? 'calc' : 'recipes';
  const [activeMainTab, setActiveMainTab] = useState(initialTab);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'plan') setActiveMainTab('plan');
    else if (tab === 'calc') setActiveMainTab('calc');
  }, [searchParams]);

  const TAB_LABELS: Record<string, { recipes: string; plan: string; calc: string }> = {
    ru: { recipes: '🍽 Рецепты', plan: '📅 План', calc: '🔢 КБЖУ' },
    en: { recipes: '🍽 Recipes', plan: '📅 Plan', calc: '🔢 KBJU' },
    uk: { recipes: '🍽 Рецепти', plan: '📅 План', calc: '🔢 КБЖУ' },
    lv: { recipes: '🍽 Receptes', plan: '📅 Plāns', calc: '🔢 KBJU' },
  };
  const tabLabels = TAB_LABELS[language] || TAB_LABELS.en;

  return (
    <div className="min-h-screen p-6 pb-mobile-safe">
      {/* Tab bar */}
      <div className="flex gap-1 mb-5 bg-secondary rounded-xl p-1">
        {(['recipes', 'plan', 'calc'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveMainTab(tab)}
            className="flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all"
            style={{
              backgroundColor: activeMainTab === tab ? 'hsl(var(--primary))' : 'transparent',
              color: activeMainTab === tab ? 'hsl(var(--primary-foreground))' : 'hsl(var(--muted-foreground))',
            }}
          >
            {tabLabels[tab]}
          </button>
        ))}
      </div>

      {activeMainTab === 'plan' ? (
        <MealPlan embedded />
      ) : activeMainTab === 'calc' ? (
        <Suspense fallback={<div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>}>
          <NutritionCalculator embedded />
        </Suspense>
      ) : (
      <>
      <h1 className="text-2xl font-bold mb-5 text-foreground">{t.recipes.title}</h1>

      {/* Generation settings */}
      <div className="mb-6">
        <button onClick={() => setShowSettings(!showSettings)} className="flex items-center gap-2 text-sm font-semibold mb-3" style={{ color: '#7C3AED' }}>
          {t.recipes.generate}
          <ChevronDown className="w-4 h-4 transition-transform" style={{ transform: showSettings ? 'rotate(180deg)' : 'rotate(0deg)' }} />
        </button>

        <AnimatePresence>
          {showSettings && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              <div className="rounded-2xl p-4 space-y-4" style={{ backgroundColor: '#F5F3FF', border: '1px solid #DDD6FE' }}>
                <div>
                  <label className="text-xs font-semibold mb-1.5 block text-foreground">{t.recipes.cookingFor}</label>
                  <div className="flex gap-2">
                    {SERVING_OPTIONS.map((n) => (
                      <button key={n} onClick={() => setCookingFor(n)}
                        className="w-10 h-10 rounded-xl text-sm font-bold border-[1.5px] transition-all"
                        style={{ borderColor: cookingFor === n ? '#7C3AED' : '#DDD6FE', backgroundColor: cookingFor === n ? '#EDE9FE' : 'white', color: cookingFor === n ? '#7C3AED' : '#6B7280' }}>
                        {n}{n === 5 ? '+' : ''}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold mb-1.5 block text-foreground">{t.recipes.mealType}</label>
                  <div className="flex flex-wrap gap-2">
                    {MEAL_TYPE_KEYS.map((key) => (
                      <button key={key} onClick={() => toggleMeal(key)}
                        className="px-3 py-1.5 rounded-full text-xs font-medium border-[1.5px] transition-all"
                        style={{ borderColor: selectedMeals.includes(key) ? '#7C3AED' : '#DDD6FE', backgroundColor: selectedMeals.includes(key) ? '#EDE9FE' : 'white', color: selectedMeals.includes(key) ? '#7C3AED' : '#6B7280' }}>
                        {t.recipes[key]}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold mb-1.5 block text-foreground">{t.recipes.time}</label>
                  <div className="flex flex-wrap gap-2">
                    {TIME_OPTION_KEYS.map((key, i) => (
                      <button key={key} onClick={() => setTimeAvailable(TIME_VALUES[i])}
                        className="px-3 py-1.5 rounded-full text-xs font-medium border-[1.5px] transition-all"
                        style={{ borderColor: timeAvailable === TIME_VALUES[i] ? '#7C3AED' : '#DDD6FE', backgroundColor: timeAvailable === TIME_VALUES[i] ? '#EDE9FE' : 'white', color: timeAvailable === TIME_VALUES[i] ? '#7C3AED' : '#6B7280' }}>
                        {t.recipes[key]}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground">{t.recipes.onlyHome}</span>
                  <button onClick={() => setUseOnlyInventory(!useOnlyInventory)}
                    className="w-11 h-6 rounded-full relative transition-colors"
                    style={{ backgroundColor: useOnlyInventory ? '#7C3AED' : '#D1D5DB' }}>
                    <div className="w-5 h-5 rounded-full bg-white absolute top-0.5 transition-all" style={{ left: useOnlyInventory ? '22px' : '2px' }} />
                  </button>
                </div>

                {!loading && inventory.length === 0 ? (
                  <div className="text-center py-4 rounded-xl" style={{ backgroundColor: 'white' }}>
                    <div className="text-4xl mb-2">🧊</div>
                    <p className="text-sm font-bold mb-1 text-foreground">{t.recipes.noInventory}</p>
                    <p className="text-xs mb-3 text-muted-foreground">{t.recipes.noInventoryHint}</p>
                    <button onClick={() => navigate('/inventory')} className="px-4 py-2 rounded-xl text-sm font-semibold text-white" style={{ backgroundColor: '#7C3AED' }}>
                      {t.recipes.goToInventory}
                    </button>
                  </div>
                ) : (
                  <button onClick={handleGenerate} disabled={generating || selectedMeals.length === 0}
                    className="w-full h-12 rounded-xl text-white font-semibold text-sm transition-opacity disabled:opacity-40" style={{ backgroundColor: '#7C3AED' }}>
                    {generating ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        {t.recipes.generating}
                      </span>
                    ) : t.recipes.generateBtn}
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Generated recipes */}
      {generatedRecipes.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-bold mb-3 text-foreground">{t.recipes.justGenerated}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {generatedRecipes.map((r, idx) => (<RecipeCard key={`gen-${idx}`} recipe={r} />))}
          </div>
        </div>
      )}

      {/* Saved recipes */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-7 h-7 border-[3px] rounded-full animate-spin" style={{ borderColor: '#EDE9FE', borderTopColor: '#7C3AED' }} />
        </div>
      ) : savedRecipes.length > 0 ? (
        <div>
          <h2 className="text-sm font-bold mb-3 text-foreground">{t.recipes.savedRecipes}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {savedRecipes.map((r) => (<RecipeCard key={r.id} recipe={r} isSaved savedId={r.id} isFav={r.is_favorite} />))}
          </div>
        </div>
      ) : generatedRecipes.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">🍳</div>
          <p className="text-base font-medium mb-1 text-foreground">{t.recipes.noRecipes}</p>
          <p className="text-sm text-muted-foreground">{t.recipes.noRecipesHint}</p>
        </div>
      ) : null}

      {/* Recipe Detail Modal */}
      <AnimatePresence>
        {detailRecipe && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={() => setDetailRecipe(null)}>
            <motion.div initial={{ opacity: 0, y: 100 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 100 }}
              className="bg-card rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg max-h-[90vh] overflow-y-auto"
              style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }} onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-center pt-2 sm:hidden"><div className="w-10 h-1 rounded-full bg-muted-foreground/30" /></div>
              {(() => {
                const r = normalizeRecipe(detailRecipe);
                const cc = calorieColor(r.nutrition.calories);
                const missing = r.ingredients.filter((i) => !i.inFridge);
                return (
                  <>
                    <div className="h-44 relative">
                      <RecipePhoto title={r.title} size="lg" />
                      <button onClick={() => setDetailRecipe(null)} className="absolute top-3 right-3 p-1.5 rounded-full bg-white/20 backdrop-blur-sm z-10">
                        <X className="w-5 h-5 text-white" />
                      </button>
                    </div>
                    <div className="p-5">
                      <h2 className="text-xl font-bold mb-3" style={{ color: '#1E1B4B' }}>{r.title}</h2>
                      <div className="grid grid-cols-4 gap-2 mb-4">
                        {[
                          { label: (t.diary as any)?.kcalUnit || 'kcal', value: r.nutrition.calories, color: cc.text },
                          { label: t.dashboard.protein, value: `${r.nutrition.protein}${(t.nutritionCalc as any)?.unitG || 'g'}`, color: '#059669' },
                          { label: t.dashboard.fat, value: `${r.nutrition.fat}${(t.nutritionCalc as any)?.unitG || 'g'}`, color: '#EA580C' },
                          { label: t.dashboard.carbs, value: `${r.nutrition.carbs}${(t.nutritionCalc as any)?.unitG || 'g'}`, color: '#2563EB' },
                        ].map((n) => (
                          <div key={n.label} className="text-center p-2 rounded-xl" style={{ backgroundColor: '#F5F3FF' }}>
                            <p className="text-base font-bold" style={{ color: n.color }}>{n.value}</p>
                            <p className="text-[10px] font-medium" style={{ color: '#6B7280' }}>{n.label}</p>
                          </div>
                        ))}
                      </div>
                      <h3 className="text-sm font-bold mb-2" style={{ color: '#1E1B4B' }}>{t.recipes.ingredients}</h3>
                      {/* Missing ingredients banner */}
                      {missing.length > 0 && (
                        <div className="flex items-center justify-between p-2.5 rounded-xl mb-2" style={{ backgroundColor: '#FEF3C7', border: '1px solid #FDE68A' }}>
                          <span className="text-xs font-semibold" style={{ color: '#92400E' }}>
                            🛒 {(t.recipes as any).needItems?.replace('{count}', String(missing.length)) || `Need ${missing.length} ingredients`}
                          </span>
                          <button
                            onClick={(e) => { e.stopPropagation(); addMissingToShopping(r.ingredients); }}
                            className="text-[11px] font-bold px-2.5 py-1 rounded-lg text-white shrink-0"
                            style={{ backgroundColor: '#7C3AED' }}
                          >
                            {(t.recipes as any).addAllMissing || 'Add all missing →'}
                          </button>
                        </div>
                      )}
                      <div className="space-y-1.5 mb-4">
                        {r.ingredients.map((ing, idx) => {
                          const isAdded = addedIngredients.has(ing.name);
                          return (
                            <div key={idx} className="flex items-center justify-between p-2 rounded-lg text-sm" style={{ backgroundColor: '#FAFAFE' }}>
                              <span style={{ color: ing.inFridge ? '#1E1B4B' : '#6B7280' }}>
                                {!ing.inFridge && '🛒 '}{ing.name}
                                <span className="ml-2" style={{ color: '#9CA3AF' }}>{ing.amount}</span>
                              </span>
                              {ing.inFridge ? (
                                <span className="text-xs font-medium" style={{ color: '#059669' }}>✅</span>
                              ) : isAdded ? (
                                <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: '#D1FAE5', color: '#059669' }}>✓</span>
                              ) : (
                                <button
                                  onClick={(e) => { e.stopPropagation(); addSingleToShopping(ing); }}
                                  className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
                                  style={{ backgroundColor: '#7C3AED' }}
                                >
                                  <Plus className="w-3.5 h-3.5 text-white" />
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                      <h3 className="text-sm font-bold mb-2" style={{ color: '#1E1B4B' }}>{t.recipes.instructions}</h3>
                      <ol className="space-y-2 mb-5">
                        {r.instructions.map((step, idx) => (
                          <li key={idx} className="flex gap-3 text-sm" style={{ color: '#374151' }}>
                            <span className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: '#7C3AED' }}>{idx + 1}</span>
                            <span className="pt-0.5">{step}</span>
                          </li>
                        ))}
                      </ol>
                      <div className="flex gap-2">
                        {'id' in detailRecipe ? (
                          <button onClick={() => { toggleFavorite((detailRecipe as SavedRecipe).id, (detailRecipe as SavedRecipe).is_favorite); setDetailRecipe(null); }}
                            className="flex-1 h-11 rounded-xl font-semibold text-sm border-[1.5px] flex items-center justify-center gap-2" style={{ borderColor: '#7C3AED', color: '#7C3AED' }}>
                            <Heart className="w-4 h-4" /> {(detailRecipe as SavedRecipe).is_favorite ? t.recipes.unfavorite : t.recipes.save}
                          </button>
                        ) : (
                          <button onClick={() => { handleSaveRecipe(detailRecipe as Recipe); setDetailRecipe(null); }}
                            className="flex-1 h-11 rounded-xl font-semibold text-sm border-[1.5px] flex items-center justify-center gap-2" style={{ borderColor: '#7C3AED', color: '#7C3AED' }}>
                            <Heart className="w-4 h-4" /> {t.recipes.save}
                          </button>
                        )}
                        <button onClick={() => { addMissingToShopping(r.ingredients); setDetailRecipe(null); }}
                          className="flex-1 h-11 rounded-xl font-semibold text-sm text-white flex items-center justify-center gap-2" style={{ backgroundColor: '#7C3AED' }}>
                          <ShoppingCart className="w-4 h-4" />
                          {missing.length > 0 ? t.recipes.addToList.replace('{count}', String(missing.length)) : t.recipes.allAvailable}
                        </button>
                      </div>
                    </div>
                  </>
                );
              })()}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <UpgradeModal open={upgradeOpen} onOpenChange={setUpgradeOpen} title={t.recipes.recipeLimit} description={t.recipes.recipeLimitDesc} suggestedPlan="lite" />

      {/* Delete confirmation dialog */}
      <AnimatePresence>
        {deleteConfirmId && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={() => setDeleteConfirmId(null)}>
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-2xl p-6 w-full max-w-xs text-center" onClick={(e) => e.stopPropagation()}>
              <p className="text-base font-semibold mb-4" style={{ color: '#1E1B4B' }}>
                {(t.recipes as any).deleteFromSaved || 'Remove from saved?'}
              </p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteConfirmId(null)}
                  className="flex-1 h-10 rounded-xl font-semibold text-sm border-[1.5px]" style={{ borderColor: '#DDD6FE', color: '#6B7280' }}>
                  {t.common.cancel}
                </button>
                <button onClick={() => handleDeleteRecipe(deleteConfirmId)}
                  className="flex-1 h-10 rounded-xl font-semibold text-sm text-white" style={{ backgroundColor: '#DC2626' }}>
                  {t.common.delete}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      </>
      )}
    </div>
  );
};

export default Recipes;
