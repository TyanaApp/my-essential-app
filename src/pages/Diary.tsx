import { useState, useEffect, useMemo } from 'react';
import { calcMacroTargets } from '@/pages/NutritionAnalysis';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Search, Camera, Refrigerator } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useTranslation } from '@/hooks/useTranslation';
import { useStreak } from '@/hooks/useStreak';
import RewardModal from '@/components/RewardModal';
import MealScanModal from '@/components/diary/MealScanModal';
import FridgePickerModal from '@/components/diary/FridgePickerModal';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

interface MealEntry {
  id: string;
  user_id: string;
  date: string;
  meal_type: string | null;
  recipe_id: string | null;
  custom_name: string | null;
  total_calories: number | null;
  total_protein: number | null;
  total_fat: number | null;
  total_carbs: number | null;
}

interface SavedRecipe {
  id: string;
  title: string;
  nutrition: { calories: number; protein: number; fat: number; carbs: number } | null;
}

const getWeekDays = (selectedDate: Date) => {
  const day = selectedDate.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(selectedDate);
  monday.setDate(selectedDate.getDate() + diff);
  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    days.push(d);
  }
  return days;
};

const Diary = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const { updateStreak } = useStreak();
  const [streakReward, setStreakReward] = useState<{ badge: string; message: string; bonusScans?: number; grantLite?: boolean; grantPro?: boolean } | null>(null);
  usePageTitle(t.diary.title);

  const DAY_LABELS = t.dayLabels;

  const MEAL_SECTIONS = [
    { type: 'breakfast', label: t.diary.breakfast, emoji: '🌅' },
    { type: 'lunch', label: t.diary.lunch, emoji: '☀️' },
    { type: 'dinner', label: t.diary.dinner, emoji: '🌙' },
    { type: 'snack', label: t.diary.snack, emoji: '🍎' },
  ];

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [entries, setEntries] = useState<MealEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [dailyTarget, setDailyTarget] = useState(2000);
  const [macroTargets, setMacroTargets] = useState({ protein: 120, fat: 60, carbs: 250 });

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMealType, setModalMealType] = useState('breakfast');
  const [addMode, setAddMode] = useState<'recipe' | 'manual'>('manual');
  const [recipes, setRecipes] = useState<SavedRecipe[]>([]);
  const [recipeSearch, setRecipeSearch] = useState('');
  const [manualName, setManualName] = useState('');
  const [manualCalories, setManualCalories] = useState('');
  const [manualProtein, setManualProtein] = useState('');
  const [manualFat, setManualFat] = useState('');
  const [manualCarbs, setManualCarbs] = useState('');

  // Scan modal state
  const [scanOpen, setScanOpen] = useState(false);
  const [scanMealType, setScanMealType] = useState('breakfast');
  const [fridgeOpen, setFridgeOpen] = useState(false);
  const [fridgeMealType, setFridgeMealType] = useState('breakfast');

  const dateStr = selectedDate.toISOString().split('T')[0];
  const weekDays = useMemo(() => getWeekDays(selectedDate), [dateStr]);
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoading(true);
      try {
        const [entriesRes, goalsRes] = await Promise.all([
          supabase.from('meal_entries').select('*').eq('user_id', user.id).eq('date', dateStr),
          supabase.from('user_goals').select('daily_calories_target, weight_kg, goals').eq('user_id', user.id).maybeSingle(),
        ]);
        if (entriesRes.data) setEntries(entriesRes.data as unknown as MealEntry[]);
        if (goalsRes.data?.daily_calories_target) setDailyTarget(goalsRes.data.daily_calories_target);
        if (goalsRes.data) {
          const w = Number(goalsRes.data.weight_kg) || 70;
          const cal = goalsRes.data.daily_calories_target || 2000;
          const g: string[] = (goalsRes.data as any).goals || [];
          setMacroTargets(calcMacroTargets(w, cal, g));
        }
      } catch {
        toast.error(t.common.error);
      }
      setLoading(false);
    };
    load();
  }, [user, dateStr]);

  const loadRecipes = async () => {
    if (!user) return;
    const { data } = await supabase.from('recipes').select('id, title, nutrition').eq('user_id', user.id);
    if (data) setRecipes(data as unknown as SavedRecipe[]);
  };

  const openAddModal = (mealType: string) => {
    setModalMealType(mealType);
    setAddMode('manual');
    setManualName(''); setManualCalories(''); setManualProtein(''); setManualFat(''); setManualCarbs('');
    setRecipeSearch('');
    setModalOpen(true);
    loadRecipes();
  };

  const openScanModal = (mealType: string) => {
    setScanMealType(mealType);
    setScanOpen(true);
  };

  const handleScanSaved = (entry: any) => {
    if (entry?._prefill) {
      // Open manual modal with pre-filled values
      setScanOpen(false);
      setModalMealType(scanMealType);
      setManualName(entry.custom_name || '');
      setManualCalories(String(entry.total_calories || 0));
      setManualProtein(String(entry.total_protein || 0));
      setManualFat(String(entry.total_fat || 0));
      setManualCarbs(String(entry.total_carbs || 0));
      setAddMode('manual');
      setModalOpen(true);
      return;
    }
    if (entry) {
      setEntries(prev => [...prev, entry as MealEntry]);
    }
  };

  const handleAddFromRecipe = async (recipe: SavedRecipe) => {
    if (!user) return;
    try {
      const { data, error } = await supabase.from('meal_entries').insert({
        user_id: user.id, date: dateStr, meal_type: modalMealType,
        recipe_id: recipe.id, custom_name: recipe.title,
        total_calories: recipe.nutrition?.calories || 0,
        total_protein: recipe.nutrition?.protein || 0,
        total_fat: recipe.nutrition?.fat || 0,
        total_carbs: recipe.nutrition?.carbs || 0,
      } as any).select().single();
      if (error) throw error;
      if (data) setEntries((prev) => [...prev, data as unknown as MealEntry]);
      toast.success(`${recipe.title} ${t.diary.logged}`);
      setModalOpen(false);
      // Update streak
      const reward = await updateStreak();
      if (reward) setStreakReward(reward);
    } catch { toast.error(t.common.error); }
  };

  const handleAddManual = async () => {
    if (!user || !manualName.trim()) return;
    try {
      const { data, error } = await supabase.from('meal_entries').insert({
        user_id: user.id, date: dateStr, meal_type: modalMealType,
        custom_name: manualName.trim(),
        total_calories: Number(manualCalories) || 0,
        total_protein: Number(manualProtein) || 0,
        total_fat: Number(manualFat) || 0,
        total_carbs: Number(manualCarbs) || 0,
      } as any).select().single();
      if (error) throw error;
      if (data) setEntries((prev) => [...prev, data as unknown as MealEntry]);
      toast.success(`${manualName} ${t.diary.logged}`);
      setModalOpen(false);
      const reward = await updateStreak();
      if (reward) setStreakReward(reward);
    } catch { toast.error(t.common.error); }
  };

  const handleDelete = async (id: string) => {
    await supabase.from('meal_entries').delete().eq('id', id);
    setEntries((prev) => prev.filter((e) => e.id !== id));
  };

  const totals = useMemo(() => {
    return entries.reduce(
      (acc, e) => ({
        calories: acc.calories + (e.total_calories || 0),
        protein: acc.protein + (e.total_protein || 0),
        fat: acc.fat + (e.total_fat || 0),
        carbs: acc.carbs + (e.total_carbs || 0),
      }),
      { calories: 0, protein: 0, fat: 0, carbs: 0 }
    );
  }, [entries]);

  const caloriePct = dailyTarget > 0 ? totals.calories / dailyTarget : 0;
  const totalsColor =
    Math.abs(caloriePct - 1) <= 0.1 ? '#059669' :
    Math.abs(caloriePct - 1) <= 0.2 ? '#EA580C' : '#DC2626';

  const filteredRecipes = recipes.filter((r) =>
    r.title.toLowerCase().includes(recipeSearch.toLowerCase())
  );

  const getMealLabel = (type: string) => MEAL_SECTIONS.find((s) => s.type === type)?.label || type;

  return (
    <div className="min-h-screen p-6 pb-mobile-safe">
      <h1 className="text-2xl font-bold mb-4 text-foreground">{t.diary.title}</h1>

      {/* Week strip */}
      <div className="flex gap-1.5 mb-6 overflow-x-auto pb-1">
        {weekDays.map((d, i) => {
          const ds = d.toISOString().split('T')[0];
          const isSelected = ds === dateStr;
          const isToday = ds === today;
          return (
            <button
              key={ds}
              onClick={() => setSelectedDate(d)}
              className="flex flex-col items-center min-w-[44px] py-2 px-1.5 rounded-xl transition-all"
              style={{
                backgroundColor: isSelected ? '#7C3AED' : isToday ? '#EDE9FE' : 'white',
                border: `1.5px solid ${isSelected ? '#7C3AED' : '#DDD6FE'}`,
              }}
            >
              <span className={`text-[10px] font-semibold mb-0.5 ${isSelected ? 'text-white' : 'text-muted-foreground'}`}>
                {DAY_LABELS[i]}
              </span>
              <span className={`text-sm font-bold ${isSelected ? 'text-white' : 'text-foreground'}`}>
                {d.getDate()}
              </span>
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-7 h-7 border-[3px] rounded-full animate-spin" style={{ borderColor: '#EDE9FE', borderTopColor: '#7C3AED' }} />
        </div>
      ) : (
        <div className="space-y-4">
          {MEAL_SECTIONS.map((section) => {
            const sectionEntries = entries.filter((e) => e.meal_type === section.type);
            return (
              <motion.div
                key={section.type}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card rounded-2xl p-4 shadow-[0_2px_12px_rgba(124,58,237,0.06)]"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-bold flex items-center gap-1.5 text-foreground">
                    {section.emoji} {section.label}
                  </h3>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => { setFridgeMealType(section.type); setFridgeOpen(true); }}
                      className="flex items-center justify-center w-8 h-8 rounded-lg"
                      style={{ color: '#059669', backgroundColor: '#F0FDF4' }}
                      aria-label="From fridge"
                    >
                      <span className="text-sm">🧊</span>
                    </button>
                    <button
                      onClick={() => openScanModal(section.type)}
                      className="flex items-center justify-center w-8 h-8 rounded-lg"
                      style={{ color: '#7C3AED', backgroundColor: '#F5F3FF' }}
                      aria-label="Scan meal"
                    >
                      <Camera className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => openAddModal(section.type)}
                      className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg"
                      style={{ color: '#7C3AED', backgroundColor: '#EDE9FE' }}
                    >
                      <Plus className="w-3.5 h-3.5" /> {t.diary.addMeal}
                    </button>
                  </div>
                </div>

                {sectionEntries.length === 0 ? (
                  <p className="text-xs py-2 text-muted-foreground">{t.diary.noMeals}</p>
                ) : (
                  <div className="space-y-1.5">
                    {sectionEntries.map((entry) => (
                      <div key={entry.id} className="flex items-center justify-between py-1.5 px-2 rounded-lg" style={{ backgroundColor: '#FAFAFE' }}>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate" style={{ color: '#1E1B4B' }}>{entry.custom_name || t.diary.meal}</p>
                          <p className="text-[10px]" style={{ color: '#9CA3AF' }}>
                            {entry.total_calories || 0} {(t as any).diary?.kcalUnit || 'kcal'}
                            {(entry.total_protein ?? 0) > 0 && ` · P:${entry.total_protein}g`}
                            {(entry.total_fat ?? 0) > 0 && ` · F:${entry.total_fat}g`}
                            {(entry.total_carbs ?? 0) > 0 && ` · C:${entry.total_carbs}g`}
                          </p>
                        </div>
                        <button onClick={() => handleDelete(entry.id)} className="p-1 rounded-lg hover:bg-red-50 shrink-0">
                          <X className="w-3.5 h-3.5" style={{ color: '#DC2626' }} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Daily totals bar */}
      <div
        className="fixed bottom-[calc(64px+env(safe-area-inset-bottom,0px))] md:bottom-0 left-0 right-0 md:left-60 px-6 py-3 z-40"
        style={{ backgroundColor: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(10px)', borderTop: '1px solid #EDE9FE' }}
      >
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <span className="text-sm font-bold" style={{ color: totalsColor }}>
            {t.diary.todayTotal} {totals.calories} {(t as any).diary?.kcalUnit || 'kcal'}
          </span>
          <div className="flex gap-3 text-xs font-medium">
            {[
              { label: 'P', value: Math.round(totals.protein), target: macroTargets.protein },
              { label: 'F', value: Math.round(totals.fat), target: macroTargets.fat },
              { label: 'C', value: Math.round(totals.carbs), target: macroTargets.carbs },
            ].map(m => {
              const ratio = m.target > 0 ? m.value / m.target : 0;
              const color = ratio > 1.15 ? '#DC2626' : ratio >= 0.7 ? '#059669' : '#EA580C';
              return (
                <span key={m.label} style={{ color }}>
                  {m.label}: {m.value}/{m.target}g
                </span>
              );
            })}
          </div>
        </div>
        <div className="mt-1.5 h-1.5 rounded-full max-w-lg mx-auto" style={{ backgroundColor: '#F3F4F6' }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ backgroundColor: totalsColor, width: `${Math.min(caloriePct * 100, 100)}%` }}
          />
        </div>
      </div>

      {/* Meal scan modal */}
      <MealScanModal
        open={scanOpen}
        onClose={() => setScanOpen(false)}
        mealType={scanMealType}
        dateStr={dateStr}
        onSaved={handleScanSaved}
      />

      {/* Fridge picker modal */}
      <FridgePickerModal
        open={fridgeOpen}
        onClose={() => setFridgeOpen(false)}
        mealType={fridgeMealType}
        dateStr={dateStr}
        onSaved={(entry) => { if (entry) setEntries(prev => [...prev, entry]); }}
      />

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="rounded-2xl max-w-sm">
          <DialogHeader>
            <DialogTitle style={{ color: '#1E1B4B' }}>
              {t.diary.addMealTitle.replace('{meal}', getMealLabel(modalMealType))}
            </DialogTitle>
            <DialogDescription>{t.diary.logWhatYouAte}</DialogDescription>
          </DialogHeader>

          <div className="flex gap-1 p-1 rounded-xl mb-3" style={{ backgroundColor: '#F5F3FF' }}>
            <button
              onClick={() => setAddMode('recipe')}
              className="flex-1 py-2 rounded-lg text-xs font-semibold transition-all"
              style={{
                backgroundColor: addMode === 'recipe' ? '#7C3AED' : 'transparent',
                color: addMode === 'recipe' ? 'white' : '#6B7280',
              }}
            >
              {t.diary.fromRecipes}
            </button>
            <button
              onClick={() => setAddMode('manual')}
              className="flex-1 py-2 rounded-lg text-xs font-semibold transition-all"
              style={{
                backgroundColor: addMode === 'manual' ? '#7C3AED' : 'transparent',
                color: addMode === 'manual' ? 'white' : '#6B7280',
              }}
            >
              {t.diary.manualEntry}
            </button>
          </div>

          {addMode === 'recipe' ? (
            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#9CA3AF' }} />
                <input
                  value={recipeSearch}
                  onChange={(e) => setRecipeSearch(e.target.value)}
                  placeholder={t.diary.searchRecipes}
                  className="w-full h-10 pl-9 pr-3 rounded-xl border text-sm outline-none focus:border-[#7C3AED]"
                  style={{ borderColor: '#DDD6FE', backgroundColor: '#F5F3FF' }}
                />
              </div>
              <div className="max-h-48 overflow-y-auto space-y-1">
                {filteredRecipes.length === 0 ? (
                  <p className="text-xs text-center py-4" style={{ color: '#9CA3AF' }}>
                    {recipes.length === 0 ? t.diary.noSavedRecipes : t.diary.noMatchingRecipes}
                  </p>
                ) : (
                  filteredRecipes.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => handleAddFromRecipe(r)}
                      className="w-full text-left p-3 rounded-xl hover:bg-[#F5F3FF] transition-colors"
                    >
                      <p className="text-sm font-medium" style={{ color: '#1E1B4B' }}>{r.title}</p>
                      <p className="text-[10px]" style={{ color: '#9CA3AF' }}>
                        {r.nutrition?.calories || 0} kcal · P:{r.nutrition?.protein || 0}g · F:{r.nutrition?.fat || 0}g · C:{r.nutrition?.carbs || 0}g
                      </p>
                    </button>
                  ))
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: '#6B7280' }}>{t.diary.name}</label>
                <input
                  value={manualName}
                  onChange={(e) => setManualName(e.target.value)}
                  placeholder={t.diary.mealPlaceholder}
                  className="w-full h-10 px-3 rounded-xl border text-sm outline-none focus:border-[#7C3AED]"
                  style={{ borderColor: '#DDD6FE', backgroundColor: '#F5F3FF' }}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: '#6B7280' }}>{t.diary.calories}</label>
                  <input type="number" value={manualCalories} onChange={(e) => setManualCalories(e.target.value)} placeholder="0"
                    className="w-full h-10 px-3 rounded-xl border text-sm outline-none focus:border-[#7C3AED]"
                    style={{ borderColor: '#DDD6FE', backgroundColor: '#F5F3FF' }} />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: '#6B7280' }}>{t.diary.protein}</label>
                  <input type="number" value={manualProtein} onChange={(e) => setManualProtein(e.target.value)} placeholder="0"
                    className="w-full h-10 px-3 rounded-xl border text-sm outline-none focus:border-[#7C3AED]"
                    style={{ borderColor: '#DDD6FE', backgroundColor: '#F5F3FF' }} />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: '#6B7280' }}>{t.diary.fat}</label>
                  <input type="number" value={manualFat} onChange={(e) => setManualFat(e.target.value)} placeholder="0"
                    className="w-full h-10 px-3 rounded-xl border text-sm outline-none focus:border-[#7C3AED]"
                    style={{ borderColor: '#DDD6FE', backgroundColor: '#F5F3FF' }} />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: '#6B7280' }}>{t.diary.carbs}</label>
                  <input type="number" value={manualCarbs} onChange={(e) => setManualCarbs(e.target.value)} placeholder="0"
                    className="w-full h-10 px-3 rounded-xl border text-sm outline-none focus:border-[#7C3AED]"
                    style={{ borderColor: '#DDD6FE', backgroundColor: '#F5F3FF' }} />
                </div>
              </div>
              <button
                onClick={handleAddManual}
                disabled={!manualName.trim()}
                className="w-full h-11 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
                style={{ backgroundColor: '#7C3AED' }}
              >
                {t.diary.logMeal}
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>
      <RewardModal
        open={!!streakReward}
        onClose={() => setStreakReward(null)}
        badge={streakReward?.badge || ''}
        streakDays={Number(streakReward?.message || 0)}
        bonusScans={streakReward?.bonusScans}
        grantLite={streakReward?.grantLite}
        grantPro={streakReward?.grantPro}
      />
    </div>
  );
};

export default Diary;
