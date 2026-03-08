import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useTranslation } from '@/hooks/useTranslation';


/* ───────── types ───────── */
type Goal = 'lose' | 'gain' | 'balanced' | 'family' | 'time' | 'budget';
type Diet = 'omnivore' | 'vegetarian' | 'vegan' | 'keto' | 'gluten-free';
type Activity = 'sedentary' | 'light' | 'moderate' | 'active';

const ALLERGIES = ['Nuts', 'Dairy', 'Eggs', 'Gluten', 'Fish', 'Soy'];

const DISLIKE_CHIPS = [
  { id: 'fish', emoji: '🐟' },
  { id: 'broccoli', emoji: '🥦' },
  { id: 'onion', emoji: '🧅' },
  { id: 'mushrooms', emoji: '🍄' },
  { id: 'bell_pepper', emoji: '🫑' },
  { id: 'eggplant', emoji: '🍆' },
  { id: 'spinach', emoji: '🥬' },
  { id: 'legumes', emoji: '🫘' },
  { id: 'offal', emoji: '🥩' },
  { id: 'spicy', emoji: '🌶' },
  { id: 'dairy', emoji: '🥛' },
  { id: 'garlic', emoji: '🧄' },
];

const TOTAL_STEPS = 5;

const Onboarding = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t, language } = useTranslation();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  // Step 1
  const [name, setName] = useState('');

  // Step 2
  const [goals, setGoals] = useState<Goal[]>([]);

  // Step 3
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<'male' | 'female'>('female');
  const [activity, setActivity] = useState<Activity>('moderate');
  const [calories, setCalories] = useState<number | null>(null);

  // Step 4
  const [householdSize, setHouseholdSize] = useState(2);
  const [dietType, setDietType] = useState<Diet>('omnivore');
  const [allergies, setAllergies] = useState<string[]>([]);
  const [dislikedFoods, setDislikedFoods] = useState<string[]>([]);
  const [dislikedFreeText, setDislikedFreeText] = useState('');
  const [hasFamilyDislikes, setHasFamilyDislikes] = useState(false);
  const [familyDislikes, setFamilyDislikes] = useState<string[]>([]);
  const [familyDislikesFreeText, setFamilyDislikesFreeText] = useState('');

  const dl = (t as any).dislikes || {};

  const GOALS: { id: Goal; emoji: string; labelKey: keyof typeof t.onboarding }[] = [
    { id: 'lose', emoji: '🏃', labelKey: 'goalLose' },
    { id: 'gain', emoji: '💪', labelKey: 'goalGain' },
    { id: 'balanced', emoji: '🥗', labelKey: 'goalBalanced' },
    { id: 'family', emoji: '👨‍👩‍👧', labelKey: 'goalFamily' },
    { id: 'time', emoji: '⚡️', labelKey: 'goalTime' },
    { id: 'budget', emoji: '💰', labelKey: 'goalBudget' },
  ];

  const DIETS: { id: Diet; labelKey: keyof typeof t.onboarding }[] = [
    { id: 'omnivore', labelKey: 'omnivore' },
    { id: 'vegetarian', labelKey: 'vegetarian' },
    { id: 'vegan', labelKey: 'vegan' },
    { id: 'keto', labelKey: 'keto' },
    { id: 'gluten-free', labelKey: 'glutenFree' },
  ];

  const ACTIVITIES: { id: Activity; labelKey: keyof typeof t.onboarding; factor: number }[] = [
    { id: 'sedentary', labelKey: 'sedentary', factor: 1.2 },
    { id: 'light', labelKey: 'lightlyActive', factor: 1.375 },
    { id: 'moderate', labelKey: 'moderatelyActive', factor: 1.55 },
    { id: 'active', labelKey: 'veryActive', factor: 1.725 },
  ];

  const getDislikeLabel = (id: string) => {
    return dl[id] || id;
  };

  // Pre-fill name from OAuth
  useEffect(() => {
    if (user) {
      setName(user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || '');
    }
  }, [user]);

  // Calculate calories (Mifflin-St Jeor)
  useEffect(() => {
    const needsCalc = goals.some((g) => ['lose', 'gain', 'balanced'].includes(g));
    if (!needsCalc || !weight || !height || !age) { setCalories(null); return; }
    const w = parseFloat(weight), h = parseInt(height), a = parseInt(age);
    if (isNaN(w) || isNaN(h) || isNaN(a)) { setCalories(null); return; }
    const bmr = 10 * w + 6.25 * h - 5 * a + (gender === 'male' ? 5 : -161);
    const actFactor = ACTIVITIES.find((x) => x.id === activity)?.factor || 1.55;
    const tdee = bmr * actFactor;
    let target = tdee;
    if (goals.includes('lose')) target = tdee - 400;
    else if (goals.includes('gain')) target = tdee + 300;
    setCalories(Math.round(target));
  }, [goals, weight, height, age, gender, activity]);

  // Should we show step 3 (body)?
  const needsBody = goals.some((g) => ['lose', 'gain', 'balanced'].includes(g));

  // Get the actual step index considering skip
  const getActualStep = (s: number): number => {
    if (s === 2 && !needsBody) return 3; // skip step 3
    return s;
  };

  const toggleGoal = (g: Goal) => setGoals((prev) => prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]);
  const toggleAllergy = (a: string) => setAllergies((prev) => prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]);
  const toggleDislike = (id: string) => setDislikedFoods((prev) => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const toggleFamilyDislike = (id: string) => setFamilyDislikes((prev) => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const buildDislikeArray = (chips: string[], freeText: string): string[] => {
    const items = [...chips.map(id => getDislikeLabel(id))];
    if (freeText.trim()) {
      items.push(...freeText.split(',').map(s => s.trim()).filter(Boolean));
    }
    return items;
  };

  const handleNext = useCallback(async () => {
    setSaving(true);
    try {
      if (step === 4) {
        // Final step: save everything
        if (!user) return;
        await supabase.from('profiles').update({
          display_name: name,
          onboarding_completed: true,
          subscription_plan: 'pro',
          subscription_status: 'trial',
          trial_end: new Date(Date.now() + 7 * 86400000).toISOString(),
        } as any).eq('user_id', user.id);

        // Assign user number for founding member system
        try {
          await supabase.rpc('assign_user_number', { p_user_id: user.id });
        } catch (e) {
          console.error('Failed to assign user number:', e);
        }

        const finalDislikes = buildDislikeArray(dislikedFoods, dislikedFreeText);
        const finalFamilyDislikes = hasFamilyDislikes ? buildDislikeArray(familyDislikes, familyDislikesFreeText) : [];

        await supabase.from('user_goals').upsert({
          user_id: user.id,
          goals,
          diet_type: dietType,
          household_size: householdSize,
          allergies,
          disliked_foods: finalDislikes,
          family_dislikes: finalFamilyDislikes,
          daily_calories_target: calories || 2000,
          weight_kg: weight ? parseFloat(weight) : null,
          height_cm: height ? parseInt(height) : null,
          age: age ? parseInt(age) : null,
          activity_level: activity,
        } as any, { onConflict: 'user_id' });

        // Fire-and-forget welcome email
        supabase.functions.invoke('send-welcome-email', {
          body: { email: user.email, name: name || user.email?.split('@')[0], language },
        }).catch(() => {});

        navigate('/dashboard');
        return;
      }
      const nextStep = getActualStep(step + 1);
      setStep(nextStep);
    } catch (e) {
      console.error(e);
      toast.error(t.onboarding.errorSaving);
    } finally {
      setSaving(false);
    }
  }, [step, user, name, goals, dietType, householdSize, allergies, calories, weight, height, age, activity, navigate, t, needsBody, dislikedFoods, dislikedFreeText, hasFamilyDislikes, familyDislikes, familyDislikesFreeText]);

  const handleBack = () => {
    if (step === 3 && !needsBody) setStep(1);
    else setStep((s) => Math.max(0, s - 1));
  };

  // Goal labels for summary
  const getGoalLabels = () => goals.map((g) => {
    const found = GOALS.find((x) => x.id === g);
    return found ? `${found.emoji} ${t.onboarding[found.labelKey]}` : g;
  }).join(', ');

  const getDietLabel = () => {
    const found = DIETS.find((d) => d.id === dietType);
    return found ? t.onboarding[found.labelKey] : dietType;
  };

  /* ─── Shared chip/card styles ─── */
  const chipStyle = (selected: boolean) => ({
    background: selected ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.1)',
    border: selected ? '2px solid white' : '2px solid rgba(255,255,255,0.2)',
    borderRadius: 16,
  });

  return (
    <div
      className="min-h-screen flex flex-col relative overflow-hidden"
      style={{ background: 'linear-gradient(160deg, #C084FC 0%, #A855F7 40%, #7C3AED 70%, #EC4899 100%)' }}
    >
      {/* Progress dots */}
      <div className="flex justify-center gap-2 pt-8">
        {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
          <div
            key={i}
            className="rounded-full transition-all duration-300"
            style={{
              width: i === step ? 24 : 8,
              height: 8,
              backgroundColor: 'white',
              opacity: i === step ? 1 : i < step ? 0.6 : 0.3,
            }}
          />
        ))}
      </div>

      {/* Content area */}
      <div className="flex-1 flex items-center justify-center px-6 pb-40 overflow-y-auto">
        <div className="w-full max-w-[400px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.25 }}
            >
              {/* ─── STEP 1: Hello ─── */}
              {step === 0 && (
                <div className="text-center">
                  <span style={{ fontSize: 64 }}>👋</span>
                  <h2 className="text-white font-bold mt-4" style={{ fontSize: 28 }}>
                    {t.onboarding.step1Title}
                  </h2>
                  <p className="text-white mt-2 mb-8" style={{ opacity: 0.85, fontSize: 16, lineHeight: 1.5 }}>
                    {t.onboarding.step1Sub}
                  </p>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t.onboarding.namePlaceholder}
                    className="w-full h-14 rounded-2xl px-5 text-white placeholder:text-white/50 border-0 outline-none"
                    style={{ background: 'rgba(255,255,255,0.15)', fontSize: 16 }}
                  />
                </div>
              )}

              {/* ─── STEP 2: Goals ─── */}
              {step === 1 && (
                <div className="text-center">
                  <h2 className="text-white font-bold" style={{ fontSize: 26 }}>
                    {t.onboarding.step2Title}
                  </h2>
                  <p className="text-white mt-2 mb-6" style={{ opacity: 0.8, fontSize: 15 }}>
                    {t.onboarding.step2Sub}
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {GOALS.map((g) => (
                      <button
                        key={g.id}
                        onClick={() => toggleGoal(g.id)}
                        className="flex items-center gap-3 px-4 py-4 text-left text-white transition-all"
                        style={chipStyle(goals.includes(g.id))}
                      >
                        <span style={{ fontSize: 24 }}>{g.emoji}</span>
                        <span className="text-sm font-medium">{t.onboarding[g.labelKey]}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* ─── STEP 3: Body ─── */}
              {step === 2 && (
                <div>
                  <h2 className="text-white font-bold text-center" style={{ fontSize: 26 }}>
                    {t.onboarding.step3Title}
                  </h2>
                  <div className="mt-6 space-y-4">
                    {/* Gender */}
                    <div className="flex gap-3">
                      {(['female', 'male'] as const).map((g) => (
                        <button
                          key={g}
                          onClick={() => setGender(g)}
                          className="flex-1 py-3 text-white text-sm font-medium transition-all"
                          style={chipStyle(gender === g)}
                        >
                          {g === 'female' ? t.onboarding.female : t.onboarding.male}
                        </button>
                      ))}
                    </div>

                    {/* Metrics */}
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { label: t.onboarding.age, value: age, set: setAge, ph: '28' },
                        { label: t.onboarding.weightKg, value: weight, set: setWeight, ph: '65' },
                        { label: t.onboarding.heightCm, value: height, set: setHeight, ph: '170' },
                      ].map((f) => (
                        <div key={f.label}>
                          <label className="text-white/70 text-xs mb-1 block">{f.label}</label>
                          <input
                            type="number"
                            value={f.value}
                            onChange={(e) => f.set(e.target.value)}
                            placeholder={f.ph}
                            className="w-full h-12 rounded-xl px-3 text-white placeholder:text-white/40 border-0 outline-none text-center"
                            style={{ background: 'rgba(255,255,255,0.15)', fontSize: 15 }}
                          />
                        </div>
                      ))}
                    </div>

                    {/* Activity */}
                    <div>
                      <label className="text-white/70 text-xs mb-2 block">{t.onboarding.activityLevel}</label>
                      <div className="grid grid-cols-2 gap-2">
                        {ACTIVITIES.map((a) => (
                          <button
                            key={a.id}
                            onClick={() => setActivity(a.id)}
                            className="py-2.5 text-white text-xs font-medium transition-all"
                            style={chipStyle(activity === a.id)}
                          >
                            {t.onboarding[a.labelKey]}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Calorie result */}
                    {calories && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="rounded-2xl p-5 text-center"
                        style={{ background: 'rgba(255,255,255,0.2)' }}
                      >
                        <p className="text-white/80 text-sm">{t.onboarding.dailyTarget}</p>
                        <p className="text-white text-3xl font-bold mt-1">
                          {calories} <span className="text-lg font-normal">{t.onboarding.kcalDay}</span>
                        </p>
                      </motion.div>
                    )}
                  </div>

                  {/* Skip button */}
                  <button
                    onClick={() => setStep(3)}
                    className="w-full text-center text-white/60 mt-4 text-sm underline"
                  >
                    {t.onboarding.step3Skip}
                  </button>
                </div>
              )}

              {/* ─── STEP 4: Diet & Family & Dislikes ─── */}
              {step === 3 && (
                <div>
                  <h2 className="text-white font-bold text-center" style={{ fontSize: 26 }}>
                    {t.onboarding.step4Title}
                  </h2>
                  <p className="text-white/80 text-center mt-1 mb-6" style={{ fontSize: 15 }}>
                    {t.onboarding.step4Sub}
                  </p>

                  {/* Diet */}
                  <label className="text-white/70 text-xs mb-2 block">{t.onboarding.dietType}</label>
                  <div className="flex flex-wrap gap-2 mb-5">
                    {DIETS.map((d) => (
                      <button
                        key={d.id}
                        onClick={() => setDietType(d.id)}
                        className="px-4 py-2.5 text-white text-sm font-medium transition-all"
                        style={chipStyle(dietType === d.id)}
                      >
                        {t.onboarding[d.labelKey]}
                      </button>
                    ))}
                  </div>

                  {/* Household */}
                  <label className="text-white/70 text-xs mb-2 block">{t.onboarding.cookingFor}</label>
                  <div className="flex gap-2 mb-5">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        onClick={() => setHouseholdSize(n)}
                        className="w-12 h-12 text-white text-sm font-semibold transition-all"
                        style={chipStyle(householdSize === n)}
                      >
                        {n}{n === 5 ? '+' : ''}
                      </button>
                    ))}
                  </div>

                  {/* Allergies */}
                  <label className="text-white/70 text-xs mb-2 block">
                    {t.onboarding.allergies} {t.onboarding.allergyOptional}
                  </label>
                  <div className="flex flex-wrap gap-2 mb-5">
                    {ALLERGIES.map((a) => (
                      <button
                        key={a}
                        onClick={() => toggleAllergy(a)}
                        className="px-3 py-2 text-white text-xs font-medium transition-all rounded-full"
                        style={{
                          background: allergies.includes(a) ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.1)',
                          border: allergies.includes(a) ? '1.5px solid white' : '1.5px solid rgba(255,255,255,0.2)',
                        }}
                      >
                        {allergies.includes(a) && '✕ '}{a}
                      </button>
                    ))}
                  </div>

                  {/* Disliked Foods */}
                  <label className="text-white/70 text-xs mb-1 block">
                    {dl.title || "What foods do you dislike?"}
                  </label>
                  <p className="text-white/50 text-[11px] mb-2">{dl.subtitle || "TYANA will never suggest these"}</p>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {DISLIKE_CHIPS.map((chip) => (
                      <button
                        key={chip.id}
                        onClick={() => toggleDislike(chip.id)}
                        className="px-3 py-2 text-white text-xs font-medium transition-all rounded-full"
                        style={{
                          background: dislikedFoods.includes(chip.id) ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.1)',
                          border: dislikedFoods.includes(chip.id) ? '1.5px solid white' : '1.5px solid rgba(255,255,255,0.2)',
                        }}
                      >
                        {dislikedFoods.includes(chip.id) && '✕ '}{chip.emoji} {getDislikeLabel(chip.id)}
                      </button>
                    ))}
                  </div>
                  <input
                    value={dislikedFreeText}
                    onChange={(e) => setDislikedFreeText(e.target.value)}
                    placeholder={dl.placeholder || "Add anything else... (e.g. cilantro, avocado)"}
                    className="w-full h-10 rounded-xl px-4 text-white placeholder:text-white/40 border-0 outline-none text-sm mb-5"
                    style={{ background: 'rgba(255,255,255,0.12)' }}
                  />

                  {/* Family dislikes */}
                  {householdSize > 1 && (
                    <>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-white/70 text-xs">{dl.familyQuestion || "Does anyone in your family avoid certain foods?"}</span>
                        <div className="flex rounded-lg overflow-hidden" style={{ border: '1.5px solid rgba(255,255,255,0.3)' }}>
                          {[{ label: dl.yes || 'Yes', val: true }, { label: dl.no || 'No', val: false }].map(opt => (
                            <button
                              key={String(opt.val)}
                              onClick={() => setHasFamilyDislikes(opt.val)}
                              className="px-3 py-1.5 text-xs font-medium text-white transition-all"
                              style={{ background: hasFamilyDislikes === opt.val ? 'rgba(255,255,255,0.25)' : 'transparent' }}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>
                      {hasFamilyDislikes && (
                        <>
                          <div className="flex flex-wrap gap-2 mb-3">
                            {DISLIKE_CHIPS.map((chip) => (
                              <button
                                key={chip.id}
                                onClick={() => toggleFamilyDislike(chip.id)}
                                className="px-3 py-1.5 text-white text-[11px] font-medium transition-all rounded-full"
                                style={{
                                  background: familyDislikes.includes(chip.id) ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.1)',
                                  border: familyDislikes.includes(chip.id) ? '1.5px solid white' : '1.5px solid rgba(255,255,255,0.2)',
                                }}
                              >
                                {familyDislikes.includes(chip.id) && '✕ '}{chip.emoji} {getDislikeLabel(chip.id)}
                              </button>
                            ))}
                          </div>
                          <input
                            value={familyDislikesFreeText}
                            onChange={(e) => setFamilyDislikesFreeText(e.target.value)}
                            placeholder={dl.placeholder || "Add anything else..."}
                            className="w-full h-10 rounded-xl px-4 text-white placeholder:text-white/40 border-0 outline-none text-sm"
                            style={{ background: 'rgba(255,255,255,0.12)' }}
                          />
                        </>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* ─── STEP 5: All set ─── */}
              {step === 4 && (
                <div className="text-center">
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200 }}>
                    <span style={{ fontSize: 64 }}>🎉</span>
                  </motion.div>
                  <h2 className="text-white font-bold mt-4" style={{ fontSize: 28 }}>
                    {t.onboarding.step5Title}
                  </h2>
                  <p className="text-white/80 mt-2 mb-6" style={{ fontSize: 16 }}>
                    {t.onboarding.step5Sub}
                  </p>

                  {/* Summary card */}
                  <div
                    className="rounded-2xl p-5 text-left space-y-3 mx-auto"
                    style={{ background: 'rgba(255,255,255,0.15)', maxWidth: 320 }}
                  >
                    {name && (
                      <div className="flex items-center gap-2 text-white text-sm">
                        <span>👤</span> <span className="font-medium">{name}</span>
                      </div>
                    )}
                    {goals.length > 0 && (
                      <div className="flex items-start gap-2 text-white text-sm">
                        <span>🎯</span>
                        <div>
                          <span className="text-white/60 text-xs">{t.onboarding.summaryGoal}:</span>
                          <p className="font-medium">{getGoalLabels()}</p>
                        </div>
                      </div>
                    )}
                    {calories && (
                      <div className="flex items-center gap-2 text-white text-sm">
                        <span>🔥</span>
                        <span className="text-white/60 text-xs">{t.onboarding.summaryCalories}:</span>
                        <span className="font-medium">{calories} {t.onboarding.kcalDay}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-white text-sm">
                      <span>🍽</span>
                      <span className="text-white/60 text-xs">{t.onboarding.summaryDiet}:</span>
                      <span className="font-medium">{getDietLabel()}</span>
                    </div>
                    <div className="flex items-center gap-2 text-white text-sm">
                      <span>👨‍👩‍👧</span>
                      <span className="text-white/60 text-xs">{t.onboarding.summaryCookingFor}:</span>
                      <span className="font-medium">{householdSize}{householdSize === 5 ? '+' : ''} {t.onboarding.summaryPeople}</span>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Bottom buttons */}
      <div className="fixed bottom-0 left-0 right-0 px-6 py-6">
        <div className="max-w-[400px] mx-auto flex flex-col gap-3">
          {/* Main action */}
          <button
            onClick={handleNext}
            disabled={saving || (step === 0 && !name.trim()) || (step === 1 && goals.length === 0)}
            className="w-full bg-white transition-opacity hover:opacity-90 disabled:opacity-40"
            style={{ height: 56, borderRadius: 16, fontWeight: 600, color: '#7C3AED', fontSize: 16 }}
          >
            {saving
              ? t.onboarding.saving
              : step === 0
                ? t.onboarding.letsGo
                : step === 4
                  ? t.onboarding.startCooking
                  : t.onboarding.next}
          </button>

          {/* Back button */}
          {step > 0 && step < 4 && (
            <button
              onClick={handleBack}
              className="text-white/60 text-sm"
            >
              ← {t.onboarding.back}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
