import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calculator, Plus, Trash2, ChevronDown, ChevronUp, BookOpen } from 'lucide-react';
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
import OFFProductSuggestions from '@/components/OFFProductSuggestions';
import { OFFProduct, scaleNutrition } from '@/lib/openFoodFacts';

interface NutritionResult {
  food_name?: string;
  recipe_name?: string;
  identified_amount?: string;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
  per_100g?: { calories: number; protein: number; fat: number; carbs: number };
  total?: { calories: number; protein: number; fat: number; carbs: number; fiber?: number; sugar?: number };
  per_portion?: { calories: number; protein: number; fat: number; carbs: number; fiber?: number; sugar?: number };
  total_weight?: number;
  per_portion_weight?: number;
  portions?: number;
  ingredients_breakdown?: { name: string; amount: string; calories: number; protein: number; fat: number; carbs: number }[];
  confidence?: string;
  data_source?: string;
  note?: string;
}

interface Ingredient {
  name: string;
  amount: string;
  unit: string;
}

interface HistoryItem {
  name: string;
  calories: number;
  result: NutritionResult;
  mode: string;
  timestamp: number;
}

const CATEGORY_CHIPS = [
  { key: 'meat', emoji: '🥩', items_en: ['Chicken breast 200g', 'Ground beef 150g', 'Pork chop 180g', 'Turkey 200g'], items_ru: ['Куриная грудка 200г', 'Фарш говяжий 150г', 'Свиная отбивная 180г', 'Индейка 200г'] },
  { key: 'fish', emoji: '🐟', items_en: ['Salmon fillet 150g', 'Tuna 100g', 'Shrimp 200g', 'Cod 180g'], items_ru: ['Филе лосося 150г', 'Тунец 100г', 'Креветки 200г', 'Треска 180г'] },
  { key: 'dairy', emoji: '🥛', items_en: ['Milk 250ml', 'Greek yogurt 150g', 'Cottage cheese 200g', 'Cheese 50g'], items_ru: ['Молоко 250мл', 'Йогурт 150г', 'Творог 200г', 'Сыр 50г'] },
  { key: 'eggs', emoji: '🥚', items_en: ['2 boiled eggs', 'Scrambled eggs 3 eggs', 'Omelette 2 eggs'], items_ru: ['2 варёных яйца', 'Яичница из 3 яиц', 'Омлет из 2 яиц'] },
  { key: 'vegetables', emoji: '🥬', items_en: ['Broccoli 200g', 'Carrot 150g', 'Tomato 200g', 'Cucumber 150g'], items_ru: ['Брокколи 200г', 'Морковь 150г', 'Помидор 200г', 'Огурец 150г'] },
  { key: 'fruits', emoji: '🍎', items_en: ['Apple 1pc', 'Banana 1pc', 'Orange 1pc', 'Strawberries 200g'], items_ru: ['Яблоко 1шт', 'Банан 1шт', 'Апельсин 1шт', 'Клубника 200г'] },
  { key: 'grains', emoji: '🫙', items_en: ['Rice 100g dry', 'Pasta 100g dry', 'Oatmeal 60g', 'Buckwheat 100g'], items_ru: ['Рис 100г сухой', 'Макароны 100г сухие', 'Овсянка 60г', 'Гречка 100г'] },
  { key: 'dishes', emoji: '🍝', items_en: ['Bowl of borscht', 'Caesar salad', 'Margherita pizza 2 slices'], items_ru: ['Тарелка борща', 'Салат Цезарь', 'Пицца Маргарита 2 куска'] },
  { key: 'sweets', emoji: '🍫', items_en: ['Snickers bar', 'Chocolate 50g', 'Ice cream 100g'], items_ru: ['Сникерс 1шт', 'Шоколад 50г', 'Мороженое 100г'] },
  { key: 'drinks', emoji: '🥤', items_en: ['Latte 300ml', 'Orange juice 250ml', 'Coca-Cola 330ml'], items_ru: ['Латте 300мл', 'Апельсиновый сок 250мл', 'Кока-кола 330мл'] },
];

const NutritionCalculator = ({ embedded }: { embedded?: boolean }) => {
  const { user } = useAuth();
  const { t, language } = useTranslation();
  const nc = (t as any).nutritionCalc || {};
  const off = (t as any).openFoodFacts || {};
  usePageTitle(embedded ? '' : (nc.title || 'Nutrition Calculator'));

  const [mode, setMode] = useState<'food' | 'recipe'>('food');
  const [foodInput, setFoodInput] = useState('');
  const [ingredients, setIngredients] = useState<Ingredient[]>([{ name: '', amount: '', unit: 'g' }]);
  const [portions, setPortions] = useState(1);
  const [calculating, setCalculating] = useState(false);
  const [result, setResult] = useState<NutritionResult | null>(null);
  const [resultMode, setResultMode] = useState<'serving' | 'per100g' | 'total'>('serving');
  const [expandedBreakdown, setExpandedBreakdown] = useState(false);
  const [expandedDetails, setExpandedDetails] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [mealTypeDialog, setMealTypeDialog] = useState(false);
  const [placeholderIdx, setPlaceholderIdx] = useState(0);

  const PLACEHOLDERS: Record<string, string[]> = {
    ru: ['Салат Цезарь с курицей, 1 порция', 'Овсянка на молоке 200г', '2 яйца всмятку', 'Борщ домашний, тарелка', 'Snickers 1 шт', 'Куриная грудка запечённая 150г'],
    uk: ['Салат Цезар з куркою, 1 порція', 'Вівсянка на молоці 200г', '2 яйця некруто', 'Борщ домашній, тарілка', 'Snickers 1 шт', 'Куряча грудка запечена 150г'],
    lv: ['Cēzara salāti ar vistu, 1 porcija', 'Auzu pārslas ar pienu 200g', '2 mīksti vārītas olas', 'Biešu zupa, šķīvis', 'Snickers 1 gab', 'Cepta vistas krūtiņa 150g'],
    en: ['Caesar salad with chicken, 1 serving', 'Oatmeal with milk 200g', '2 soft boiled eggs', 'Bowl of borscht', 'Snickers 1 bar', 'Baked chicken breast 150g'],
  };

  const LOADING_TIPS: Record<string, string[]> = {
    ru: ['Анализируем состав...', 'Ищем в базах данных...', 'Считаем калории и БЖУ...', 'Почти готово...'],
    uk: ['Аналізуємо склад...', 'Шукаємо в базах даних...', 'Рахуємо калорії та БЖВ...', 'Майже готово...'],
    lv: ['Analizējam sastāvu...', 'Meklējam datubāzēs...', 'Aprēķinām kalorijas...', 'Gandrīz gatavs...'],
    en: ['Analyzing composition...', 'Searching databases...', 'Calculating calories & macros...', 'Almost done...'],
  };

  const ERROR_MSGS: Record<string, string> = {
    ru: 'Не удалось рассчитать. Попробуй описать подробнее.',
    uk: 'Не вдалося розрахувати. Спробуй описати детальніше.',
    lv: 'Neizdevās aprēķināt. Mēģini aprakstīt sīkāk.',
    en: 'Could not calculate. Try describing in more detail.',
  };

  const placeholders = PLACEHOLDERS[language] || PLACEHOLDERS.en;
  const loadingTips = LOADING_TIPS[language] || LOADING_TIPS.en;
  const [loadingTipIdx, setLoadingTipIdx] = useState(0);

  // Rotate placeholder every 3 seconds
  useEffect(() => {
    if (foodInput) return;
    const interval = setInterval(() => {
      setPlaceholderIdx(prev => (prev + 1) % placeholders.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [foodInput, placeholders.length]);

  // Rotate loading tips
  useEffect(() => {
    if (!calculating) return;
    setLoadingTipIdx(0);
    const interval = setInterval(() => {
      setLoadingTipIdx(prev => (prev + 1) % loadingTips.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [calculating, loadingTips.length]);

  // Load history from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('nutrition_history');
      if (saved) setHistory(JSON.parse(saved));
    } catch {}
  }, []);

  const saveToHistory = (res: NutritionResult, calcMode: string) => {
    const name = res.food_name || res.recipe_name || 'Unknown';
    const cal = calcMode === 'recipe' ? (res.per_portion?.calories || 0) : (res.calories || 0);
    const item: HistoryItem = { name, calories: cal, result: res, mode: calcMode, timestamp: Date.now() };
    const updated = [item, ...history].slice(0, 20);
    setHistory(updated);
    localStorage.setItem('nutrition_history', JSON.stringify(updated));
  };

  const calculate = async () => {
    if (mode === 'food' && !foodInput.trim()) return;
    if (mode === 'recipe' && ingredients.every(i => !i.name.trim())) return;

    setCalculating(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('calculate-nutrition', {
        body: {
          mode,
          foodDescription: mode === 'food' ? foodInput : undefined,
          ingredients: mode === 'recipe' ? ingredients.filter(i => i.name.trim()) : undefined,
          portions: mode === 'recipe' ? portions : undefined,
          language,
        },
      });

      if (error) throw new Error(error.message || 'Function call failed');
      if (data?.error) throw new Error(data.error);
      if (!data?.calories && !data?.per_portion?.calories && !data?.total?.calories) {
        throw new Error('No nutrition data returned');
      }

      setResult(data);
      saveToHistory(data, mode);
    } catch (e: any) {
      console.error('Calculation error:', e);
      toast.error(ERROR_MSGS[language] || ERROR_MSGS.en);
    } finally {
      setCalculating(false);
    }
  };

  const logToDiary = async (mealType: string) => {
    if (!user || !result) return;
    const cal = mode === 'recipe' ? (result.per_portion?.calories || 0) : (result.calories || 0);
    const prot = mode === 'recipe' ? (result.per_portion?.protein || 0) : (result.protein || 0);
    const fat = mode === 'recipe' ? (result.per_portion?.fat || 0) : (result.fat || 0);
    const carbs = mode === 'recipe' ? (result.per_portion?.carbs || 0) : (result.carbs || 0);
    const name = result.food_name || result.recipe_name || '';

    try {
      const { error } = await supabase.from('meal_entries').insert({
        user_id: user.id,
        date: new Date().toISOString().split('T')[0],
        meal_type: mealType,
        custom_name: name,
        total_calories: Math.round(cal),
        total_protein: Math.round(prot),
        total_fat: Math.round(fat),
        total_carbs: Math.round(carbs),
      });
      if (error) throw error;
      toast.success(nc.addedToDiary || 'Added to diary ✓');
      setMealTypeDialog(false);
    } catch (e) {
      console.error('Error logging:', e);
      toast.error((t.common as any)?.error || 'Error');
    }
  };

  const addIngredient = () => setIngredients(prev => [...prev, { name: '', amount: '', unit: 'g' }]);
  const removeIngredient = (i: number) => setIngredients(prev => prev.filter((_, idx) => idx !== i));
  const updateIngredient = (i: number, field: keyof Ingredient, value: string) => {
    setIngredients(prev => prev.map((ing, idx) => idx === i ? { ...ing, [field]: value } : ing));
  };

  const clearAndReset = () => {
    setResult(null);
    setFoodInput('');
    setIngredients([{ name: '', amount: '', unit: 'g' }]);
    setPortions(1);
    setSelectedCategory(null);
  };

  // Get display values based on resultMode
  const getDisplayValues = () => {
    if (!result) return { calories: 0, protein: 0, fat: 0, carbs: 0, fiber: 0, sugar: 0 };
    if (mode === 'recipe') {
      if (resultMode === 'total') return result.total || { calories: 0, protein: 0, fat: 0, carbs: 0, fiber: 0, sugar: 0 };
      if (resultMode === 'per100g') return { ...result.per_100g, fiber: 0, sugar: 0 } as any;
      return result.per_portion || { calories: 0, protein: 0, fat: 0, carbs: 0, fiber: 0, sugar: 0 };
    }
    if (resultMode === 'per100g') return { ...result.per_100g, fiber: 0, sugar: 0 } as any;
    return { calories: result.calories, protein: result.protein, fat: result.fat, carbs: result.carbs, fiber: result.fiber || 0, sugar: result.sugar || 0 };
  };

  const vals = result ? getDisplayValues() : null;

  // Health badges
  const getBadges = () => {
    if (!vals) return [];
    const badges: { text: string; color: string }[] = [];
    const per100 = result?.per_100g;
    if (per100 && per100.protein > 20) badges.push({ text: nc.highProtein || '💪 High protein', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' });
    if (per100 && per100.fat < 3) badges.push({ text: nc.lowFat || '✅ Low fat', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' });
    if ((vals.sugar || 0) > 15) badges.push({ text: nc.highSugar || '⚠️ High sugar', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' });
    if ((vals.fiber || 0) > 5) badges.push({ text: nc.highFiber || '🌾 Rich in fiber', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' });
    return badges;
  };

  const useRu = language === 'ru' || language === 'uk';

  return (
    <div className={embedded ? "space-y-4" : "p-4 pb-24 md:p-6 max-w-2xl mx-auto space-y-4"}>
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
          🧮 {nc.title || 'Nutrition Calculator'}
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          {nc.subtitle || 'Get precise nutrition for any food or recipe'}
        </p>
      </div>

      {/* Mode tabs */}
      {!result && (
        <Tabs value={mode} onValueChange={(v) => { setMode(v as 'food' | 'recipe'); setSelectedCategory(null); }}>
          <TabsList className="w-full">
            <TabsTrigger value="food" className="flex-1 text-xs gap-1">🍽 {nc.modeFood || 'Food or dish'}</TabsTrigger>
            <TabsTrigger value="recipe" className="flex-1 text-xs gap-1">📝 {nc.modeRecipe || 'Custom recipe'}</TabsTrigger>
          </TabsList>

          {/* MODE 1: Single food */}
          <TabsContent value="food" className="space-y-4 mt-4">
            <div className="relative">
              <textarea
                value={foodInput}
                onChange={e => setFoodInput(e.target.value)}
                placeholder={placeholders[placeholderIdx]}
                className="w-full min-h-[80px] p-3 rounded-xl border border-border bg-background text-foreground text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              />

              {/* Open Food Facts suggestions */}
              <OFFProductSuggestions
                query={foodInput}
                onSelect={(product: OFFProduct) => {
                  // Use OFF data directly — set result without calling AI
                  const offResult: NutritionResult = {
                    food_name: product.brand ? `${product.name} (${product.brand})` : product.name,
                    identified_amount: '100g',
                    calories: product.calories,
                    protein: product.protein,
                    fat: product.fat,
                    carbs: product.carbs,
                    fiber: product.fiber,
                    sugar: product.sugar,
                    per_100g: { calories: product.calories, protein: product.protein, fat: product.fat, carbs: product.carbs },
                    confidence: 'high',
                    data_source: 'Open Food Facts',
                    note: product.barcode ? `Barcode: ${product.barcode}` : undefined,
                  };
                  setResult(offResult);
                  saveToHistory(offResult, 'food');
                  setFoodInput(product.name);
                }}
                className="absolute z-10 left-0 right-0 top-full mt-1"
              />
            </div>

            {/* Category chips */}
            <div className="flex flex-wrap gap-1.5">
              {CATEGORY_CHIPS.map(cat => (
                <button
                  key={cat.key}
                  onClick={() => setSelectedCategory(selectedCategory === cat.key ? null : cat.key)}
                  className={`text-xs px-2.5 py-1.5 rounded-full font-medium transition-all ${
                    selectedCategory === cat.key
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-muted-foreground'
                  }`}
                >
                  {cat.emoji} {nc[`cat_${cat.key}`] || cat.key}
                </button>
              ))}
            </div>

            {/* Category items */}
            <AnimatePresence>
              {selectedCategory && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex flex-wrap gap-1.5"
                >
                  {(CATEGORY_CHIPS.find(c => c.key === selectedCategory)?.[useRu ? 'items_ru' : 'items_en'] || []).map((item, i) => (
                    <button
                      key={i}
                      onClick={() => { setFoodInput(item); setSelectedCategory(null); }}
                      className="text-xs px-2.5 py-1.5 rounded-lg bg-card border border-border text-foreground hover:bg-accent transition-colors"
                    >
                      {item}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            <Button onClick={calculate} disabled={calculating || !foodInput.trim()} className="w-full gap-2">
              <Calculator className="w-4 h-4" />
              {calculating ? (nc.calculating || 'Calculating...') : (nc.calculateBtn || 'Calculate')}
            </Button>
          </TabsContent>

          {/* MODE 2: Custom recipe */}
          <TabsContent value="recipe" className="space-y-4 mt-4">
            <p className="text-sm font-medium text-foreground">{nc.addIngredients || 'Add recipe ingredients'}</p>

            <div className="space-y-2">
              {ingredients.map((ing, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <input
                    value={ing.name}
                    onChange={e => updateIngredient(i, 'name', e.target.value)}
                    placeholder={nc.ingredientPlaceholder || 'Product name'}
                    className="flex-1 h-9 px-3 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  <input
                    value={ing.amount}
                    onChange={e => updateIngredient(i, 'amount', e.target.value)}
                    placeholder="200"
                    type="number"
                    className="w-16 h-9 px-2 rounded-lg border border-border bg-background text-foreground text-sm text-center focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  <select
                    value={ing.unit}
                    onChange={e => updateIngredient(i, 'unit', e.target.value)}
                    className="w-14 h-9 px-1 rounded-lg border border-border bg-background text-foreground text-xs focus:outline-none"
                  >
                    <option value="g">{nc.unitG || 'g'}</option>
                    <option value="ml">{nc.unitMl || 'ml'}</option>
                    <option value="pcs">{nc.unitPcs || 'pcs'}</option>
                  </select>
                  {ingredients.length > 1 && (
                    <button onClick={() => removeIngredient(i)} className="p-1 text-muted-foreground hover:text-destructive">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <Button variant="outline" size="sm" onClick={addIngredient} className="gap-1 text-xs">
              <Plus className="w-3 h-3" /> {nc.addIngredientBtn || 'Add ingredient'}
            </Button>

            <div>
              <p className="text-sm font-medium text-foreground mb-2">{nc.portionsLabel || 'How many portions?'}</p>
              <div className="flex gap-2">
                {[1, 2, 4, 6].map(n => (
                  <button
                    key={n}
                    onClick={() => setPortions(n)}
                    className={`w-10 h-10 rounded-lg text-sm font-medium transition-all ${
                      portions === n ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'
                    }`}
                  >
                    {n}
                  </button>
                ))}
                <input
                  type="number"
                  value={portions}
                  onChange={e => setPortions(Math.max(1, Number(e.target.value)))}
                  className="w-14 h-10 px-2 rounded-lg border border-border bg-background text-foreground text-sm text-center focus:outline-none focus:ring-2 focus:ring-ring"
                  min={1}
                />
              </div>
            </div>

            <Button onClick={calculate} disabled={calculating || ingredients.every(i => !i.name.trim())} className="w-full gap-2">
              <Calculator className="w-4 h-4" />
              {calculating ? (nc.calculating || 'Calculating...') : (nc.calculateRecipeBtn || 'Calculate recipe')}
            </Button>
          </TabsContent>
        </Tabs>
      )}

      {/* Calculating state */}
      {calculating && (
        <div className="flex flex-col items-center justify-center py-12 gap-4">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
            className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent"
          />
          <motion.p
            key={loadingTipIdx}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm text-muted-foreground"
          >
            {loadingTips[loadingTipIdx]}
          </motion.p>
        </div>
      )}

      {/* RESULTS */}
      {result && vals && !calculating && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          {/* Food name */}
          <Card>
            <CardContent className="p-5 text-center">
              <h2 className="text-lg font-bold text-foreground">
                {result.food_name || result.recipe_name}
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                {result.identified_amount || (mode === 'recipe' ? `${result.portions} ${nc.portionsWord || 'portions'} • ~${result.per_portion_weight}${nc.unitG || 'g'}` : '')}
              </p>
              {result.data_source && (
                <Badge 
                  variant="secondary" 
                  className={`mt-2 text-[10px] ${
                    result.data_source === 'Open Food Facts'
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                  }`}
                >
                  {result.data_source === 'Open Food Facts'
                    ? `✅ ${off.dataFromLabel || 'Data from label'}`
                    : `🤖 ${off.aiEstimate || 'AI estimate'}`
                  }
                </Badge>
              )}
            </CardContent>
          </Card>

          {/* View mode toggle for recipe */}
          {mode === 'recipe' && (
            <div className="flex gap-1 bg-muted rounded-lg p-1">
              {(['serving', 'total', 'per100g'] as const).map(rm => (
                <button
                  key={rm}
                  onClick={() => setResultMode(rm)}
                  className={`flex-1 text-xs py-1.5 rounded-md font-medium transition-all ${
                    resultMode === rm ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'
                  }`}
                >
                  {rm === 'serving' ? (nc.perServing || 'Per serving') : rm === 'total' ? (nc.wholeRecipe || 'Whole recipe') : (nc.per100g || 'Per 100g')}
                </button>
              ))}
            </div>
          )}

          {mode === 'food' && (
            <div className="flex gap-1 bg-muted rounded-lg p-1">
              {(['serving', 'per100g'] as const).map(rm => (
                <button
                  key={rm}
                  onClick={() => setResultMode(rm)}
                  className={`flex-1 text-xs py-1.5 rounded-md font-medium transition-all ${
                    resultMode === rm ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'
                  }`}
                >
                  {rm === 'serving' ? (nc.perServing || 'Per serving') : (nc.per100g || 'Per 100g')}
                </button>
              ))}
            </div>
          )}

          {/* Big calories */}
          <div className="text-center py-2">
            <span className="text-5xl font-black text-foreground">{Math.round(vals.calories || 0)}</span>
            <p className="text-sm text-muted-foreground mt-1">{nc.kcal || 'kcal'}</p>
          </div>

          {/* Macros */}
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: nc.protein || 'Protein', value: vals.protein, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-100 dark:bg-purple-900/30' },
              { label: nc.fat || 'Fat', value: vals.fat, color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-100 dark:bg-yellow-900/30' },
              { label: nc.carbs || 'Carbs', value: vals.carbs, color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-100 dark:bg-orange-900/30' },
              { label: nc.fiber || 'Fiber', value: vals.fiber, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-900/30' },
            ].map((macro, i) => (
              <div key={i} className={`${macro.bg} rounded-xl p-3 text-center`}>
                <div className={`text-lg font-bold ${macro.color}`}>{Math.round(macro.value || 0)}{nc.unitG || 'g'}</div>
                <div className="text-[10px] font-medium text-muted-foreground mt-0.5">{macro.label}</div>
              </div>
            ))}
          </div>

          {/* Progress bars vs daily targets */}
          <Card>
            <CardContent className="p-4 space-y-3">
              {[
                { label: nc.protein || 'Protein', value: vals.protein || 0, target: 100, color: 'bg-purple-500' },
                { label: nc.fat || 'Fat', value: vals.fat || 0, target: 65, color: 'bg-yellow-500' },
                { label: nc.carbs || 'Carbs', value: vals.carbs || 0, target: 250, color: 'bg-orange-500' },
              ].map((bar, i) => {
                const pct = Math.min(Math.round((bar.value / bar.target) * 100), 100);
                return (
                  <div key={i}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">{bar.label}</span>
                      <span className="text-foreground font-medium">{Math.round(bar.value)}{nc.unitG || 'g'} / {bar.target}{nc.unitG || 'g'} ({pct}%)</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className={`h-full ${bar.color} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Health badges */}
          {getBadges().length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {getBadges().map((badge, i) => (
                <Badge key={i} className={`text-xs border-0 ${badge.color}`}>{badge.text}</Badge>
              ))}
            </div>
          )}

          {/* Ingredients breakdown */}
          {result.ingredients_breakdown && result.ingredients_breakdown.length > 0 && (
            <Card>
              <CardContent className="p-4">
                <button
                  onClick={() => setExpandedBreakdown(!expandedBreakdown)}
                  className="flex items-center justify-between w-full text-sm font-semibold text-foreground"
                >
                  <span>📋 {nc.breakdown || 'Breakdown'}</span>
                  {expandedBreakdown ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                <AnimatePresence>
                  {expandedBreakdown && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-3 space-y-2"
                    >
                      {result.ingredients_breakdown.map((ing, i) => (
                        <div key={i} className="flex items-center justify-between text-xs">
                          <span className="text-foreground">{ing.name} {ing.amount}</span>
                          <span className="text-muted-foreground">
                            {ing.calories} {nc.kcal || 'kcal'} • {nc.proteinShort || 'P'}:{ing.protein} {nc.fatShort || 'F'}:{ing.fat} {nc.carbsShort || 'C'}:{ing.carbs}
                          </span>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          )}

          {/* Additional nutrients */}
          {(result.sugar || result.sodium) && (
            <Card>
              <CardContent className="p-4">
                <button
                  onClick={() => setExpandedDetails(!expandedDetails)}
                  className="flex items-center justify-between w-full text-sm font-semibold text-foreground"
                >
                  <span>{nc.moreDetails || 'More details →'}</span>
                  {expandedDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                <AnimatePresence>
                  {expandedDetails && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-3 space-y-1"
                    >
                      {result.sugar !== undefined && <div className="flex justify-between text-xs"><span className="text-muted-foreground">{nc.sugar || 'Sugar'}</span><span className="text-foreground">{result.sugar}{nc.unitG || 'g'}</span></div>}
                      {result.sodium !== undefined && <div className="flex justify-between text-xs"><span className="text-muted-foreground">{nc.sodium || 'Sodium'}</span><span className="text-foreground">{result.sodium}{nc.unitMg || 'mg'}</span></div>}
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          )}

          {result.note && (
            <p className="text-xs text-muted-foreground italic">{result.note}</p>
          )}

          {/* Action buttons */}
          <div className="flex gap-2">
            <Button className="flex-1 gap-1" onClick={() => setMealTypeDialog(true)}>
              <Plus className="w-4 h-4" /> {nc.addToDiary || 'Add to diary'}
            </Button>
            <Button variant="outline" onClick={clearAndReset} className="gap-1">
              🔄 {nc.calcAnother || 'New'}
            </Button>
          </div>
        </motion.div>
      )}

      {/* Meal type picker dialog */}
      <Dialog open={mealTypeDialog} onOpenChange={setMealTypeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{nc.pickMealType || 'Which meal?'}</DialogTitle>
            <DialogDescription>{nc.pickMealTypeDesc || 'Choose the meal type to log'}</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-2">
            {[
              { type: 'breakfast', label: nc.breakfast || t.diary.breakfast, emoji: '🌅' },
              { type: 'lunch', label: nc.lunch || t.diary.lunch, emoji: '☀️' },
              { type: 'dinner', label: nc.dinner || t.diary.dinner, emoji: '🌙' },
              { type: 'snack', label: nc.snack || t.diary.snack, emoji: '🍎' },
            ].map(m => (
              <Button
                key={m.type}
                variant="outline"
                className="h-14 gap-2 text-sm"
                onClick={() => logToDiary(m.type)}
              >
                <span className="text-lg">{m.emoji}</span>
                {m.label}
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* History */}
      {!result && history.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-muted-foreground mb-2">
            🕐 {nc.recentCalcs || 'Recent calculations'}
          </h3>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {history.map((item, i) => (
              <button
                key={i}
                onClick={() => { setResult(item.result); setMode(item.mode as 'food' | 'recipe'); }}
                className="shrink-0 text-xs px-3 py-2 rounded-lg bg-card border border-border text-foreground hover:bg-accent transition-colors"
              >
                {item.name} • {item.calories} {nc.kcal || 'kcal'}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default NutritionCalculator;
