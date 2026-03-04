import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, X, ShoppingCart, Clock, DollarSign, Check, ChevronDown } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useSubscription, PLAN_LIMITS } from '@/hooks/useSubscription';
import UpgradeModal from '@/components/UpgradeModal';
import { usePageTitle } from '@/hooks/usePageTitle';

interface Ingredient {
  name: string;
  amount: string;
  inFridge: boolean;
}

interface Nutrition {
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
}

interface Recipe {
  title: string;
  ingredients: Ingredient[];
  instructions: string[];
  nutrition: Nutrition;
  prepTime: number;
  estimatedCost: number;
}

interface SavedRecipe {
  id: string;
  title: string;
  ingredients: Ingredient[] | null;
  instructions: string[] | null;
  nutrition: Nutrition | null;
  prep_time: number | null;
  estimated_cost: number | null;
  is_favorite: boolean;
}

const MEAL_TYPES = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];
const TIME_OPTIONS = ['<15 min', '30 min', '1 hour', 'Any'];
const SERVING_OPTIONS = [1, 2, 3, 4, 5];

const Recipes = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  usePageTitle('Recipes');
  const { plan } = useSubscription();
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  // Generation settings
  const [cookingFor, setCookingFor] = useState(2);
  const [selectedMeals, setSelectedMeals] = useState<string[]>(['Dinner']);
  const [timeAvailable, setTimeAvailable] = useState('30 min');
  const [useOnlyInventory, setUseOnlyInventory] = useState(false);
  const [generating, setGenerating] = useState(false);

  // Data
  const [generatedRecipes, setGeneratedRecipes] = useState<Recipe[]>([]);
  const [savedRecipes, setSavedRecipes] = useState<SavedRecipe[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [userGoals, setUserGoals] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Detail modal
  const [detailRecipe, setDetailRecipe] = useState<Recipe | SavedRecipe | null>(null);
  const [showSettings, setShowSettings] = useState(true);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const [invRes, goalsRes, recipesRes] = await Promise.all([
        supabase.from('inventory_items').select('name, quantity, unit').eq('user_id', user.id),
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
    setSelectedMeals((prev) =>
      prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]
    );
  };

  const handleGenerate = async () => {
    if (!user) return;
    // Check if inventory is empty
    if (inventory.length === 0) {
      return; // UI will show empty state via showEmptyInventory
    }
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-recipes', {
        body: {
          mealType: selectedMeals.join(', '),
          cookingFor,
          timeAvailable,
          useOnlyInventory,
          inventory,
          userGoals: userGoals || {},
        },
      });
      if (error) throw error;
      const recipes: Recipe[] = data?.recipes || [];
      if (recipes.length === 0) {
        toast.error('No recipes generated. Try different settings.');
      } else {
        setGeneratedRecipes(recipes);
        setShowSettings(false);
        toast.success(`${recipes.length} recipes generated ✨`);
      }
    } catch (err) {
      console.error('Generate error:', err);
      toast.error('Failed to generate recipes');
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveRecipe = async (recipe: Recipe) => {
    if (!user) return;
    // Check plan limit
    const limit = PLAN_LIMITS[plan].maxRecipes;
    if (savedRecipes.length >= limit) {
      setUpgradeOpen(true);
      return;
    }
    try {
      const { error } = await supabase.from('recipes').insert({
        user_id: user.id,
        title: recipe.title,
        ingredients: recipe.ingredients as any,
        instructions: recipe.instructions,
        nutrition: recipe.nutrition as any,
        prep_time: recipe.prepTime,
        estimated_cost: recipe.estimatedCost,
        is_favorite: false,
      });
      if (error) throw error;
      toast.success(`"${recipe.title}" saved ❤️`);
      // Refresh saved
      const { data } = await supabase.from('recipes').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
      if (data) setSavedRecipes(data as unknown as SavedRecipe[]);
    } catch (err) {
      toast.error('Failed to save recipe');
    }
  };

  const toggleFavorite = async (id: string, current: boolean) => {
    await supabase.from('recipes').update({ is_favorite: !current }).eq('id', id);
    setSavedRecipes((prev) =>
      prev.map((r) => (r.id === id ? { ...r, is_favorite: !current } : r))
    );
  };

  const addMissingToShopping = async (ingredients: Ingredient[]) => {
    if (!user) return;
    const missing = ingredients.filter((i) => !i.inFridge);
    if (missing.length === 0) {
      toast.info('All ingredients available!');
      return;
    }
    const items = missing.map((i) => ({
      user_id: user.id,
      name: i.name,
      quantity: 1,
      unit: 'pcs',
    }));
    await supabase.from('shopping_items').insert(items as any);
    toast.success(`${missing.length} items added to shopping list`);
  };

  const dailyTarget = userGoals?.daily_calories_target || 2000;

  const calorieColor = (cal: number) => {
    const pct = cal / dailyTarget;
    if (pct <= 0.3) return { bg: '#D1FAE5', text: '#059669' };
    if (pct <= 0.5) return { bg: '#FEF3C7', text: '#EA580C' };
    return { bg: '#FEE2E2', text: '#DC2626' };
  };

  const isRecipeSaved = (recipe: Recipe) => detailRecipe && 'id' in detailRecipe;

  // Normalize recipe for detail modal
  const normalizeRecipe = (r: Recipe | SavedRecipe): {
    title: string;
    ingredients: Ingredient[];
    instructions: string[];
    nutrition: Nutrition;
    prepTime: number;
    estimatedCost: number;
  } => {
    if ('id' in r) {
      return {
        title: r.title,
        ingredients: (r.ingredients || []) as Ingredient[],
        instructions: (r.instructions || []) as string[],
        nutrition: (r.nutrition || { calories: 0, protein: 0, fat: 0, carbs: 0 }) as Nutrition,
        prepTime: r.prep_time || 0,
        estimatedCost: r.estimated_cost || 0,
      };
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
        className="bg-white rounded-2xl overflow-hidden cursor-pointer"
        style={{ boxShadow: '0 2px 12px rgba(124,58,237,0.06)' }}
        onClick={() => setDetailRecipe(recipe)}
      >
        {/* Gradient placeholder */}
        <div
          className="h-40 flex items-center justify-center text-5xl"
          style={{
            background: 'linear-gradient(135deg, #7C3AED 0%, #A78BFA 50%, #C4B5FD 100%)',
          }}
        >
          🍽
        </div>
        <div className="p-4">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="text-base font-bold leading-tight" style={{ color: '#1E1B4B' }}>
              {n.title}
            </h3>
            {isSaved && savedId && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFavorite(savedId, !!isFav);
                }}
                className="shrink-0 p-1"
              >
                <Heart
                  className="w-5 h-5"
                  fill={isFav ? '#7C3AED' : 'none'}
                  style={{ color: '#7C3AED' }}
                />
              </button>
            )}
            {!isSaved && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleSaveRecipe(recipe as Recipe);
                }}
                className="shrink-0 p-1"
              >
                <Heart className="w-5 h-5" style={{ color: '#7C3AED' }} />
              </button>
            )}
          </div>

          {/* Calorie badge */}
          <span
            className="inline-block text-xs font-semibold px-2 py-0.5 rounded-full mb-2"
            style={{ backgroundColor: cc.bg, color: cc.text }}
          >
            {n.nutrition.calories} kcal
          </span>

          {/* Meta */}
          <div className="flex items-center gap-3 text-xs mb-2" style={{ color: '#6B7280' }}>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> {n.prepTime} min
            </span>
            <span className="flex items-center gap-1">
              💰 est. €{n.estimatedCost?.toFixed(2)}
            </span>
          </div>

          {/* Ingredient status */}
          <p className="text-xs font-medium" style={{ color: missingCount === 0 ? '#059669' : '#EA580C' }}>
            {missingCount === 0 ? '✅ All ingredients available' : `🛒 Need ${missingCount} items`}
          </p>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen p-6 pb-24">
      <h1 className="text-2xl font-bold mb-5" style={{ color: '#1E1B4B' }}>Recipes</h1>

      {/* Generation settings panel */}
      <div className="mb-6">
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="flex items-center gap-2 text-sm font-semibold mb-3"
          style={{ color: '#7C3AED' }}
        >
          ✨ Generate New Recipes
          <ChevronDown
            className="w-4 h-4 transition-transform"
            style={{ transform: showSettings ? 'rotate(180deg)' : 'rotate(0deg)' }}
          />
        </button>

        <AnimatePresence>
          {showSettings && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div
                className="rounded-2xl p-4 space-y-4"
                style={{ backgroundColor: '#F5F3FF', border: '1px solid #DDD6FE' }}
              >
                {/* Cooking for */}
                <div>
                  <label className="text-xs font-semibold mb-1.5 block" style={{ color: '#1E1B4B' }}>
                    Cooking for:
                  </label>
                  <div className="flex gap-2">
                    {SERVING_OPTIONS.map((n) => (
                      <button
                        key={n}
                        onClick={() => setCookingFor(n)}
                        className="w-10 h-10 rounded-xl text-sm font-bold border-[1.5px] transition-all"
                        style={{
                          borderColor: cookingFor === n ? '#7C3AED' : '#DDD6FE',
                          backgroundColor: cookingFor === n ? '#EDE9FE' : 'white',
                          color: cookingFor === n ? '#7C3AED' : '#6B7280',
                        }}
                      >
                        {n}{n === 5 ? '+' : ''}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Meal type */}
                <div>
                  <label className="text-xs font-semibold mb-1.5 block" style={{ color: '#1E1B4B' }}>
                    Meal type:
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {MEAL_TYPES.map((m) => (
                      <button
                        key={m}
                        onClick={() => toggleMeal(m)}
                        className="px-3 py-1.5 rounded-full text-xs font-medium border-[1.5px] transition-all"
                        style={{
                          borderColor: selectedMeals.includes(m) ? '#7C3AED' : '#DDD6FE',
                          backgroundColor: selectedMeals.includes(m) ? '#EDE9FE' : 'white',
                          color: selectedMeals.includes(m) ? '#7C3AED' : '#6B7280',
                        }}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Time available */}
                <div>
                  <label className="text-xs font-semibold mb-1.5 block" style={{ color: '#1E1B4B' }}>
                    Time available:
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {TIME_OPTIONS.map((t) => (
                      <button
                        key={t}
                        onClick={() => setTimeAvailable(t)}
                        className="px-3 py-1.5 rounded-full text-xs font-medium border-[1.5px] transition-all"
                        style={{
                          borderColor: timeAvailable === t ? '#7C3AED' : '#DDD6FE',
                          backgroundColor: timeAvailable === t ? '#EDE9FE' : 'white',
                          color: timeAvailable === t ? '#7C3AED' : '#6B7280',
                        }}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Use only inventory toggle */}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold" style={{ color: '#1E1B4B' }}>
                    Use only what I have at home
                  </span>
                  <button
                    onClick={() => setUseOnlyInventory(!useOnlyInventory)}
                    className="w-11 h-6 rounded-full relative transition-colors"
                    style={{ backgroundColor: useOnlyInventory ? '#7C3AED' : '#D1D5DB' }}
                  >
                    <div
                      className="w-5 h-5 rounded-full bg-white absolute top-0.5 transition-all"
                      style={{ left: useOnlyInventory ? '22px' : '2px' }}
                    />
                  </button>
                </div>

                {/* Generate button */}
                {!loading && inventory.length === 0 ? (
                  <div className="text-center py-4 rounded-xl" style={{ backgroundColor: 'white' }}>
                    <div className="text-4xl mb-2">🧊</div>
                    <p className="text-sm font-bold mb-1" style={{ color: '#1E1B4B' }}>
                      Add some food first
                    </p>
                    <p className="text-xs mb-3" style={{ color: '#6B7280' }}>
                      Go to Inventory and add what you have at home — then TYANA will generate recipes just for you
                    </p>
                    <button
                      onClick={() => navigate('/inventory')}
                      className="px-4 py-2 rounded-xl text-sm font-semibold text-white"
                      style={{ backgroundColor: '#7C3AED' }}
                    >
                      Go to Inventory →
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleGenerate}
                    disabled={generating || selectedMeals.length === 0}
                    className="w-full h-12 rounded-xl text-white font-semibold text-sm transition-opacity disabled:opacity-40"
                    style={{ backgroundColor: '#7C3AED' }}
                  >
                    {generating ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Generating...
                      </span>
                    ) : (
                      'Generate Recipes ✨'
                    )}
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
          <h2 className="text-sm font-bold mb-3" style={{ color: '#1E1B4B' }}>
            ✨ Just Generated
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {generatedRecipes.map((r, idx) => (
              <RecipeCard key={`gen-${idx}`} recipe={r} />
            ))}
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
          <h2 className="text-sm font-bold mb-3" style={{ color: '#1E1B4B' }}>
            ❤️ Saved Recipes
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {savedRecipes.map((r) => (
              <RecipeCard key={r.id} recipe={r} isSaved savedId={r.id} isFav={r.is_favorite} />
            ))}
          </div>
        </div>
      ) : generatedRecipes.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">🍳</div>
          <p className="text-base font-medium mb-1" style={{ color: '#1E1B4B' }}>
            No recipes yet
          </p>
          <p className="text-sm" style={{ color: '#6B7280' }}>
            Generate your first AI-powered recipes above!
          </p>
        </div>
      ) : null}

      {/* Recipe Detail Modal */}
      <AnimatePresence>
        {detailRecipe && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
            onClick={() => setDetailRecipe(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto"
              style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}
              onClick={(e) => e.stopPropagation()}
            >
              {(() => {
                const r = normalizeRecipe(detailRecipe);
                const cc = calorieColor(r.nutrition.calories);
                const missing = r.ingredients.filter((i) => !i.inFridge);
                return (
                  <>
                    {/* Header image */}
                    <div
                      className="h-44 flex items-center justify-center text-6xl relative"
                      style={{
                        background: 'linear-gradient(135deg, #7C3AED 0%, #A78BFA 50%, #C4B5FD 100%)',
                      }}
                    >
                      🍽
                      <button
                        onClick={() => setDetailRecipe(null)}
                        className="absolute top-3 right-3 p-1.5 rounded-full bg-white/20 backdrop-blur-sm"
                      >
                        <X className="w-5 h-5 text-white" />
                      </button>
                    </div>

                    <div className="p-5">
                      <h2 className="text-xl font-bold mb-3" style={{ color: '#1E1B4B' }}>
                        {r.title}
                      </h2>

                      {/* Nutrition row */}
                      <div className="grid grid-cols-4 gap-2 mb-4">
                        {[
                          { label: 'kcal', value: r.nutrition.calories, color: cc.text },
                          { label: 'Protein', value: `${r.nutrition.protein}g`, color: '#059669' },
                          { label: 'Fat', value: `${r.nutrition.fat}g`, color: '#EA580C' },
                          { label: 'Carbs', value: `${r.nutrition.carbs}g`, color: '#2563EB' },
                        ].map((n) => (
                          <div
                            key={n.label}
                            className="text-center p-2 rounded-xl"
                            style={{ backgroundColor: '#F5F3FF' }}
                          >
                            <p className="text-base font-bold" style={{ color: n.color }}>
                              {n.value}
                            </p>
                            <p className="text-[10px] font-medium" style={{ color: '#6B7280' }}>
                              {n.label}
                            </p>
                          </div>
                        ))}
                      </div>

                      {/* Ingredients */}
                      <h3 className="text-sm font-bold mb-2" style={{ color: '#1E1B4B' }}>
                        Ingredients
                      </h3>
                      <div className="space-y-1.5 mb-4">
                        {r.ingredients.map((ing, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-2 rounded-lg text-sm"
                            style={{ backgroundColor: '#FAFAFE' }}
                          >
                            <span style={{ color: '#1E1B4B' }}>
                              {ing.name}
                              <span className="ml-2" style={{ color: '#9CA3AF' }}>
                                {ing.amount}
                              </span>
                            </span>
                            <span className="text-xs font-medium">
                              {ing.inFridge ? (
                                <span style={{ color: '#059669' }}>✅</span>
                              ) : (
                                <span style={{ color: '#EA580C' }}>🛒</span>
                              )}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Instructions */}
                      <h3 className="text-sm font-bold mb-2" style={{ color: '#1E1B4B' }}>
                        Instructions
                      </h3>
                      <ol className="space-y-2 mb-5">
                        {r.instructions.map((step, idx) => (
                          <li key={idx} className="flex gap-3 text-sm" style={{ color: '#374151' }}>
                            <span
                              className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                              style={{ backgroundColor: '#7C3AED' }}
                            >
                              {idx + 1}
                            </span>
                            <span className="pt-0.5">{step}</span>
                          </li>
                        ))}
                      </ol>

                      {/* Actions */}
                      <div className="flex gap-2">
                        {'id' in detailRecipe ? (
                          <button
                            onClick={() => {
                              toggleFavorite((detailRecipe as SavedRecipe).id, (detailRecipe as SavedRecipe).is_favorite);
                              setDetailRecipe(null);
                            }}
                            className="flex-1 h-11 rounded-xl font-semibold text-sm border-[1.5px] flex items-center justify-center gap-2"
                            style={{ borderColor: '#7C3AED', color: '#7C3AED' }}
                          >
                            <Heart className="w-4 h-4" /> {(detailRecipe as SavedRecipe).is_favorite ? 'Unfavorite' : 'Save'}
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              handleSaveRecipe(detailRecipe as Recipe);
                              setDetailRecipe(null);
                            }}
                            className="flex-1 h-11 rounded-xl font-semibold text-sm border-[1.5px] flex items-center justify-center gap-2"
                            style={{ borderColor: '#7C3AED', color: '#7C3AED' }}
                          >
                            <Heart className="w-4 h-4" /> Save
                          </button>
                        )}
                        <button
                          onClick={() => {
                            addMissingToShopping(r.ingredients);
                            setDetailRecipe(null);
                          }}
                          className="flex-1 h-11 rounded-xl font-semibold text-sm text-white flex items-center justify-center gap-2"
                          style={{ backgroundColor: '#7C3AED' }}
                        >
                          <ShoppingCart className="w-4 h-4" />
                          {missing.length > 0 ? `Add ${missing.length} to List` : 'All Available'}
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

      <UpgradeModal
        open={upgradeOpen}
        onOpenChange={setUpgradeOpen}
        title="Recipe limit reached"
        description="Free users can save up to 3 recipes. Upgrade to unlock unlimited recipes!"
        suggestedPlan="lite"
      />
    </div>
  );
};

export default Recipes;
