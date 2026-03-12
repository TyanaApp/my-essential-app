import { useState, useEffect, lazy, Suspense, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, ChevronDown, Clock, Trash2, RefreshCw, ShoppingCart, Plus } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import RecipePhoto from '@/components/RecipePhoto';
import RecipeDetailModal from '@/components/recipes/RecipeDetailModal';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useFamily } from '@/hooks/useFamily';
import { toast } from 'sonner';
import { useSubscription } from '@/hooks/useSubscription';
import UpgradeModal from '@/components/UpgradeModal';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useTranslation } from '@/hooks/useTranslation';
import { useStreak } from '@/hooks/useStreak';
import MealPlan from '@/pages/MealPlan';
const NutritionCalculator = lazy(() => import('@/pages/NutritionCalculator'));

interface Ingredient { name: string; amount: string; inFridge: boolean; }
interface Nutrition { calories: number; protein: number; fat: number; carbs: number; }
interface Recipe {
  title: string; imageQuery?: string; ingredients: Ingredient[]; instructions: string[];
  nutrition: Nutrition; prepTime: number; estimatedCost: number;
  category?: 'now' | 'buy'; missingIngredients?: string[]; estimatedShoppingCost?: number;
}
interface SavedRecipe { id: string; title: string; ingredients: Ingredient[] | null; instructions: string[] | null; nutrition: Nutrition | null; prep_time: number | null; estimated_cost: number | null; is_favorite: boolean; }

const MEAL_TYPE_KEYS = ['breakfast', 'lunch', 'dinner', 'snack'] as const;
const TIME_OPTION_KEYS = ['time15', 'time30', 'time1h', 'timeAny'] as const;
const TIME_VALUES = ['<15 min', '30 min', '1 hour', 'Any'];
const SERVING_OPTIONS = [1, 2, 3, 4, 5];

// Track previously generated recipes to avoid duplicates
const getPreviousRecipes = (userId: string): string[] => {
  try {
    const stored = localStorage.getItem(`generated_recipes_${userId}`);
    return stored ? JSON.parse(stored) : [];
  } catch { return []; }
};

const savePreviousRecipes = (userId: string, titles: string[]) => {
  const existing = getPreviousRecipes(userId);
  const updated = [...existing, ...titles.map(t => t.toLowerCase().trim())];
  const trimmed = updated.slice(-20);
  localStorage.setItem(`generated_recipes_${userId}`, JSON.stringify(trimmed));
};

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
  const [unfavConfirmId, setUnfavConfirmId] = useState<string | null>(null);

  const [cookingFor, setCookingFor] = useState(2);
  const [selectedMeals, setSelectedMeals] = useState<string[]>(['dinner']);
  const [timeAvailable, setTimeAvailable] = useState('30 min');
  const [useOnlyInventory, setUseOnlyInventory] = useState(() => {
    try { return localStorage.getItem('only_from_inventory') === 'true'; } catch { return false; }
  });
  const [generating, setGenerating] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const [generatedRecipes, setGeneratedRecipes] = useState<Recipe[]>([]);
  const [fewIngredients, setFewIngredients] = useState(false);
  const [savedRecipes, setSavedRecipes] = useState<SavedRecipe[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [userGoals, setUserGoals] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [detailRecipe, setDetailRecipe] = useState<Recipe | SavedRecipe | null>(null);
  const [addedIngredients, setAddedIngredients] = useState<Set<string>>(new Set());
  const [showSettings, setShowSettings] = useState(true);

  const [recipeTab, setRecipeTab] = useState<'suggested' | 'saved'>('suggested');
  const [savedTitles, setSavedTitles] = useState<Set<string>>(new Set());

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
      if (recipesRes.data) {
        const recipes = recipesRes.data as unknown as SavedRecipe[];
        setSavedRecipes(recipes);
        setSavedTitles(new Set(recipes.map(r => r.title.toLowerCase())));
      }
      setLoading(false);
    };
    load();
  }, [user]);

  const toggleMeal = (m: string) => {
    setSelectedMeals((prev) => prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]);
  };

  const favoriteRecipes = savedRecipes.filter(r => r.is_favorite);
  const favCount = favoriteRecipes.length;

  // Split generated recipes into categories
  const nowRecipes = generatedRecipes.filter(r => r.category === 'now');
  const buyRecipes = generatedRecipes.filter(r => r.category === 'buy');
  // Fallback: if no category field, treat all as "now"
  const uncategorized = generatedRecipes.filter(r => !r.category);

  const handleGenerate = async (append = false) => {
    if (!user) return;
    if (append) setLoadingMore(true); else setGenerating(true);
    try {
      const excludeNames = savedRecipes.map(r => r.title);
      if (!append) {
        generatedRecipes.forEach(r => excludeNames.push(r.title));
      }
      const previousRecipes = getPreviousRecipes(user.id);

      const { data, error } = await supabase.functions.invoke('generate-recipes', {
        body: {
          mealType: selectedMeals.join(', '), cookingFor, timeAvailable,
          inventory, userGoals: userGoals || {}, language,
          excludeRecipes: excludeNames,
          previousRecipes,
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
        // Save to previous recipes tracker
        savePreviousRecipes(user.id, recipes.map(r => r.title));
        setFewIngredients(!!data?.fewIngredients);

        if (append) {
          setGeneratedRecipes(prev => [...prev, ...recipes]);
        } else {
          setGeneratedRecipes(recipes);
          setShowSettings(false);
        }
        toast.success(t.recipes.recipesGenerated.replace('{count}', String(recipes.length)));
        await updateStreak();
      }
    } catch {
      toast.error(t.recipes.failedGenerate);
    } finally {
      setGenerating(false);
      setLoadingMore(false);
    }
  };

  const handleSaveRecipe = async (recipe: Recipe) => {
    if (!user) return;
    const limit = plan === 'free' ? 3 : plan === 'lite' ? 50 : Infinity;
    if (savedRecipes.length >= limit) { setUpgradeOpen(true); return; }
    try {
      const { error } = await supabase.from('recipes').insert({
        user_id: user.id, title: recipe.title, ingredients: recipe.ingredients as any,
        instructions: recipe.instructions, nutrition: recipe.nutrition as any,
        prep_time: recipe.prepTime, estimated_cost: recipe.estimatedCost, is_favorite: true,
      });
      if (error) throw error;
      toast.success((t.recipes as any).savedToFavorites || 'Saved to favorites ♥️');
      const { data } = await supabase.from('recipes').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
      if (data) {
        const recipes = data as unknown as SavedRecipe[];
        setSavedRecipes(recipes);
        setSavedTitles(new Set(recipes.map(r => r.title.toLowerCase())));
      }
    } catch { toast.error(t.recipes.failedSave); }
  };

  const handleUnfavorite = async (id: string) => {
    try {
      const { error } = await supabase.from('recipes').delete().eq('id', id).eq('user_id', user!.id);
      if (error) throw error;
      setSavedRecipes(prev => {
        const updated = prev.filter(r => r.id !== id);
        setSavedTitles(new Set(updated.map(r => r.title.toLowerCase())));
        return updated;
      });
      setUnfavConfirmId(null);
      setDetailRecipe(null);
      toast.success((t.recipes as any).recipeDeleted || 'Recipe removed');
    } catch {
      toast.error(t.common.error);
    }
  };

  const handleDeleteRecipe = async (id: string) => {
    if (!user) return;
    try {
      const { error } = await supabase.from('recipes').delete().eq('id', id).eq('user_id', user.id);
      if (error) throw error;
      setSavedRecipes(prev => {
        const updated = prev.filter(r => r.id !== id);
        setSavedTitles(new Set(updated.map(r => r.title.toLowerCase())));
        return updated;
      });
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

  const addMissingListToShopping = async (missingItems: string[]) => {
    if (!user || missingItems.length === 0) return;
    const items = missingItems.map(name => ({ user_id: user.id, name, quantity: 1, unit: 'pcs' }));
    await supabase.from('shopping_items').insert(items as any);
    setAddedIngredients(prev => {
      const next = new Set(prev);
      missingItems.forEach(n => next.add(n));
      return next;
    });
    toast.success(t.recipes.itemsAdded.replace('{count}', String(missingItems.length)));
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

  const getMatchPercent = (ingredients: Ingredient[]) => {
    if (!ingredients || ingredients.length === 0) return 0;
    const matched = ingredients.filter(i => i.inFridge).length;
    return Math.round((matched / ingredients.length) * 100);
  };

  const normalizeRecipe = (r: Recipe | SavedRecipe) => {
    if ('id' in r) {
      return { title: r.title, imageQuery: undefined, ingredients: (r.ingredients || []) as Ingredient[], instructions: (r.instructions || []) as string[], nutrition: (r.nutrition || { calories: 0, protein: 0, fat: 0, carbs: 0 }) as Nutrition, prepTime: r.prep_time || 0, estimatedCost: r.estimated_cost || 0 };
    }
    return r;
  };

  const rt = (t.recipes as any);

  // Suggested recipe card
  const SuggestedCard = ({ recipe }: { recipe: Recipe }) => {
    const n = recipe;
    const isSaved = savedTitles.has(n.title.toLowerCase());
    const matchPct = getMatchPercent(n.ingredients);
    const isBuyCategory = n.category === 'buy';
    const missingAlreadyAdded = (n.missingIngredients || []).every(m => addedIngredients.has(m));

    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-2xl overflow-hidden cursor-pointer relative"
        style={{ boxShadow: '0 2px 12px rgba(124,58,237,0.06)' }}
        onClick={() => { setAddedIngredients(new Set()); setDetailRecipe(recipe); }}
      >
        <div className="relative">
          <RecipePhoto title={n.title} imageQuery={n.imageQuery} size="sm" />
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (!isSaved) handleSaveRecipe(recipe);
            }}
            className="absolute top-2 right-2 w-8 h-8 rounded-full bg-card/80 backdrop-blur-sm flex items-center justify-center transition-transform active:scale-125"
          >
            <Heart
              className="w-5 h-5 transition-colors"
              fill={isSaved ? 'hsl(var(--primary))' : 'none'}
              stroke={isSaved ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))'}
            />
          </button>
        </div>
        <div className="p-3">
          <h3 className="text-sm font-bold leading-tight text-foreground line-clamp-2 mb-1.5">{n.title}</h3>
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-0.5"><Clock className="w-3 h-3" /> {n.prepTime} {rt?.minUnit || 'min'}</span>
            <span>🔥 {n.nutrition.calories} {(t.diary as any)?.kcalUnit || 'kcal'}</span>
          </div>
          {!isBuyCategory && matchPct > 0 && (
            <p className="text-[11px] font-medium mt-1" style={{ color: matchPct >= 80 ? '#059669' : '#EA580C' }}>
              ✅ {(rt.matchPercent || '{pct}% from inventory').replace('{pct}', String(matchPct))}
            </p>
          )}
          {isBuyCategory && (n.missingIngredients || []).length > 0 && (
            <div className="mt-1.5">
              <p className="text-[10px] text-muted-foreground line-clamp-1">
                {rt.buyNeeded || 'Need'}: {(n.missingIngredients || []).join(', ')}
                {n.estimatedShoppingCost ? ` (~€${n.estimatedShoppingCost})` : ''}
              </p>
              {!missingAlreadyAdded && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    addMissingListToShopping(n.missingIngredients || []);
                  }}
                  className="mt-1 flex items-center gap-1 text-[10px] font-semibold text-primary"
                >
                  <Plus className="w-3 h-3" />
                  {rt.addToShoppingShort || 'Add to list'}
                </button>
              )}
            </div>
          )}
        </div>
      </motion.div>
    );
  };

  // Saved recipe card
  const SavedCard = ({ recipe }: { recipe: SavedRecipe }) => {
    const n = normalizeRecipe(recipe);

    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-2xl overflow-hidden cursor-pointer relative"
        style={{ boxShadow: '0 2px 12px rgba(124,58,237,0.06)' }}
        onClick={() => { setAddedIngredients(new Set()); setDetailRecipe(recipe); }}
      >
        <div className="relative">
          <RecipePhoto title={n.title} imageQuery={n.imageQuery} size="sm" />
          <button
            onClick={(e) => {
              e.stopPropagation();
              setUnfavConfirmId(recipe.id);
            }}
            className="absolute top-2 right-2 w-8 h-8 rounded-full bg-card/80 backdrop-blur-sm flex items-center justify-center"
          >
            <Heart className="w-5 h-5" fill="hsl(var(--primary))" stroke="hsl(var(--primary))" />
          </button>
        </div>
        <div className="p-3">
          <h3 className="text-sm font-bold leading-tight text-foreground line-clamp-2 mb-1.5">{n.title}</h3>
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-0.5"><Clock className="w-3 h-3" /> {n.prepTime} {rt?.minUnit || 'min'}</span>
            <span>🔥 {n.nutrition.calories} {(t.diary as any)?.kcalUnit || 'kcal'}</span>
          </div>
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

  const hasNowRecipes = nowRecipes.length > 0 || uncategorized.length > 0;
  const hasBuyRecipes = buyRecipes.length > 0;

  return (
    <div className="min-h-screen p-6 pb-mobile-safe">
      {/* Main tab bar */}
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
      {/* Inner tab bar */}
      <div className="flex gap-1 mb-4 bg-secondary rounded-xl p-1">
        <button
          onClick={() => setRecipeTab('suggested')}
          className="flex-1 py-2 rounded-lg text-sm font-semibold transition-all"
          style={{
            backgroundColor: recipeTab === 'suggested' ? 'hsl(var(--primary))' : 'transparent',
            color: recipeTab === 'suggested' ? 'hsl(var(--primary-foreground))' : 'hsl(var(--muted-foreground))',
          }}
        >
          {rt.tabSuggested || '✨ Suggested'}
        </button>
        <button
          onClick={() => setRecipeTab('saved')}
          className="flex-1 py-2 rounded-lg text-sm font-semibold transition-all relative"
          style={{
            backgroundColor: recipeTab === 'saved' ? 'hsl(var(--primary))' : 'transparent',
            color: recipeTab === 'saved' ? 'hsl(var(--primary-foreground))' : 'hsl(var(--muted-foreground))',
          }}
        >
          {rt.tabSaved || '♥️ Saved'}
          {favCount > 0 && recipeTab !== 'saved' && (
            <span className="ml-1 inline-flex items-center justify-center w-5 h-5 text-[10px] font-bold rounded-full bg-primary text-primary-foreground">
              {favCount}
            </span>
          )}
          {favCount > 0 && recipeTab === 'saved' && (
            <span className="ml-1 text-[11px] font-bold">{favCount}</span>
          )}
        </button>
      </div>

      {/* Only from inventory toggle */}
      <div className="flex items-center justify-between mb-4 px-1">
        <span className="text-sm text-foreground">{rt.onlyFromHome || 'Only from what I have at home'}</span>
        <Switch
          checked={useOnlyInventory}
          onCheckedChange={(checked) => {
            setUseOnlyInventory(checked);
            localStorage.setItem('only_from_inventory', String(checked));
          }}
        />
      </div>

      {recipeTab === 'suggested' ? (
        <>
          {/* Generation settings */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <button onClick={() => setShowSettings(!showSettings)} className="flex items-center gap-2 text-sm font-semibold text-primary">
                {t.recipes.generate}
                <ChevronDown className="w-4 h-4 transition-transform" style={{ transform: showSettings ? 'rotate(180deg)' : 'rotate(0deg)' }} />
              </button>
              {generatedRecipes.length > 0 && (
                <button
                  onClick={() => handleGenerate(false)}
                  disabled={generating}
                  className="flex items-center gap-1.5 text-xs font-semibold text-primary"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${generating ? 'animate-spin' : ''}`} />
                  {rt.newRecipes || '🔄 New recipes'}
                </button>
              )}
            </div>

            <AnimatePresence>
              {showSettings && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                  <div className="rounded-2xl p-4 space-y-4 bg-secondary border border-border">
                    <div>
                      <label className="text-xs font-semibold mb-1.5 block text-foreground">{t.recipes.cookingFor}</label>
                      <div className="flex gap-2">
                        {SERVING_OPTIONS.map((n) => (
                          <button key={n} onClick={() => setCookingFor(n)}
                            className={`w-10 h-10 rounded-xl text-sm font-bold border-[1.5px] transition-all ${cookingFor === n ? 'border-primary bg-primary/15 text-primary' : 'border-border bg-card text-muted-foreground'}`}>
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
                            className={`px-3 py-1.5 rounded-full text-xs font-medium border-[1.5px] transition-all ${selectedMeals.includes(key) ? 'border-primary bg-primary/15 text-primary' : 'border-border bg-card text-muted-foreground'}`}>
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
                            className={`px-3 py-1.5 rounded-full text-xs font-medium border-[1.5px] transition-all ${timeAvailable === TIME_VALUES[i] ? 'border-primary bg-primary/15 text-primary' : 'border-border bg-card text-muted-foreground'}`}>
                            {t.recipes[key]}
                          </button>
                        ))}
                      </div>
                    </div>

                    <button onClick={() => handleGenerate(false)} disabled={generating || selectedMeals.length === 0}
                      className="w-full h-12 rounded-xl text-primary-foreground font-semibold text-sm transition-opacity disabled:opacity-40 bg-primary">
                      {generating ? (
                        <span className="flex items-center justify-center gap-2">
                          <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                          {t.recipes.generating}
                        </span>
                      ) : t.recipes.generateBtn}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Two-category recipe display */}
          {generatedRecipes.length > 0 && (
            <div className="space-y-6">
              {/* Few ingredients banner */}
              {fewIngredients && (
                <div className="bg-secondary rounded-2xl p-4 border border-border">
                  <p className="text-sm font-medium text-foreground mb-2">💡 {rt.fewIngredientsMsg || 'You have few ingredients. Here\'s what you can make:'}</p>
                  <details className="mt-2">
                    <summary className="text-xs font-semibold text-primary cursor-pointer">
                      🛒 {rt.buyForVariety || 'What to buy for more variety'}
                    </summary>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {['stapleEggs', 'stapleMilk', 'stapleBread', 'stapleButter', 'stapleVeggies', 'stapleGrains'].map(key => (
                        <span key={key} className="px-2.5 py-1 rounded-full bg-card text-xs text-foreground border border-border">
                          {(rt as any)[key] || key}
                        </span>
                      ))}
                    </div>
                  </details>
                </div>
              )}

              {/* Category A: Cook right now */}
              {hasNowRecipes && (
                <div>
                  <h2 className="text-base font-bold text-foreground mb-1">🥘 {rt.categoryNowTitle || 'Cook right now'}</h2>
                  <p className="text-xs text-muted-foreground mb-3">{rt.categoryNowSub || 'From what you have'}</p>
                  <div className="grid grid-cols-2 gap-3">
                    {[...nowRecipes, ...uncategorized].map((r, idx) => (
                      <SuggestedCard key={`now-${idx}-${r.title}`} recipe={r} />
                    ))}
                  </div>
                </div>
              )}

              {/* Category B: Buy a little more */}
              {hasBuyRecipes && !useOnlyInventory && (
                <div>
                  <h2 className="text-base font-bold text-foreground mb-1">🛒 {rt.categoryBuyTitle || 'Buy a little more'}</h2>
                  <p className="text-xs text-muted-foreground mb-3">{rt.categoryBuySub || 'Better with a few additions'}</p>
                  <div className="grid grid-cols-2 gap-3">
                    {buyRecipes.map((r, idx) => (
                      <SuggestedCard key={`buy-${idx}-${r.title}`} recipe={r} />
                    ))}
                  </div>
                </div>
              )}

              {/* Empty state when toggle ON but no "now" recipes */}
              {useOnlyInventory && !hasNowRecipes && (
                <div className="bg-secondary rounded-2xl p-6 text-center">
                  <p className="text-3xl mb-3">🥗</p>
                  <p className="text-sm font-medium text-foreground mb-2">{rt.addProductsEmpty || 'Add products to get recipes'}</p>
                  <div className="flex gap-2 justify-center mt-3">
                    <button onClick={() => navigate('/inventory')} className="px-4 py-2 rounded-xl text-xs font-semibold bg-primary text-primary-foreground">
                      {rt.addProducts || '+ Add products'}
                    </button>
                  </div>
                </div>
              )}

              {/* No cookable ingredients message */}
              {!hasNowRecipes && hasBuyRecipes && (
                <div className="bg-secondary rounded-2xl p-4 text-center mb-4">
                  <p className="text-sm font-medium text-foreground mb-2">{rt.noCookableItems || 'No cookable ingredients at home'}</p>
                  <p className="text-xs text-muted-foreground mb-3">{rt.noCookableHint || 'Here\'s what you can make if you shop'}</p>
                  <div className="flex gap-2 justify-center">
                    <button onClick={() => navigate('/inventory')} className="px-4 py-2 rounded-xl text-xs font-semibold bg-primary text-primary-foreground">
                      {rt.addProducts || '+ Add products'}
                    </button>
                  </div>
                </div>
              )}

              {/* Load more */}
              <button
                onClick={() => handleGenerate(true)}
                disabled={loadingMore}
                className="w-full py-3 rounded-xl border border-border text-sm font-semibold text-primary bg-card hover:bg-secondary transition-colors"
              >
                {loadingMore ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {t.recipes.generating}
                  </span>
                ) : (rt.loadMore || '+ Show more recipes')}
              </button>
            </div>
          )}

          {/* Empty state */}
          {generatedRecipes.length === 0 && !showSettings && (
            <div className="text-center py-16">
              <div className="text-5xl mb-4">🍳</div>
              <p className="text-base font-medium mb-1 text-foreground">{t.recipes.noRecipes}</p>
              <p className="text-sm text-muted-foreground">{t.recipes.noRecipesHint}</p>
            </div>
          )}
        </>
      ) : (
        /* Saved tab */
        <>
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-7 h-7 border-[3px] rounded-full animate-spin border-accent border-t-primary" />
            </div>
          ) : favoriteRecipes.length > 0 ? (
            <div className="grid grid-cols-2 gap-3">
              {favoriteRecipes.map((r) => (
                <SavedCard key={r.id} recipe={r} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="text-5xl mb-4">♥️</div>
              <p className="text-base font-medium mb-1 text-foreground">
                {rt.emptyFavTitle || 'Your favorite recipes will appear here'}
              </p>
              <p className="text-sm text-muted-foreground">
                {rt.emptyFavHint || 'Tap ♡ on any recipe to save it'}
              </p>
            </div>
          )}
        </>
      )}

      {/* Recipe Detail Modal */}
      {detailRecipe && (
        <RecipeDetailModal
          recipe={normalizeRecipe(detailRecipe)}
          savedId={'id' in detailRecipe ? (detailRecipe as SavedRecipe).id : undefined}
          isFavorite={'id' in detailRecipe ? (detailRecipe as SavedRecipe).is_favorite : false}
          onClose={() => setDetailRecipe(null)}
          onToggleFavorite={(id, current) => {
            if (current) {
              setUnfavConfirmId(id);
            } else {
              supabase.from('recipes').update({ is_favorite: true }).eq('id', id).then(() => {
                setSavedRecipes(prev => prev.map(r => r.id === id ? { ...r, is_favorite: true } : r));
                toast.success(rt.savedToFavorites || 'Saved to favorites ♥️');
              });
            }
          }}
          onSave={() => { if (!('id' in detailRecipe)) handleSaveRecipe(detailRecipe as Recipe); }}
          inventory={inventory as any}
          dailyTarget={dailyTarget}
        />
      )}

      <UpgradeModal open={upgradeOpen} onOpenChange={setUpgradeOpen} />

      {/* Unfavorite confirmation */}
      <AnimatePresence>
        {unfavConfirmId && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={() => setUnfavConfirmId(null)}>
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
              className="bg-card rounded-2xl p-6 w-full max-w-xs text-center" onClick={(e) => e.stopPropagation()}>
              <p className="text-base font-semibold mb-4 text-foreground">
                {rt.removeFromSaved || 'Remove from saved?'}
              </p>
              <div className="flex gap-3">
                <button onClick={() => setUnfavConfirmId(null)}
                  className="flex-1 h-10 rounded-xl font-semibold text-sm border-[1.5px] border-border text-muted-foreground">
                  {t.common.cancel}
                </button>
                <button onClick={() => handleUnfavorite(unfavConfirmId)}
                  className="flex-1 h-10 rounded-xl font-semibold text-sm text-primary-foreground bg-destructive">
                  {rt.removeBtn || 'Remove'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete confirmation */}
      <AnimatePresence>
        {deleteConfirmId && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={() => setDeleteConfirmId(null)}>
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
              className="bg-card rounded-2xl p-6 w-full max-w-xs text-center" onClick={(e) => e.stopPropagation()}>
              <p className="text-base font-semibold mb-4 text-foreground">
                {rt.deleteFromSaved || 'Remove from saved?'}
              </p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteConfirmId(null)}
                  className="flex-1 h-10 rounded-xl font-semibold text-sm border-[1.5px] border-border text-muted-foreground">
                  {t.common.cancel}
                </button>
                <button onClick={() => handleDeleteRecipe(deleteConfirmId)}
                  className="flex-1 h-10 rounded-xl font-semibold text-sm text-primary-foreground bg-destructive">
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
