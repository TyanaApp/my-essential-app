import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Heart, Plus, Minus, ShoppingCart, Clock, Check } from 'lucide-react';
import RecipePhoto from '@/components/RecipePhoto';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useTranslation } from '@/hooks/useTranslation';
import { useStreak } from '@/hooks/useStreak';
import { useNavigate } from 'react-router-dom';

interface Ingredient { name: string; amount: string; inFridge: boolean; }
interface Nutrition { calories: number; protein: number; fat: number; carbs: number; }
interface NormalizedRecipe {
  title: string; ingredients: Ingredient[]; instructions: string[];
  nutrition: Nutrition; prepTime: number; estimatedCost: number;
}

interface RecipeDetailModalProps {
  recipe: NormalizedRecipe;
  savedId?: string;
  isFavorite?: boolean;
  onClose: () => void;
  onToggleFavorite?: (id: string, current: boolean) => void;
  onSave?: () => void;
  inventory: { id: string; name: string; quantity: number | null; unit: string | null; price_per_unit: number | null; expires_at: string | null }[];
  dailyTarget: number;
}

const COOK_TRANSLATIONS: Record<string, any> = {
  en: {
    cookDish: '👨‍🍳 Cook this dish',
    portions: 'portions',
    haveAtHome: 'Have at home',
    needBuy: 'Need to buy',
    addMissingShopping: '🛒 Add missing to shopping',
    ingredientsOf: '✅ {have} of {total} ingredients at home',
    steps: 'Steps',
    loadingSteps: 'Generating cooking steps...',
    confirmTitle: 'Confirm what you used:',
    confirmNote: "We'll only deduct checked items that are in your inventory",
    cooked: 'I cooked it! Deduct ingredients',
    cancel: 'Cancel',
    logAs: 'Log to diary as:',
    breakfast: '🌅 Breakfast',
    lunch: '☀️ Lunch',
    dinner: '🌙 Dinner',
    snack: '🍎 Snack',
    bonAppetit: 'Bon appétit!',
    deducted: '📦 {count} items deducted from inventory',
    logged: '📊 +{cal} kcal logged to diary',
    saved: '💚 Saved €{amount} (used before expiry)',
    usedBeforeExpiry: '💚 Items used before expiry ✓',
    done: 'Great! ✓',
    ingredients: 'Ingredients',
  },
  ru: {
    cookDish: '👨‍🍳 Приготовить это блюдо',
    portions: 'порций',
    haveAtHome: 'Есть дома',
    needBuy: 'Нужно купить',
    addMissingShopping: '🛒 Добавить недостающее в покупки',
    ingredientsOf: '✅ {have} из {total} ингредиентов есть дома',
    steps: 'Приготовление',
    loadingSteps: 'Генерируем шаги приготовления...',
    confirmTitle: 'Подтверди что использовала:',
    confirmNote: 'Спишем только отмеченные продукты которые есть в инвентаре',
    cooked: 'Приготовила! Списать продукты',
    cancel: 'Отмена',
    logAs: 'Записать в дневник как:',
    breakfast: '🌅 Завтрак',
    lunch: '☀️ Обед',
    dinner: '🌙 Ужин',
    snack: '🍎 Перекус',
    bonAppetit: 'Приятного аппетита!',
    deducted: '📦 Списано {count} продуктов из инвентаря',
    logged: '📊 +{cal} ккал записано в дневник',
    saved: '💚 Сэкономлено €{amount} (использовала до истечения срока)',
    usedBeforeExpiry: '💚 Продукты использованы до истечения ✓',
    done: 'Отлично! ✓',
    ingredients: 'Ингредиенты',
  },
  uk: {
    cookDish: '👨‍🍳 Приготувати цю страву',
    portions: 'порцій',
    haveAtHome: 'Є вдома',
    needBuy: 'Потрібно купити',
    addMissingShopping: '🛒 Додати те що бракує до покупок',
    ingredientsOf: '✅ {have} з {total} інгредієнтів є вдома',
    steps: 'Приготування',
    loadingSteps: 'Генеруємо кроки приготування...',
    confirmTitle: 'Підтверди що використала:',
    confirmNote: 'Спишемо лише відмічені продукти які є в інвентарі',
    cooked: 'Приготувала! Списати продукти',
    cancel: 'Скасувати',
    logAs: 'Записати в щоденник як:',
    breakfast: '🌅 Сніданок',
    lunch: '☀️ Обід',
    dinner: '🌙 Вечеря',
    snack: '🍎 Перекус',
    bonAppetit: 'Смачного!',
    deducted: '📦 Списано {count} продуктів з інвентарю',
    logged: '📊 +{cal} ккал записано в щоденник',
    saved: '💚 Зекономлено €{amount} (використано до закінчення терміну)',
    usedBeforeExpiry: '💚 Продукти використані до закінчення терміну ✓',
    done: 'Чудово! ✓',
    ingredients: 'Інгредієнти',
  },
  lv: {
    cookDish: '👨‍🍳 Pagatavot šo ēdienu',
    portions: 'porcijas',
    haveAtHome: 'Ir mājās',
    needBuy: 'Jāpērk',
    addMissingShopping: '🛒 Pievienot trūkstošo iepirkumiem',
    ingredientsOf: '✅ {have} no {total} sastāvdaļām ir mājās',
    steps: 'Gatavošana',
    loadingSteps: 'Ģenerējam gatavošanas soļus...',
    confirmTitle: 'Apstipriniet ko izmantojāt:',
    confirmNote: 'Norakstīsim tikai atzīmētos produktus kas ir inventārā',
    cooked: 'Pagatavoju! Norakstīt produktus',
    cancel: 'Atcelt',
    logAs: 'Ierakstīt dienasgrāmatā kā:',
    breakfast: '🌅 Brokastis',
    lunch: '☀️ Pusdienas',
    dinner: '🌙 Vakariņas',
    snack: '🍎 Uzkoda',
    bonAppetit: 'Labu apetīti!',
    deducted: '📦 {count} produkti norakstīti no inventāra',
    logged: '📊 +{cal} kcal ierakstīts dienasgrāmatā',
    saved: '💚 Ietaupīts €{amount} (izmantots pirms derīguma termiņa)',
    usedBeforeExpiry: '💚 Produkti izmantoti pirms termiņa beigām ✓',
    done: 'Lieliski! ✓',
    ingredients: 'Sastāvdaļas',
  },
};

type FlowStep = 'detail' | 'confirm' | 'meal_type' | 'success';

const RecipeDetailModal = ({
  recipe, savedId, isFavorite, onClose, onToggleFavorite, onSave, inventory, dailyTarget,
}: RecipeDetailModalProps) => {
  const { user } = useAuth();
  const { language } = useTranslation();
  const { updateStreak } = useStreak();
  const navigate = useNavigate();
  const ct = COOK_TRANSLATIONS[language] || COOK_TRANSLATIONS.en;

  const [portions, setPortions] = useState(2);
  const basePortion = 2; // recipes default to 2 portions
  const portionMultiplier = portions / basePortion;

  const [step, setStep] = useState<FlowStep>('detail');
  const [checkedIngredients, setCheckedIngredients] = useState<Set<number>>(new Set());
  const [cookingSteps, setCookingSteps] = useState<string[]>(recipe.instructions || []);
  const [loadingSteps, setLoadingSteps] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [successData, setSuccessData] = useState<{ deducted: number; calories: number; savedAmount: number | null }>({ deducted: 0, calories: 0, savedAmount: null });
  const [showConfetti, setShowConfetti] = useState(false);

  // Check which ingredients are in inventory
  const ingredientAvailability = recipe.ingredients.map((ing) => {
    const found = inventory.find((item) =>
      item.name.toLowerCase().includes(ing.name.toLowerCase()) ||
      ing.name.toLowerCase().includes(item.name.toLowerCase())
    );
    return { ...ing, inInventory: !!found, inventoryItem: found };
  });

  const haveCount = ingredientAvailability.filter(i => i.inInventory).length;
  const totalCount = ingredientAvailability.length;
  const missingIngredients = ingredientAvailability.filter(i => !i.inInventory);

  // Initialize checked ingredients on mount (auto-check ones in inventory)
  useEffect(() => {
    const checked = new Set<number>();
    ingredientAvailability.forEach((ing, idx) => {
      if (ing.inInventory) checked.add(idx);
    });
    setCheckedIngredients(checked);
  }, []);

  // Generate steps if recipe has no instructions
  useEffect(() => {
    if (recipe.instructions && recipe.instructions.length > 0) {
      setCookingSteps(recipe.instructions);
      return;
    }
    generateCookingSteps();
  }, [recipe.title]);

  const generateCookingSteps = async () => {
    setLoadingSteps(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-recipes', {
        body: {
          mealType: 'any',
          cookingFor: portions,
          timeAvailable: 'any',
          useOnlyInventory: false,
          inventory: [],
          userGoals: {},
          language,
          generateStepsOnly: true,
          recipeName: recipe.title,
          recipeIngredients: recipe.ingredients.map(i => `${i.name} ${i.amount}`).join(', '),
        },
      });
      if (data?.steps) {
        setCookingSteps(data.steps);
      }
    } catch (e) {
      console.error('Failed to generate steps:', e);
    } finally {
      setLoadingSteps(false);
    }
  };

  const scaleAmount = (amount: string): string => {
    if (portionMultiplier === 1) return amount;
    const match = amount.match(/^([\d.,]+)\s*(.*)/);
    if (!match) return amount;
    const num = parseFloat(match[1].replace(',', '.'));
    const unit = match[2];
    const scaled = Math.round(num * portionMultiplier * 10) / 10;
    return `${scaled}${unit ? ' ' + unit : ''}`;
  };

  const addMissingToShopping = async () => {
    if (!user) return;
    const items = missingIngredients.map(i => ({
      user_id: user.id, name: i.name, quantity: 1, unit: 'pcs',
    }));
    await supabase.from('shopping_items').insert(items as any);
    toast.success(`${missingIngredients.length} ${ct.addMissingShopping}`);
  };

  const handleCookStart = () => setStep('confirm');

  const toggleCheck = (idx: number) => {
    setCheckedIngredients(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const handleConfirmCook = () => setStep('meal_type');

  const handleLogMeal = async (mealType: string) => {
    if (!user) return;
    setProcessing(true);
    try {
      // THING 1: Deduct from inventory
      let deductedCount = 0;
      let savedAmount = 0;
      let hasPriceData = false;
      const today = new Date().toISOString().split('T')[0];

      for (const idx of checkedIngredients) {
        const ing = ingredientAvailability[idx];
        if (!ing?.inInventory || !ing.inventoryItem) continue;

        const item = ing.inventoryItem;
        // Parse amount from ingredient
        const match = ing.amount.match(/^([\d.,]+)/);
        const usedQty = match ? parseFloat(match[1].replace(',', '.')) * portionMultiplier : 1;

        const currentQty = item.quantity || 1;
        const remaining = currentQty - usedQty;

        if (remaining <= 0) {
          await supabase.from('inventory_items').delete().eq('id', item.id);
        } else {
          await supabase.from('inventory_items').update({ quantity: remaining }).eq('id', item.id);
        }
        deductedCount++;

        // Calculate savings
        if (item.price_per_unit && item.expires_at && item.expires_at >= today) {
          savedAmount += (item.price_per_unit * Math.min(usedQty, currentQty));
          hasPriceData = true;
        }
      }

      // THING 2: Log to diary
      const cal = Math.round(recipe.nutrition.calories * portionMultiplier);
      const prot = Math.round(recipe.nutrition.protein * portionMultiplier);
      const fat = Math.round(recipe.nutrition.fat * portionMultiplier);
      const carbs = Math.round(recipe.nutrition.carbs * portionMultiplier);

      await supabase.from('meal_entries').insert({
        user_id: user.id,
        date: new Date().toISOString().split('T')[0],
        meal_type: mealType,
        custom_name: recipe.title,
        total_calories: Math.min(cal, 9999),
        total_protein: prot,
        total_fat: fat,
        total_carbs: carbs,
      });

      // THING 3: Update streak
      await updateStreak();

      // Log savings
      if (savedAmount > 0) {
        await supabase.from('savings_log').insert({
          user_id: user.id,
          amount: Math.round(savedAmount * 100) / 100,
          type: 'recipe_cooked',
          description: recipe.title,
        });
      }

      setSuccessData({
        deducted: deductedCount,
        calories: cal,
        savedAmount: hasPriceData ? Math.round(savedAmount * 100) / 100 : null,
      });
      setStep('success');
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
    } catch (e) {
      console.error('Cook error:', e);
      toast.error('Error processing');
    } finally {
      setProcessing(false);
    }
  };

  const handleDone = () => {
    onClose();
    navigate('/diary');
  };

  const cc = (() => {
    const pct = recipe.nutrition.calories / dailyTarget;
    if (pct <= 0.3) return { bg: '#D1FAE5', text: '#059669' };
    if (pct <= 0.5) return { bg: '#FEF3C7', text: '#EA580C' };
    return { bg: '#FEE2E2', text: '#DC2626' };
  })();

  const matchPct = totalCount > 0 ? Math.round((haveCount / totalCount) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 bg-background overflow-y-auto pb-24">
      {/* Confetti */}
      {showConfetti && (
        <div className="fixed inset-0 z-[100] pointer-events-none overflow-hidden">
          {Array.from({ length: 40 }).map((_, i) => (
            <motion.div
              key={i}
              initial={{ y: -20, x: Math.random() * window.innerWidth, opacity: 1, rotate: 0 }}
              animate={{ y: window.innerHeight + 20, opacity: 0, rotate: Math.random() * 720 }}
              transition={{ duration: 2 + Math.random() * 2, delay: Math.random() * 0.5 }}
              className="absolute w-3 h-3 rounded-sm"
              style={{ backgroundColor: ['#7C3AED', '#059669', '#EA580C', '#DB2777', '#2563EB', '#FCD34D'][i % 6] }}
            />
          ))}
        </div>
      )}

      <AnimatePresence mode="wait">
        {/* ═══ DETAIL VIEW ═══ */}
        {step === 'detail' && (
          <motion.div key="detail" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {/* Header with photo */}
            <div className="relative h-56">
              <RecipePhoto title={recipe.title} size="lg" className="h-56" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              <button onClick={onClose} className="absolute top-4 left-4 p-2 rounded-full bg-black/30 backdrop-blur-sm">
                <X className="w-5 h-5 text-white" />
              </button>
              {savedId && onToggleFavorite && (
                <button onClick={() => onToggleFavorite(savedId, !!isFavorite)}
                  className="absolute top-4 right-4 p-2 rounded-full bg-black/30 backdrop-blur-sm">
                  <Heart className="w-5 h-5 text-white" fill={isFavorite ? '#7C3AED' : 'none'} />
                </button>
              )}
              {!savedId && onSave && (
                <button onClick={onSave} className="absolute top-4 right-4 p-2 rounded-full bg-black/30 backdrop-blur-sm">
                  <Heart className="w-5 h-5 text-white" />
                </button>
              )}
              <div className="absolute bottom-4 left-5 right-5">
                <h1 className="text-2xl font-bold text-white leading-tight drop-shadow-lg">{recipe.title}</h1>
              </div>
            </div>

            {/* Badges */}
            <div className="px-5 pt-4 flex gap-2 flex-wrap">
              <span className="px-2.5 py-1 rounded-full text-xs font-bold" style={{ backgroundColor: matchPct >= 80 ? '#D1FAE5' : '#FEF3C7', color: matchPct >= 80 ? '#059669' : '#92400E' }}>
                {matchPct}% match
              </span>
              <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-secondary text-foreground flex items-center gap-1">
                <Clock className="w-3 h-3" /> {recipe.prepTime} {language === 'ru' || language === 'uk' ? 'мин' : language === 'lv' ? 'min' : 'min'}
              </span>
              <span className="px-2.5 py-1 rounded-full text-xs font-bold" style={{ backgroundColor: cc.bg, color: cc.text }}>
                {recipe.nutrition.calories} {language === 'ru' || language === 'uk' ? 'ккал' : 'kcal'}
              </span>
            </div>

            {/* Macros */}
            <div className="px-5 pt-3 grid grid-cols-3 gap-2">
              {[
                { label: language === 'ru' || language === 'uk' ? 'Белок' : language === 'lv' ? 'Olbaltumvielas' : 'Protein', value: recipe.nutrition.protein, color: '#059669' },
                { label: language === 'ru' || language === 'uk' ? 'Жир' : language === 'lv' ? 'Tauki' : 'Fat', value: recipe.nutrition.fat, color: '#EA580C' },
                { label: language === 'ru' || language === 'uk' ? 'Углеводы' : language === 'lv' ? 'Ogļhidrāti' : 'Carbs', value: recipe.nutrition.carbs, color: '#2563EB' },
              ].map(m => (
                <div key={m.label} className="text-center p-2.5 rounded-xl bg-secondary">
                  <p className="text-lg font-bold" style={{ color: m.color }}>{Math.round(m.value * portionMultiplier)}g</p>
                  <p className="text-[10px] font-medium text-muted-foreground">{m.label}</p>
                </div>
              ))}
            </div>

            {/* Ingredients */}
            <div className="px-5 pt-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-bold text-foreground">{ct.ingredients}</h2>
                <div className="flex items-center gap-2 bg-secondary rounded-xl px-1">
                  <button onClick={() => setPortions(Math.max(1, portions - 1))} className="w-8 h-8 flex items-center justify-center">
                    <Minus className="w-4 h-4 text-foreground" />
                  </button>
                  <span className="text-sm font-bold text-foreground min-w-[60px] text-center">
                    {portions} {ct.portions}
                  </span>
                  <button onClick={() => setPortions(Math.min(10, portions + 1))} className="w-8 h-8 flex items-center justify-center">
                    <Plus className="w-4 h-4 text-foreground" />
                  </button>
                </div>
              </div>

              {/* Summary line */}
              <p className="text-xs font-medium mb-2" style={{ color: haveCount === totalCount ? '#059669' : '#EA580C' }}>
                {ct.ingredientsOf.replace('{have}', String(haveCount)).replace('{total}', String(totalCount))}
              </p>

              <div className="space-y-1.5">
                {ingredientAvailability.map((ing, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl text-sm"
                    style={{ backgroundColor: ing.inInventory ? 'hsl(var(--secondary))' : 'hsl(var(--secondary))', border: `1px solid hsl(var(--border))` }}>
                    <div className="flex items-center gap-2">
                      <span>{ing.inInventory ? '✅' : '🛒'}</span>
                      <span className="font-medium text-foreground">{ing.name}</span>
                      <span className="text-muted-foreground">— {scaleAmount(ing.amount)}</span>
                    </div>
                    <span className="text-[10px] font-medium" style={{ color: ing.inInventory ? '#059669' : '#EA580C' }}>
                      {ing.inInventory ? ct.haveAtHome : ct.needBuy}
                    </span>
                  </div>
                ))}
              </div>

              {missingIngredients.length > 0 && (
                <button onClick={addMissingToShopping}
                  className="w-full mt-3 py-3 rounded-xl text-sm font-bold text-white"
                  style={{ backgroundColor: '#7C3AED' }}>
                  {ct.addMissingShopping}
                </button>
              )}
            </div>

            {/* Cooking Steps */}
            <div className="px-5 pt-5 pb-4">
              <h2 className="text-base font-bold text-foreground mb-3">{ct.steps}</h2>
              {loadingSteps ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="flex gap-3 animate-pulse">
                      <div className="w-7 h-7 rounded-full bg-muted shrink-0" />
                      <div className="flex-1 space-y-2 pt-1">
                        <div className="h-3 rounded bg-muted w-full" />
                        <div className="h-3 rounded bg-muted w-3/4" />
                      </div>
                    </div>
                  ))}
                  <p className="text-xs text-center text-muted-foreground">{ct.loadingSteps}</p>
                </div>
              ) : cookingSteps.length > 0 ? (
                <ol className="space-y-3">
                  {cookingSteps.map((s, idx) => (
                    <li key={idx} className="flex gap-3 text-sm text-foreground">
                      <span className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
                        style={{ backgroundColor: '#7C3AED' }}>{idx + 1}</span>
                      <span className="pt-1 leading-relaxed">{s}</span>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="text-sm text-muted-foreground">{ct.loadingSteps}</p>
              )}
            </div>

            {/* Fixed bottom cook button */}
            <div className="fixed bottom-20 left-0 right-0 px-5 pb-2 z-50">
              <button onClick={handleCookStart}
                className="w-full h-14 rounded-2xl text-white font-bold text-base shadow-lg"
                style={{ backgroundColor: '#7C3AED', boxShadow: '0 8px 30px rgba(124,58,237,0.35)' }}>
                {ct.cookDish}
              </button>
            </div>
          </motion.div>
        )}

        {/* ═══ CONFIRM CHECKLIST ═══ */}
        {step === 'confirm' && (
          <motion.div key="confirm" initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }}
            className="min-h-screen flex flex-col bg-background">
            <div className="px-5 pt-6 pb-4 border-b border-border">
              <h2 className="text-lg font-bold text-foreground">{ct.confirmTitle}</h2>
            </div>
            <div className="flex-1 px-5 py-4 space-y-2 overflow-y-auto">
              {ingredientAvailability.map((ing, idx) => (
                <button key={idx} onClick={() => toggleCheck(idx)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl text-sm text-left transition-colors bg-secondary border border-border"
                  style={{
                    borderColor: checkedIngredients.has(idx) ? '#86EFAC' : undefined,
                  }}>
                  <div className="w-6 h-6 rounded-md border-2 flex items-center justify-center shrink-0"
                    style={{
                      borderColor: checkedIngredients.has(idx) ? '#059669' : '#D1D5DB',
                      backgroundColor: checkedIngredients.has(idx) ? '#059669' : 'transparent',
                    }}>
                    {checkedIngredients.has(idx) && <Check className="w-4 h-4 text-white" />}
                  </div>
                  <span className="flex-1 font-medium text-foreground">{ing.name}</span>
                  <span className="text-muted-foreground text-xs">{scaleAmount(ing.amount)}</span>
                  {!ing.inInventory && (
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: '#FEF3C7', color: '#92400E' }}>
                      {ct.needBuy}
                    </span>
                  )}
                </button>
              ))}
            </div>
            <div className="px-5 py-2">
              <p className="text-xs text-muted-foreground text-center mb-3">{ct.confirmNote}</p>
              <button onClick={handleConfirmCook} disabled={processing}
                className="w-full h-13 py-3.5 rounded-2xl text-white font-bold text-sm"
                style={{ backgroundColor: '#7C3AED' }}>
                ✓ {ct.cooked}
              </button>
              <button onClick={() => setStep('detail')} className="w-full py-3 text-sm font-medium text-muted-foreground">
                {ct.cancel}
              </button>
            </div>
          </motion.div>
        )}

        {/* ═══ MEAL TYPE PICKER ═══ */}
        {step === 'meal_type' && (
          <motion.div key="meal_type" initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }}
            className="min-h-screen flex flex-col items-center justify-center bg-background px-5">
            <h2 className="text-lg font-bold text-foreground mb-6">{ct.logAs}</h2>
            <div className="grid grid-cols-2 gap-3 w-full max-w-xs">
              {[
                { key: 'breakfast', label: ct.breakfast },
                { key: 'lunch', label: ct.lunch },
                { key: 'dinner', label: ct.dinner },
                { key: 'snack', label: ct.snack },
              ].map(m => (
                <button key={m.key} onClick={() => handleLogMeal(m.key)} disabled={processing}
                  className="py-4 rounded-2xl font-bold text-sm border-2 transition-all hover:border-primary active:scale-95 border-border text-foreground">
                  style={{ borderColor: '#DDD6FE', color: '#1E1B4B' }}>
                  {m.label}
                </button>
              ))}
            </div>
            {processing && (
              <div className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
                <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                {ct.loadingSteps}
              </div>
            )}
          </motion.div>
        )}

        {/* ═══ SUCCESS SCREEN ═══ */}
        {step === 'success' && (
          <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            className="min-h-screen flex flex-col items-center justify-center bg-background px-5">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 300, damping: 15 }}
              className="text-7xl mb-4">🍽</motion.div>
            <h1 className="text-2xl font-bold text-foreground mb-8">{ct.bonAppetit}</h1>

            <div className="w-full max-w-sm space-y-3 mb-8">
              <div className="p-4 rounded-2xl bg-secondary">
                <p className="text-sm font-semibold text-foreground">
                  {ct.deducted.replace('{count}', String(successData.deducted))}
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-secondary">
                <p className="text-sm font-semibold text-foreground">
                  {ct.logged.replace('{cal}', String(successData.calories))}
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-secondary">
                <p className="text-sm font-semibold text-foreground">
                  {successData.savedAmount !== null
                    ? ct.saved.replace('{amount}', successData.savedAmount.toFixed(2))
                    : ct.usedBeforeExpiry}
                </p>
              </div>
            </div>

            <button onClick={handleDone}
              className="w-full max-w-sm h-14 rounded-2xl text-white font-bold text-base"
              style={{ backgroundColor: '#7C3AED' }}>
              {ct.done}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default RecipeDetailModal;
