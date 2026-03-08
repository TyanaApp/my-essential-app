import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Loader2, ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useTranslation } from '@/hooks/useTranslation';
import { useLanguage } from '@/contexts/LanguageContext';
import { useStreak } from '@/hooks/useStreak';
import { useFoodValidation } from '@/hooks/useFoodValidation';

interface SmartMealEntryModalProps {
  open: boolean;
  onClose: () => void;
  mealType: string;
  dateStr: string;
  onSaved: (entry: any) => void;
}

interface MealResult {
  meal_name: string;
  portion_description: string;
  total_calories: number;
  protein: number;
  fat: number;
  carbs: number;
  confidence: 'high' | 'medium' | 'low';
  note: string;
}

type PortionSize = 'small' | 'medium' | 'large' | 'xlarge';

const SmartMealEntryModal = ({ open, onClose, mealType, dateStr, onSaved }: SmartMealEntryModalProps) => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const { language } = useLanguage();
  const { updateStreak } = useStreak();
  const { validateFood } = useFoodValidation();

  const sm = (t as any).smartEntry || {};

  const [step, setStep] = useState<'input' | 'portion' | 'analyzing' | 'result'>('input');
  const [mealText, setMealText] = useState('');
  const [portionSize, setPortionSize] = useState<PortionSize>('medium');
  const [clarifications, setClarifications] = useState<string[]>([]);
  const [result, setResult] = useState<MealResult | null>(null);
  const [saving, setSaving] = useState(false);
  const [favoriteRecipes, setFavoriteRecipes] = useState<{ id: string; title: string }[]>([]);
  const [recentMeals, setRecentMeals] = useState<string[]>([]);

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

  const portionOptions: { id: PortionSize; emoji: string; label: string; hint: string }[] = [
    { id: 'small', emoji: '🤏', label: sm.portionSmall || 'Small', hint: sm.portionSmallHint || 'Half portion' },
    { id: 'medium', emoji: '🍽', label: sm.portionMedium || 'Medium', hint: sm.portionMediumHint || 'Normal' },
    { id: 'large', emoji: '🥘', label: sm.portionLarge || 'Large', hint: sm.portionLargeHint || 'Second helping' },
    { id: 'xlarge', emoji: '😅', label: sm.portionXLarge || 'Very large', hint: sm.portionXLargeHint || 'Stuffed' },
  ];

  const reset = () => {
    setStep('input');
    setMealText('');
    setPortionSize('medium');
    setClarifications([]);
    setResult(null);
  };

  const handleClose = () => { reset(); onClose(); };

  const handleQuickLog = (label: string) => {
    setMealText(label);
    setStep('portion');
  };

  const handleProceedToPortion = () => {
    if (!mealText.trim()) return;
    setStep('portion');
  };

  const handleAnalyze = async () => {
    if (!mealText.trim()) return;

    const isFood = await validateFood(mealText.trim());
    if (!isFood) return;

    setStep('analyzing');
    try {
      const { data, error } = await supabase.functions.invoke('calculate-meal-calories', {
        body: {
          mealDescription: mealText.trim(),
          portionSize,
          clarifications: clarifications.join(', '),
          language,
        },
      });

      if (error || data?.error) {
        toast.error(sm.calcFailed || 'Could not calculate. Try again.');
        setStep('portion');
        return;
      }

      setResult(data as MealResult);
      setStep('result');
    } catch {
      toast.error(sm.calcFailed || 'Could not calculate. Try again.');
      setStep('portion');
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
      const reward = await updateStreak();
      if (reward) {
        // reward handling done upstream
      }
    } catch {
      toast.error(t.common.error);
    } finally {
      setSaving(false);
    }
  };

  const confidenceBadge = (conf: string) => {
    if (conf === 'high') return { emoji: '✅', label: sm.confHigh || 'High accuracy', color: '#059669' };
    if (conf === 'medium') return { emoji: '⚠️', label: sm.confMedium || 'Estimated', color: '#EA580C' };
    return { emoji: '❓', label: sm.confLow || 'Approximate', color: '#DC2626' };
  };

  const toggleClarification = (value: string) => {
    setClarifications(prev =>
      prev.includes(value) ? prev.filter(c => c !== value) : [...prev, value]
    );
  };

  if (!open) return null;

  const chips = getClarificationChips(mealText);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
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
              <button onClick={() => setStep(step === 'result' ? 'portion' : 'input')} className="p-1 rounded-lg hover:bg-muted">
                <ArrowLeft className="w-5 h-5 text-muted-foreground" />
              </button>
            )}
            <h2 className="text-lg font-bold text-foreground">
              {step === 'input' ? (sm.whatDidYouEat || '📝 What did you eat?') :
               step === 'portion' ? (sm.howMuch || '🍽 How much?') :
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

              {/* Text input */}
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">{sm.orDescribe || 'Or describe your meal'}</p>
                <textarea
                  value={mealText}
                  onChange={(e) => setMealText(e.target.value)}
                  placeholder={sm.inputPlaceholder || 'e.g. bowl of borscht with sour cream'}
                  className="w-full h-20 px-4 py-3 rounded-xl border border-border bg-muted/20 text-sm outline-none focus:border-primary resize-none text-foreground placeholder:text-muted-foreground"
                  autoFocus
                />
              </div>
            </div>
          )}

          {/* PORTION STEP */}
          {step === 'portion' && (
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
                          borderColor: clarifications.includes(chip.value) ? '#7C3AED' : 'hsl(var(--border))',
                          backgroundColor: clarifications.includes(chip.value) ? '#EDE9FE' : 'transparent',
                          color: clarifications.includes(chip.value) ? '#7C3AED' : 'hsl(var(--muted-foreground))',
                        }}
                      >
                        {chip.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Portion selector */}
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">{sm.portionQuestion || 'How big was the portion?'}</p>
                <div className="grid grid-cols-2 gap-2">
                  {portionOptions.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setPortionSize(p.id)}
                      className="flex flex-col items-center gap-1 py-3 px-2 rounded-xl transition-all border-2"
                      style={{
                        borderColor: portionSize === p.id ? '#7C3AED' : 'hsl(var(--border))',
                        backgroundColor: portionSize === p.id ? '#EDE9FE' : 'transparent',
                      }}
                    >
                      <span className="text-2xl">{p.emoji}</span>
                      <span className="text-xs font-semibold" style={{ color: portionSize === p.id ? '#7C3AED' : 'hsl(var(--foreground))' }}>
                        {p.label}
                      </span>
                      <span className="text-[10px] text-muted-foreground">{p.hint}</span>
                    </button>
                  ))}
                </div>
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
              {/* Meal name & portion */}
              <div className="text-center">
                <h3 className="text-lg font-bold text-foreground">🍽 {result.meal_name}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{result.portion_description}</p>
              </div>

              {/* Big calorie number */}
              <div className="text-center py-2">
                <span className="text-4xl font-bold text-primary">{result.total_calories}</span>
                <span className="text-lg ml-1 text-primary">{(t as any).diary?.kcalUnit || 'kcal'}</span>
              </div>

              {/* Macro bar */}
              <div className="flex justify-center gap-6">
                {[
                  { label: (t as any).dashboard?.protein || 'Protein', value: result.protein, color: '#3B82F6' },
                  { label: (t as any).dashboard?.fat || 'Fat', value: result.fat, color: '#F59E0B' },
                  { label: (t as any).dashboard?.carbs || 'Carbs', value: result.carbs, color: '#10B981' },
                ].map(m => (
                  <div key={m.label} className="text-center">
                    <div className="text-lg font-bold" style={{ color: m.color }}>{m.value}g</div>
                    <div className="text-[10px] font-medium text-muted-foreground">{m.label}</div>
                  </div>
                ))}
              </div>

              {/* Confidence badge */}
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

              {/* Note */}
              {result.note && (
                <p className="text-xs text-center text-muted-foreground italic">~{sm.approximate || 'approximate'}</p>
              )}
            </div>
          )}
        </div>

        {/* STICKY BOTTOM BUTTONS - always visible */}
        {step !== 'analyzing' && (
          <div className="shrink-0 border-t border-border p-4 space-y-2 bg-card rounded-b-2xl">
            {step === 'input' && (
              <>
                <button
                  onClick={handleProceedToPortion}
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

            {step === 'portion' && (
              <>
                <button
                  onClick={handleAnalyze}
                  className="w-full h-12 rounded-xl text-sm font-semibold text-primary-foreground bg-primary"
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
                      {sm.calculatingBtn || '⏳ Calculating...'}
                    </span>
                  ) : (sm.logToDiary || '✓ Log to diary')}
                </button>
                <button
                  onClick={() => setStep('portion')}
                  className="w-full h-10 rounded-xl text-sm font-medium border border-border text-muted-foreground hover:bg-muted/30"
                >
                  {sm.changePortion || 'Change portion'}
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
