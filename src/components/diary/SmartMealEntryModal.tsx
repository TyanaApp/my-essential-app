import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useTranslation } from '@/hooks/useTranslation';
import { useLanguage } from '@/contexts/LanguageContext';
import { useStreak } from '@/hooks/useStreak';
import { useFoodValidation } from '@/hooks/useFoodValidation';
import OFFProductSuggestions from '@/components/OFFProductSuggestions';
import { OFFProduct } from '@/lib/openFoodFacts';

interface SmartMealEntryModalProps {
  open: boolean;
  onClose: () => void;
  mealType: string;
  dateStr: string;
  onSaved: (entry: any) => void;
}

interface BreakdownItem {
  ingredient: string;
  amount: string;
  calories: number;
}

interface MealResult {
  meal_name: string;
  identified_as?: string;
  quantity_used?: string;
  portion_description: string;
  total_calories: number;
  protein: number;
  fat: number;
  carbs: number;
  sugar?: number;
  fiber?: number;
  breakdown?: BreakdownItem[];
  data_source?: string;
  confidence: 'high' | 'medium' | 'low';
  note: string;
}

// Cache helpers
const CACHE_PREFIX = 'calories_cache_';
const CACHE_EXPIRY_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

const getCachedResult = (key: string): MealResult | null => {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return null;
    const { result, timestamp } = JSON.parse(raw);
    if (Date.now() - timestamp > CACHE_EXPIRY_MS) {
      localStorage.removeItem(CACHE_PREFIX + key);
      return null;
    }
    return result;
  } catch { return null; }
};

const setCachedResult = (key: string, result: MealResult) => {
  try {
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify({ result, timestamp: Date.now() }));
  } catch { /* storage full, ignore */ }
};

type FoodCategory = 'countable' | 'handful' | 'drink' | 'sliced' | 'bowl' | 'packaged' | 'fruit' | 'berries' | 'mixed';

interface QtyOption {
  label: string;
  value: string;
}

// Detect food category from text
const detectFoodCategory = (text: string): FoodCategory => {
  const t = text.toLowerCase();

  // Countable items (candy bars, eggs)
  if (/конфет|candy|сникерс|snickers|nuts bar|kitkat|кит.?кат|mars|марс|twix|твикс|bounty|баунти|m&m|печень[еёя]|cookie|вафл|wafer|пряник|gingerbread|яйц|egg|ola/i.test(t))
    return 'countable';

  // Handful foods (nuts, seeds, berries by handful)
  if (/орех|nut|миндал|almond|кешью|cashew|фундук|hazelnut|семечк|seed|sēkl/i.test(t))
    return 'handful';

  // Berries / grapes
  if (/виноград|grape|vīnog|клубник|strawberr|zemene|черник|blueberr|малин|raspberr|aven|ягод|berr|ogas/i.test(t))
    return 'berries';

  // Fruit
  if (/яблок|apple|ābols|банан|banana|banān|апельсин|orange|apelsīn|груш|pear|bumbier|персик|peach|слив|plum|манго|mango|киви|kiwi/i.test(t))
    return 'fruit';

  // Drinks
  if (/сок|juice|sula|кефир|kefir|кефір|молоко|milk|pien|чай|tea|tēja|кофе|coffee|kafija|какао|cocoa|компот|компот|вод[аy]|water|ūdens|смузи|smoothie/i.test(t))
    return 'drink';

  // Sliced/portioned
  if (/торт|cake|kūka|пицц|pizza|pica|арбуз|watermelon|arbūz|хлеб|bread|maize|хліб|пирог|pie|пирож|pastry|кусо[кч]/i.test(t))
    return 'sliced';

  // Bowl foods
  if (/каш[аеуи]|porridge|putra|суп|soup|zupa|салат|salad|salāt|рис\b|rice|rīs|пюре|mash|biezenis|плов|pilaf|борщ|borscht|рагу|stew|sautējums/i.test(t))
    return 'bowl';

  // Packaged
  if (/йогурт|yogurt|jogurt|творог|cottage|biezpien|сметан|sour cream|крем|cream/i.test(t))
    return 'packaged';

  return 'mixed';
};

// Quantity presets per food category and language
const getQtyPresets = (category: FoodCategory, lang: string): { question: string; options: QtyOption[] } => {
  const l: Record<string, Record<string, string>> = {
    en: {
      howMany: 'How many?', howMuch: 'How much?', whatSize: 'What size?',
      whatPiece: 'What piece?', whatBowl: 'What bowl?', howManyPacks: 'How many packs?',
      chooseConvenient: 'Choose what fits:',
      pcs: 'pcs', small: 'small', medium: 'medium', large: 'large',
      handful: 'handful', handfulS: 'small handful', handful2: '2 handfuls', handfulL: 'big handful',
      cup200: 'cup ~200ml', glass250: 'glass ~250ml', mug300: 'mug ~300ml', glass2: '2 glasses',
      pieceS: 'small piece', pieceM: 'medium piece', pieceL: 'large piece',
      bowlHalf: 'half bowl', bowlNorm: 'normal bowl', bowlFull: 'full bowl', bowlBig: 'big bowl',
      halfPack: '½ pack', pack1: '1 pack', pack2: '2 packs',
      fruitS: '1 small', fruitM: '1 medium', fruitL: '1 large', fruit2: '2 pcs',
      berryHandful: 'handful ~80g', berryBowl: 'bowl ~150g', berryBig: 'big bowl ~250g',
      byCount: '🔢 By count', byWeight: '⚖️ By weight', byPortion: '🥣 By portion',
      customG: 'custom (grams)',
    },
    ru: {
      howMany: 'Сколько штук?', howMuch: 'Сколько?', whatSize: 'Какой размер?',
      whatPiece: 'Какой кусок?', whatBowl: 'Какая тарелка?', howManyPacks: 'Сколько упаковок?',
      chooseConvenient: 'Выбери как удобнее:',
      pcs: 'шт', small: 'маленький', medium: 'средний', large: 'большой',
      handful: 'горсть', handfulS: 'маленькая горсть', handful2: '2 горсти', handfulL: 'большая горсть',
      cup200: 'чашка ~200мл', glass250: 'стакан ~250мл', mug300: 'кружка ~300мл', glass2: '2 стакана',
      pieceS: 'маленький', pieceM: 'средний', pieceL: 'большой',
      bowlHalf: 'неполная', bowlNorm: 'обычная', bowlFull: 'полная', bowlBig: 'большая',
      halfPack: '½ пачки', pack1: '1 пачка', pack2: '2 пачки',
      fruitS: '1 маленькое', fruitM: '1 среднее', fruitL: '1 большое', fruit2: '2 шт',
      berryHandful: 'горсть ~80г', berryBowl: 'пиала ~150г', berryBig: 'большая пиала ~250г',
      byCount: '🔢 Количество', byWeight: '⚖️ Вес в граммах', byPortion: '🥣 Размер порции',
      customG: 'своё (граммы)',
    },
    uk: {
      howMany: 'Скільки штук?', howMuch: 'Скільки?', whatSize: 'Який розмір?',
      whatPiece: 'Який шматок?', whatBowl: 'Яка тарілка?', howManyPacks: 'Скільки упаковок?',
      chooseConvenient: 'Обери як зручніше:',
      pcs: 'шт', small: 'маленький', medium: 'середній', large: 'великий',
      handful: 'жменя', handfulS: 'маленька жменя', handful2: '2 жмені', handfulL: 'велика жменя',
      cup200: 'чашка ~200мл', glass250: 'склянка ~250мл', mug300: 'кружка ~300мл', glass2: '2 склянки',
      pieceS: 'маленький', pieceM: 'середній', pieceL: 'великий',
      bowlHalf: 'неповна', bowlNorm: 'звичайна', bowlFull: 'повна', bowlBig: 'велика',
      halfPack: '½ пачки', pack1: '1 пачка', pack2: '2 пачки',
      fruitS: '1 маленьке', fruitM: '1 середнє', fruitL: '1 велике', fruit2: '2 шт',
      berryHandful: 'жменя ~80г', berryBowl: 'піала ~150г', berryBig: 'велика піала ~250г',
      byCount: '🔢 Кількість', byWeight: '⚖️ Вага в грамах', byPortion: '🥣 Розмір порції',
      customG: 'своє (грами)',
    },
    lv: {
      howMany: 'Cik gabalu?', howMuch: 'Cik daudz?', whatSize: 'Kāds izmērs?',
      whatPiece: 'Kāds gabals?', whatBowl: 'Kāds šķīvis?', howManyPacks: 'Cik iepakojumu?',
      chooseConvenient: 'Izvēlies kā ērtāk:',
      pcs: 'gab', small: 'mazs', medium: 'vidējs', large: 'liels',
      handful: 'sauja', handfulS: 'maza sauja', handful2: '2 saujas', handfulL: 'liela sauja',
      cup200: 'tase ~200ml', glass250: 'glāze ~250ml', mug300: 'krūze ~300ml', glass2: '2 glāzes',
      pieceS: 'mazs', pieceM: 'vidējs', pieceL: 'liels',
      bowlHalf: 'nepilns', bowlNorm: 'parasts', bowlFull: 'pilns', bowlBig: 'liels',
      halfPack: '½ iepak', pack1: '1 iepak', pack2: '2 iepak',
      fruitS: '1 mazs', fruitM: '1 vidējs', fruitL: '1 liels', fruit2: '2 gab',
      berryHandful: 'sauja ~80g', berryBowl: 'bļoda ~150g', berryBig: 'liela bļoda ~250g',
      byCount: '🔢 Daudzums', byWeight: '⚖️ Svars gramos', byPortion: '🥣 Porcijas izmērs',
      customG: 'cits (grami)',
    },
  };

  const s = l[lang] || l.en;

  switch (category) {
    case 'countable':
      return {
        question: s.howMany,
        options: [
          { label: '1', value: '1 piece' },
          { label: '2', value: '2 pieces' },
          { label: '3', value: '3 pieces' },
          { label: '4', value: '4 pieces' },
          { label: '5', value: '5 pieces' },
        ],
      };
    case 'handful':
      return {
        question: s.howMuch,
        options: [
          { label: `🤏 ${s.handfulS}`, value: 'small handful ~15g' },
          { label: `✋ ${s.handful}`, value: 'handful ~30g' },
          { label: `🫲 ${s.handful2}`, value: '2 handfuls ~60g' },
          { label: `🖐 ${s.handfulL}`, value: 'big handful ~50g' },
        ],
      };
    case 'drink':
      return {
        question: s.howMuch,
        options: [
          { label: `☕ ${s.cup200}`, value: 'cup ~200ml' },
          { label: `🥛 ${s.glass250}`, value: 'glass ~250ml' },
          { label: `🍵 ${s.mug300}`, value: 'mug ~300ml' },
          { label: `🥛🥛 ${s.glass2}`, value: '2 glasses ~500ml' },
        ],
      };
    case 'sliced':
      return {
        question: s.whatPiece,
        options: [
          { label: `🔸 ${s.pieceS}`, value: 'small piece' },
          { label: `🔶 ${s.pieceM}`, value: 'medium piece' },
          { label: `🟠 ${s.pieceL}`, value: 'large piece' },
        ],
      };
    case 'bowl':
      return {
        question: s.whatBowl,
        options: [
          { label: `🥣 ${s.bowlHalf}`, value: 'half bowl ~150g' },
          { label: `🍲 ${s.bowlNorm}`, value: 'normal bowl ~300g' },
          { label: `🥘 ${s.bowlFull}`, value: 'full bowl ~400g' },
          { label: `🫕 ${s.bowlBig}`, value: 'big bowl ~500g' },
        ],
      };
    case 'packaged':
      return {
        question: s.howManyPacks,
        options: [
          { label: s.halfPack, value: 'half pack' },
          { label: s.pack1, value: '1 pack' },
          { label: s.pack2, value: '2 packs' },
        ],
      };
    case 'fruit':
      return {
        question: s.whatSize,
        options: [
          { label: `🍎 ${s.fruitS}`, value: '1 small fruit' },
          { label: `🍎 ${s.fruitM}`, value: '1 medium fruit' },
          { label: `🍎 ${s.fruitL}`, value: '1 large fruit' },
          { label: `🍎🍎 ${s.fruit2}`, value: '2 medium fruits' },
        ],
      };
    case 'berries':
      return {
        question: s.howMuch,
        options: [
          { label: `🫐 ${s.berryHandful}`, value: 'handful ~80g' },
          { label: `🍇 ${s.berryBowl}`, value: 'bowl ~150g' },
          { label: `🍇 ${s.berryBig}`, value: 'big bowl ~250g' },
        ],
      };
    default: // mixed
      return {
        question: s.chooseConvenient,
        options: [
          { label: s.byCount, value: '__mode_count' },
          { label: s.byPortion, value: '__mode_portion' },
        ],
      };
  }
};

const SmartMealEntryModal = ({ open, onClose, mealType, dateStr, onSaved }: SmartMealEntryModalProps) => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const { language } = useLanguage();
  const { updateStreak } = useStreak();
  const { validateFood } = useFoodValidation();

  const sm = (t as any).smartEntry || {};

  const [step, setStep] = useState<'input' | 'quantity' | 'analyzing' | 'result'>('input');
  const [mealText, setMealText] = useState('');
  const [clarifications, setClarifications] = useState<string[]>([]);
  const [result, setResult] = useState<MealResult | null>(null);
  const [saving, setSaving] = useState(false);
  const [favoriteRecipes, setFavoriteRecipes] = useState<{ id: string; title: string }[]>([]);
  const [recentMeals, setRecentMeals] = useState<string[]>([]);

  // Quantity state
  const [foodCategory, setFoodCategory] = useState<FoodCategory>('mixed');
  const [selectedQty, setSelectedQty] = useState<string | null>(null);
  const [customQty, setCustomQty] = useState('');
  const [showCustom, setShowCustom] = useState(false);
  // For mixed mode sub-selections
  const [mixedMode, setMixedMode] = useState<'count' | 'weight' | 'portion' | null>(null);
  const [mixedValue, setMixedValue] = useState('');
  const [mixedUnit, setMixedUnit] = useState<'g' | 'kg'>('g');
  const [showBreakdown, setShowBreakdown] = useState(false);

  // Load favorite recipes and recent meals
  useEffect(() => {
    if (!user || !open) return;
    const loadSuggestions = async () => {
      const [recipesRes, recentRes] = await Promise.all([
        supabase.from('recipes').select('id, title').eq('user_id', user.id).eq('is_favorite', true).order('created_at', { ascending: false }).limit(5),
        supabase.from('meal_entries').select('custom_name, created_at').eq('user_id', user.id).not('custom_name', 'is', null).order('created_at', { ascending: false }).limit(30),
      ]);
      if (recipesRes.data) setFavoriteRecipes(recipesRes.data);
      if (recentRes.data) {
        const unique: string[] = [];
        for (const r of recentRes.data) {
          if (r.custom_name && !unique.includes(r.custom_name)) unique.push(r.custom_name);
          if (unique.length >= 5) break;
        }
        setRecentMeals(unique);
      }
    };
    loadSuggestions();
  }, [user, open]);

  // Clarification chips logic
  const getClarificationChips = (text: string): { label: string; value: string }[] => {
    const lower = text.toLowerCase();
    const chips = sm.clarificationChips || {};

    if (/лазань|lasagn/i.test(lower)) return chips.lasagna || [
      { label: '🏠 ' + (sm.homemade || 'Homemade'), value: 'homemade' },
      { label: '🍽 ' + (sm.restaurant || 'Restaurant'), value: 'restaurant' },
      { label: '🏪 ' + (sm.storeBought || 'Store-bought'), value: 'store-bought' },
    ];
    if (/салат|salad/i.test(lower)) return chips.salad || [
      { label: '🫒 ' + (sm.withOil || 'With oil'), value: 'with oil' },
      { label: '🥫 ' + (sm.withMayo || 'With mayo'), value: 'with mayo' },
      { label: '🥗 ' + (sm.noDressing || 'No dressing'), value: 'no dressing' },
    ];
    if (/суп|soup|борщ|borscht/i.test(lower)) return chips.soup || [
      { label: '🥄 ' + (sm.withSourCream || 'With sour cream'), value: 'with sour cream' },
      { label: '🍞 ' + (sm.withBread || 'With bread'), value: 'with bread' },
      { label: '🍵 ' + (sm.justSoup || 'Just soup'), value: 'just soup' },
    ];
    if (/каш|porridge|oat/i.test(lower)) return chips.porridge || [
      { label: '💧 ' + (sm.withWater || 'With water'), value: 'with water' },
      { label: '🥛 ' + (sm.withMilk || 'With milk'), value: 'with milk' },
      { label: '🧈 ' + (sm.withButter || 'With butter'), value: 'with butter' },
    ];
    return [];
  };

  const mealTypeChips: Record<string, { emoji: string; label: string }[]> = {
    breakfast: [
      { emoji: '☕️', label: sm.qCoffee || 'Coffee with milk' },
      { emoji: '🥣', label: sm.qOatmeal || 'Oatmeal' },
      { emoji: '🍳', label: sm.qEggs || 'Fried eggs' },
      { emoji: '🥞', label: sm.qPancakes || 'Pancakes' },
      { emoji: '🍞', label: sm.qToast || 'Toast with butter' },
      { emoji: '🧇', label: sm.qOmelette || 'Omelette' },
      { emoji: '🥛', label: sm.qYogurt || 'Yogurt with fruit' },
      { emoji: '🫐', label: sm.qCottage || 'Cottage cheese' },
    ],
    lunch: [
      { emoji: '🍲', label: sm.qSoup || 'Soup' },
      { emoji: '🍝', label: sm.qPasta || 'Pasta' },
      { emoji: '🍗', label: sm.qChickenSide || 'Chicken with side' },
      { emoji: '🥗', label: sm.qSalad || 'Salad' },
      { emoji: '🍚', label: sm.qRiceVeg || 'Rice with vegetables' },
      { emoji: '🥙', label: sm.qWrap || 'Wrap' },
      { emoji: '🫕', label: sm.qStew || 'Stew' },
      { emoji: '🥩', label: sm.qMeatSide || 'Meat with side' },
    ],
    dinner: [
      { emoji: '🐟', label: sm.qFish || 'Fish' },
      { emoji: '🥩', label: sm.qSteak || 'Steak' },
      { emoji: '🍝', label: sm.qPasta || 'Pasta' },
      { emoji: '🥗', label: sm.qLightSalad || 'Light salad' },
      { emoji: '🍲', label: sm.qSoup || 'Soup' },
      { emoji: '🫕', label: sm.qBraisedMeat || 'Braised meat' },
      { emoji: '🥦', label: sm.qGrilledVeg || 'Grilled vegetables' },
      { emoji: '🍗', label: sm.qBakedChicken || 'Baked chicken' },
    ],
    snack: [
      { emoji: '🍎', label: sm.qFruit || 'Fruit' },
      { emoji: '🥜', label: sm.qNuts || 'Nuts' },
      { emoji: '🧃', label: sm.qJuice || 'Juice' },
      { emoji: '☕️', label: sm.qCoffee || 'Coffee' },
      { emoji: '🍫', label: sm.qChocolate || 'Chocolate' },
      { emoji: '🥛', label: sm.qKefir || 'Kefir' },
      { emoji: '🍌', label: sm.qBanana || 'Banana' },
      { emoji: '🧆', label: sm.qHummus || 'Hummus with veggies' },
    ],
  };

  const quickLogItems = mealTypeChips[mealType] || mealTypeChips.lunch;

  const reset = () => {
    setStep('input');
    setMealText('');
    setClarifications([]);
    setResult(null);
    setSelectedQty(null);
    setCustomQty('');
    setShowCustom(false);
    setMixedMode(null);
    setMixedValue('');
    setMixedUnit('g');
    setFoodCategory('mixed');
    setShowBreakdown(false);
  };

  const handleClose = () => { reset(); onClose(); };

  const handleQuickLog = (label: string) => {
    setMealText(label);
    const cat = detectFoodCategory(label);
    setFoodCategory(cat);
    // Auto-select default for presets
    const presets = getQtyPresets(cat, language);
    if (cat !== 'mixed' && presets.options.length > 0) {
      // Pick a sensible default (usually the second option)
      const defaultIdx = cat === 'countable' ? 0 : Math.min(1, presets.options.length - 1);
      setSelectedQty(presets.options[defaultIdx].value);
    }
    setStep('quantity');
  };

  const handleProceedToQuantity = () => {
    if (!mealText.trim()) return;
    const cat = detectFoodCategory(mealText.trim());
    setFoodCategory(cat);
    const presets = getQtyPresets(cat, language);
    if (cat !== 'mixed' && presets.options.length > 0) {
      const defaultIdx = cat === 'countable' ? 0 : Math.min(1, presets.options.length - 1);
      setSelectedQty(presets.options[defaultIdx].value);
    }
    setStep('quantity');
  };

  // Build quantity description for the edge function
  const getQuantityDescription = (): string => {
    if (showCustom && customQty.trim()) return `${customQty}g`;
    if (mixedMode === 'weight' && mixedValue.trim()) return `${mixedValue}${mixedUnit}`;
    if (mixedMode === 'count' && mixedValue.trim()) return `${mixedValue} pieces`;
    if (mixedMode === 'portion') return selectedQty || 'medium portion';
    return selectedQty || 'medium portion';
  };

  const handleAnalyze = async () => {
    if (!mealText.trim()) return;

    const isFood = await validateFood(mealText.trim());
    if (!isFood) return;

    const qtyDesc = getQuantityDescription();
    
    // Check cache first
    const cacheKey = (mealText.trim() + '|' + qtyDesc + '|' + language).toLowerCase().replace(/\s+/g, '_');
    const cached = getCachedResult(cacheKey);
    if (cached) {
      setResult(cached);
      setStep('result');
      return;
    }

    setStep('analyzing');
    try {
      const { data, error } = await supabase.functions.invoke('calculate-meal-calories', {
        body: {
          mealDescription: mealText.trim(),
          quantityDescription: qtyDesc,
          foodCategory,
          clarifications: clarifications.join(', '),
          language,
        },
      });

      if (error || data?.error) {
        toast.error(sm.calcFailed || 'Could not calculate. Try again.');
        setStep('quantity');
        return;
      }

      const resultData = data as MealResult;
      setResult(resultData);
      setCachedResult(cacheKey, resultData);
      setStep('result');
    } catch {
      toast.error(sm.calcFailed || 'Could not calculate. Try again.');
      setStep('quantity');
    }
  };

  const handleLog = async () => {
    if (!user || !result) return;
    setSaving(true);
    try {
      const { data, error } = await supabase.from('meal_entries').insert({
        user_id: user.id,
        date: dateStr,
        meal_type: mealType,
        custom_name: result.meal_name,
        total_calories: result.total_calories,
        total_protein: result.protein,
        total_fat: result.fat,
        total_carbs: result.carbs,
      } as any).select().single();

      if (error) throw error;
      if (data) onSaved(data);
      toast.success(sm.loggedToDiary || 'Logged to diary ✓');
      handleClose();
      await updateStreak();
    } catch {
      toast.error(t.common.error);
    } finally {
      setSaving(false);
    }
  };

  const getDataSourceLabel = (source: string | undefined) => {
    const labels: Record<string, Record<string, string>> = {
      en: { official_label: 'Official label', recipe_calculation: 'Recipe calculation', database_lookup: 'Database lookup', estimation: 'Estimated', 'Open Food Facts': '✅ Data from label' },
      ru: { official_label: 'Официальная этикетка', recipe_calculation: 'Расчёт по рецепту', database_lookup: 'База данных', estimation: 'Оценка', 'Open Food Facts': '✅ Данные с этикетки' },
      uk: { official_label: 'Офіційне маркування', recipe_calculation: 'Розрахунок за рецептом', database_lookup: 'База даних', estimation: 'Оцінка', 'Open Food Facts': '✅ Дані з етикетки' },
      lv: { official_label: 'Oficiālā etiķete', recipe_calculation: 'Receptes aprēķins', database_lookup: 'Datubāze', estimation: 'Novērtējums', 'Open Food Facts': '✅ Dati no etiķetes' },
    };
    const l = labels[language] || labels.en;
    return l[source || 'estimation'] || l.estimation;
  };

  const confidenceBadge = (conf: string) => {
    const dsLabels: Record<string, Record<string, string>> = {
      en: { high: 'High accuracy', medium: 'Approximate', low: 'Estimated' },
      ru: { high: 'Высокая точность', medium: 'Приблизительно', low: 'Оценка' },
      uk: { high: 'Висока точність', medium: 'Приблизно', low: 'Оцінка' },
      lv: { high: 'Augsta precizitāte', medium: 'Aptuveni', low: 'Novērtējums' },
    };
    const l = dsLabels[language] || dsLabels.en;
    if (conf === 'high') return { emoji: '✅', label: l.high, color: '#059669' };
    if (conf === 'medium') return { emoji: '⚠️', label: l.medium, color: '#EA580C' };
    return { emoji: '❓', label: l.low, color: '#DC2626' };
  };

  const toggleClarification = (value: string) => {
    setClarifications(prev =>
      prev.includes(value) ? prev.filter(c => c !== value) : [...prev, value]
    );
  };

  if (!open) return null;

  const chips = getClarificationChips(mealText);
  const qtyPresets = getQtyPresets(foodCategory, language);

  const customLabel = sm.customGrams || (language === 'ru' ? 'своё (граммы)' : language === 'uk' ? 'своє (грами)' : language === 'lv' ? 'cits (grami)' : 'custom (grams)');

  // Mixed mode sub-presets
  const portionSubOptions: QtyOption[] = [
    { label: `🤏 ${language === 'ru' ? 'Мало' : language === 'uk' ? 'Мало' : language === 'lv' ? 'Maz' : 'Small'}`, value: 'small portion' },
    { label: `🍽 ${language === 'ru' ? 'Обычно' : language === 'uk' ? 'Звичайно' : language === 'lv' ? 'Parasts' : 'Normal'}`, value: 'normal portion' },
    { label: `🥘 ${language === 'ru' ? 'Много' : language === 'uk' ? 'Багато' : language === 'lv' ? 'Daudz' : 'Large'}`, value: 'large portion' },
    { label: `😅 ${language === 'ru' ? 'Очень много' : language === 'uk' ? 'Дуже багато' : language === 'lv' ? 'Ļoti daudz' : 'Very large'}`, value: 'very large portion' },
  ];

  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        className="bg-card rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md max-h-[90vh] flex flex-col"
        style={{ boxShadow: '0 -4px 40px rgba(0,0,0,0.15)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border shrink-0">
          <div className="flex items-center gap-2">
            {step !== 'input' && step !== 'analyzing' && (
              <button onClick={() => {
                if (step === 'result') setStep('quantity');
                else { setStep('input'); setSelectedQty(null); setShowCustom(false); setMixedMode(null); }
              }} className="p-1 rounded-lg hover:bg-muted">
                <ArrowLeft className="w-5 h-5 text-muted-foreground" />
              </button>
            )}
            <h2 className="text-lg font-bold text-foreground">
              {step === 'input' ? (sm.whatDidYouEat || '📝 What did you eat?') :
               step === 'quantity' ? (sm.howMuch || '🍽 How much?') :
               step === 'analyzing' ? (sm.calculating || '🤖 Calculating...') :
               (sm.result || '✅ Result')}
            </h2>
          </div>
          <button onClick={handleClose} className="p-1 rounded-lg hover:bg-muted">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* INPUT STEP */}
          {step === 'input' && (
            <div className="space-y-4">
              {/* Quick log chips */}
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">{sm.quickLog || '⚡ Quick log'}</p>
                <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
                  {quickLogItems.map((item: any, i: number) => (
                    <button
                      key={i}
                      onClick={() => handleQuickLog(item.label)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap border border-border bg-muted/30 hover:bg-primary/10 hover:border-primary/30 transition-colors shrink-0"
                    >
                      <span>{item.emoji}</span> {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Favorite recipes */}
              {favoriteRecipes.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">{sm.fromRecipes || '🍽 From your recipes:'}</p>
                  <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
                    {favoriteRecipes.map((r) => (
                      <button
                        key={r.id}
                        onClick={() => handleQuickLog(r.title)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap border border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors shrink-0"
                      >
                        🍽 {r.title}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent meals */}
              {recentMeals.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">{sm.recentlyEaten || '🕐 Recently eaten:'}</p>
                  <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
                    {recentMeals.map((name, i) => (
                      <button
                        key={i}
                        onClick={() => handleQuickLog(name)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap border border-border bg-muted/30 hover:bg-muted/50 transition-colors shrink-0"
                      >
                        🔄 {name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Text input with OFF suggestions */}
              <div className="relative">
                <p className="text-xs font-medium text-muted-foreground mb-2">{sm.orDescribe || 'Or describe your meal'}</p>
                <textarea
                  value={mealText}
                  onChange={(e) => setMealText(e.target.value)}
                  placeholder={sm.inputPlaceholder || 'e.g. bowl of borscht with sour cream'}
                  className="w-full h-20 px-4 py-3 rounded-xl border border-border bg-muted/20 text-sm outline-none focus:border-primary resize-none text-foreground placeholder:text-muted-foreground"
                  autoFocus
                />
                <OFFProductSuggestions
                  query={mealText}
                  onSelect={(product: OFFProduct) => {
                    // Pre-fill with OFF data and go straight to result
                    const offResult: MealResult = {
                      meal_name: product.brand ? `${product.name} (${product.brand})` : product.name,
                      portion_description: '100g',
                      total_calories: product.calories,
                      protein: product.protein,
                      fat: product.fat,
                      carbs: product.carbs,
                      sugar: product.sugar,
                      fiber: product.fiber,
                      data_source: 'Open Food Facts',
                      confidence: 'high',
                      note: '',
                    };
                    setMealText(product.name);
                    setResult(offResult);
                    setStep('result');
                  }}
                  className="absolute z-10 left-0 right-0 top-full mt-1"
                />
              </div>
            </div>
          )}

          {/* QUANTITY STEP */}
          {step === 'quantity' && (
            <div className="space-y-4">
              {/* Show what they typed */}
              <div className="px-3 py-2.5 rounded-xl bg-muted/30 border border-border">
                <p className="text-sm font-medium text-foreground">{mealText}</p>
              </div>

              {/* Clarification chips */}
              {chips.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">{sm.clarify || 'Clarify (optional):'}</p>
                  <div className="flex flex-wrap gap-2">
                    {chips.map((chip) => (
                      <button
                        key={chip.value}
                        onClick={() => toggleClarification(chip.value)}
                        className="px-3 py-1.5 rounded-full text-xs font-medium transition-all border"
                        style={{
                          borderColor: clarifications.includes(chip.value) ? 'hsl(var(--primary))' : 'hsl(var(--border))',
                          backgroundColor: clarifications.includes(chip.value) ? 'hsl(var(--primary) / 0.15)' : 'transparent',
                          color: clarifications.includes(chip.value) ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
                        }}
                      >
                        {chip.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Smart quantity selector */}
              <div>
                <p className="text-xs font-semibold text-foreground mb-3">{qtyPresets.question}</p>

                {/* For mixed mode: show mode selector first */}
                {foodCategory === 'mixed' && !mixedMode && (
                  <div className="flex flex-col gap-2">
                    {qtyPresets.options.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => {
                          if (opt.value === '__mode_count') setMixedMode('count');
                          else if (opt.value === '__mode_weight') setMixedMode('weight');
                          else if (opt.value === '__mode_portion') { setMixedMode('portion'); setSelectedQty('normal portion'); }
                        }}
                        className="w-full py-3 px-4 rounded-xl text-sm font-medium transition-all border-2 text-left border-border hover:border-primary/40"
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}

                {/* Mixed mode: count input */}
                {foodCategory === 'mixed' && mixedMode === 'count' && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        value={mixedValue}
                        onChange={(e) => setMixedValue(e.target.value)}
                        placeholder="1"
                        className="flex-1 h-12 px-4 rounded-xl border text-center text-lg font-bold outline-none bg-secondary/50 border-border focus:border-primary text-foreground"
                        autoFocus
                        min="1"
                      />
                      <span className="text-sm font-medium text-muted-foreground">
                        {language === 'ru' ? 'шт' : language === 'uk' ? 'шт' : language === 'lv' ? 'gab' : 'pcs'}
                      </span>
                    </div>
                    <button onClick={() => setMixedMode(null)} className="text-xs text-muted-foreground underline">
                      ← {sm.back || 'Back'}
                    </button>
                  </div>
                )}

                {/* Mixed mode: weight input */}
                {foodCategory === 'mixed' && mixedMode === 'weight' && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={mixedValue}
                        onChange={(e) => setMixedValue(e.target.value)}
                        placeholder="100"
                        className="flex-1 h-12 px-4 rounded-xl border text-center text-lg font-bold outline-none bg-secondary/50 border-border focus:border-primary text-foreground"
                        autoFocus
                      />
                      <div className="flex rounded-xl border border-border overflow-hidden">
                        {(['g', 'kg'] as const).map((u) => (
                          <button
                            key={u}
                            onClick={() => setMixedUnit(u)}
                            className="px-4 py-2.5 text-sm font-semibold transition-colors"
                            style={{
                              backgroundColor: mixedUnit === u ? 'hsl(var(--primary) / 0.15)' : 'transparent',
                              color: mixedUnit === u ? 'hsl(var(--primary))' : 'hsl(var(--foreground))',
                            }}
                          >
                            {u === 'g' ? (language === 'ru' || language === 'uk' ? 'г' : 'g') : (language === 'ru' || language === 'uk' ? 'кг' : 'kg')}
                          </button>
                        ))}
                      </div>
                    </div>
                    <button onClick={() => setMixedMode(null)} className="text-xs text-muted-foreground underline">
                      ← {sm.back || 'Back'}
                    </button>
                  </div>
                )}

                {/* Mixed mode: portion selector */}
                {foodCategory === 'mixed' && mixedMode === 'portion' && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      {portionSubOptions.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => setSelectedQty(opt.value)}
                          className="flex flex-col items-center gap-1 py-3 px-2 rounded-xl transition-all border-2"
                          style={{
                            borderColor: selectedQty === opt.value ? 'hsl(var(--primary))' : 'hsl(var(--border))',
                            backgroundColor: selectedQty === opt.value ? 'hsl(var(--primary) / 0.15)' : 'transparent',
                          }}
                        >
                          <span className="text-sm font-semibold" style={{ color: selectedQty === opt.value ? 'hsl(var(--primary))' : 'hsl(var(--foreground))' }}>
                            {opt.label}
                          </span>
                        </button>
                      ))}
                    </div>
                    <button onClick={() => { setMixedMode(null); setSelectedQty(null); }} className="text-xs text-muted-foreground underline">
                      ← {sm.back || 'Back'}
                    </button>
                  </div>
                )}

                {/* Regular category presets */}
                {foodCategory !== 'mixed' && (
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      {qtyPresets.options.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => { setSelectedQty(opt.value); setShowCustom(false); }}
                          className="px-4 py-2.5 rounded-xl text-sm font-semibold transition-all border-2"
                          style={{
                            borderColor: !showCustom && selectedQty === opt.value ? 'hsl(var(--primary))' : 'hsl(var(--border))',
                            backgroundColor: !showCustom && selectedQty === opt.value ? 'hsl(var(--primary) / 0.15)' : 'transparent',
                            color: !showCustom && selectedQty === opt.value ? 'hsl(var(--primary))' : 'hsl(var(--foreground))',
                          }}
                        >
                          {opt.label}
                        </button>
                      ))}
                      {/* Custom grams chip */}
                      <button
                        onClick={() => { setShowCustom(true); setSelectedQty(null); }}
                        className="px-4 py-2.5 rounded-xl text-sm font-semibold transition-all border-2"
                        style={{
                          borderColor: showCustom ? 'hsl(var(--primary))' : 'hsl(var(--border))',
                          backgroundColor: showCustom ? 'hsl(var(--primary) / 0.15)' : 'transparent',
                          color: showCustom ? 'hsl(var(--primary))' : 'hsl(var(--foreground))',
                        }}
                      >
                        ✏️ {customLabel}
                      </button>
                    </div>

                    {/* Custom gram input */}
                    <AnimatePresence>
                      {showCustom && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <input
                            type="number"
                            value={customQty}
                            onChange={(e) => setCustomQty(e.target.value)}
                            placeholder={language === 'ru' ? 'граммы' : language === 'uk' ? 'грами' : language === 'lv' ? 'grami' : 'grams'}
                            className="w-full h-12 px-4 rounded-xl border text-center text-lg font-bold outline-none bg-secondary/50 border-border focus:border-primary text-foreground"
                            autoFocus
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ANALYZING STEP */}
          {step === 'analyzing' && (
            <div className="py-12 text-center space-y-4">
              <div className="flex justify-center">
                <div className="w-16 h-16 rounded-full flex items-center justify-center bg-primary/10 animate-pulse">
                  <span className="text-3xl">🧮</span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">{sm.analyzingHint || 'Calculating nutrition...'}</p>
              <Loader2 className="w-5 h-5 animate-spin mx-auto text-primary" />
            </div>
          )}

          {/* RESULT STEP */}
          {step === 'result' && result && (
            <div className="space-y-4">
              {/* Meal name & data source */}
              <div className="text-center">
                <h3 className="text-lg font-bold text-foreground">🍽 {result.meal_name}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {result.quantity_used || result.portion_description}
                  {result.data_source && ` • ${getDataSourceLabel(result.data_source)}`}
                </p>
              </div>

              {/* Big calorie number */}
              <div className="text-center py-2">
                <span className="text-4xl font-bold text-primary">{result.total_calories}</span>
                <span className="text-lg ml-1 text-primary">{(t as any).diary?.kcalUnit || 'kcal'}</span>
              </div>

              {/* Macro bar - including sugar if present */}
              <div className="flex justify-center gap-4 flex-wrap">
                {[
                  { label: (t as any).dashboard?.protein || 'Protein', value: result.protein, color: '#3B82F6', show: true },
                  { label: (t as any).dashboard?.fat || 'Fat', value: result.fat, color: '#F59E0B', show: true },
                  { label: (t as any).dashboard?.carbs || 'Carbs', value: result.carbs, color: '#10B981', show: true },
                  { label: language === 'ru' ? 'Сахар' : language === 'uk' ? 'Цукор' : language === 'lv' ? 'Cukurs' : 'Sugar', value: result.sugar, color: '#EC4899', show: typeof result.sugar === 'number' && result.sugar > 0 },
                  { label: language === 'ru' ? 'Клетч.' : language === 'uk' ? 'Клітк.' : language === 'lv' ? 'Šķiedr.' : 'Fiber', value: result.fiber, color: '#8B5CF6', show: typeof result.fiber === 'number' && result.fiber > 0 },
                ].filter(m => m.show).map(m => (
                  <div key={m.label} className="text-center">
                    <div className="text-lg font-bold" style={{ color: m.color }}>{m.value}g</div>
                    <div className="text-[10px] font-medium text-muted-foreground">{m.label}</div>
                  </div>
                ))}
              </div>

              {/* Sugar warning */}
              {typeof result.sugar === 'number' && result.sugar > 15 && (
                <div className="flex justify-center">
                  <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-destructive/10 text-destructive">
                    ⚠️ {language === 'ru' ? `Высокое содержание сахара: ${result.sugar}г` :
                         language === 'uk' ? `Високий вміст цукру: ${result.sugar}г` :
                         language === 'lv' ? `Augsts cukura saturs: ${result.sugar}g` :
                         `High sugar content: ${result.sugar}g`}
                  </span>
                </div>
              )}

              {/* Confidence + data source badge */}
              {(() => {
                const badge = confidenceBadge(result.confidence);
                return (
                  <div className="flex justify-center">
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: `${badge.color}15`, color: badge.color }}>
                      {badge.emoji} {badge.label}
                    </span>
                  </div>
                );
              })()}

              {/* Expandable breakdown */}
              {result.breakdown && result.breakdown.length > 0 && (
                <div className="border border-border rounded-xl overflow-hidden">
                  <button
                    onClick={() => setShowBreakdown(!showBreakdown)}
                    className="w-full flex items-center justify-between px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted/30 transition-colors"
                  >
                    <span>📊 {language === 'ru' ? 'Состав' : language === 'uk' ? 'Склад' : language === 'lv' ? 'Sastāvs' : 'Breakdown'}</span>
                    {showBreakdown ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                  </button>
                  <AnimatePresence>
                    {showBreakdown && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-3 space-y-1.5 border-t border-border pt-2">
                          {result.breakdown.map((item, i) => (
                            <div key={i} className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground">{item.ingredient} <span className="opacity-60">{item.amount}</span></span>
                              <span className="font-medium text-foreground tabular-nums">{item.calories} {(t as any).diary?.kcalUnit || 'kcal'}</span>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* Approximate note */}
              <p className="text-xs text-center text-muted-foreground italic">~{sm.approximate || 'approximate'}</p>
            </div>
          )}
        </div>

        {/* STICKY BOTTOM BUTTONS */}
        {step !== 'analyzing' && (
          <div className="shrink-0 border-t border-border p-4 space-y-2 bg-card rounded-b-2xl">
            {step === 'input' && (
              <>
                <button
                  onClick={handleProceedToQuantity}
                  disabled={!mealText.trim()}
                  className="w-full h-12 rounded-xl text-sm font-semibold text-primary-foreground disabled:opacity-40 bg-primary"
                >
                  {sm.next || 'Next →'}
                </button>
                <button onClick={handleClose} className="w-full text-center text-sm text-muted-foreground py-2">
                  {sm.cancel || t.common.cancel || 'Cancel'}
                </button>
              </>
            )}

            {step === 'quantity' && (
              <>
                <button
                  onClick={handleAnalyze}
                  disabled={
                    (foodCategory === 'mixed' && !mixedMode) ||
                    (foodCategory === 'mixed' && mixedMode === 'count' && !mixedValue.trim()) ||
                    (foodCategory === 'mixed' && mixedMode === 'weight' && !mixedValue.trim()) ||
                    (foodCategory !== 'mixed' && !selectedQty && !showCustom) ||
                    (showCustom && !customQty.trim())
                  }
                  className="w-full h-12 rounded-xl text-sm font-semibold text-primary-foreground bg-primary disabled:opacity-40"
                >
                  {sm.calculate || '🧮 Calculate'}
                </button>
                <button onClick={handleClose} className="w-full text-center text-sm text-muted-foreground py-2">
                  {sm.cancel || t.common.cancel || 'Cancel'}
                </button>
              </>
            )}

            {step === 'result' && (
              <>
                <button
                  onClick={handleLog}
                  disabled={saving}
                  className="w-full h-14 rounded-xl text-base font-bold text-primary-foreground bg-primary disabled:opacity-40"
                >
                  {saving ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {sm.calculatingBtn || '⏳ Saving...'}
                    </span>
                  ) : (sm.logToDiary || '✓ Log to diary')}
                </button>
                <button
                  onClick={() => setStep('quantity')}
                  className="w-full h-10 rounded-xl text-sm font-medium border border-border text-muted-foreground hover:bg-muted/30"
                >
                  {sm.changeQty || sm.changePortion || 'Change quantity'}
                </button>
                <button onClick={handleClose} className="w-full text-center text-sm text-muted-foreground py-1">
                  {sm.cancel || t.common.cancel || 'Cancel'}
                </button>
              </>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default SmartMealEntryModal;
