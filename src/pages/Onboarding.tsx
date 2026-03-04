import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ArrowLeft, Check } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useTranslation } from '@/hooks/useTranslation';

/* ───────── types ───────── */
type Goal = 'lose' | 'gain' | 'balanced' | 'family' | 'sport' | 'budget';
type Diet = 'omnivore' | 'vegetarian' | 'vegan' | 'keto' | 'gluten-free';
type Activity = 'sedentary' | 'light' | 'moderate' | 'active';

const ALLERGIES_EN = ['Nuts', 'Dairy', 'Eggs', 'Gluten', 'Fish', 'Soy'];
const STORES = ['Rimi', 'Maxima', 'Lidl', 'Aldi', 'Tesco', 'REWE', 'Kaufland'];

const Onboarding = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  // Step 1
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [currency, setCurrency] = useState('EUR');

  // Step 2
  const [goals, setGoals] = useState<Goal[]>([]);
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<'male' | 'female'>('female');
  const [activity, setActivity] = useState<Activity>('moderate');
  const [calories, setCalories] = useState<number | null>(null);

  // Step 3
  const [householdSize, setHouseholdSize] = useState(1);
  const [dietType, setDietType] = useState<Diet>('omnivore');
  const [allergies, setAllergies] = useState<string[]>([]);
  const [customAllergy, setCustomAllergy] = useState('');

  // Step 4
  const [stores, setStores] = useState<string[]>([]);
  const [customStore, setCustomStore] = useState('');

  const GOALS: { id: Goal; emoji: string; labelKey: keyof typeof t.onboarding }[] = [
    { id: 'lose', emoji: '🏃', labelKey: 'goalLose' },
    { id: 'gain', emoji: '💪', labelKey: 'goalGain' },
    { id: 'balanced', emoji: '🥗', labelKey: 'goalBalanced' },
    { id: 'family', emoji: '👨‍👩‍👧', labelKey: 'goalFamily' },
    { id: 'sport', emoji: '⚡', labelKey: 'goalSport' },
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

  // Pre-fill name
  useEffect(() => {
    if (user) {
      setName(user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || '');
    }
  }, [user]);

  // Calculate calories
  useEffect(() => {
    const needsCalc = goals.some((g) => ['lose', 'gain', 'sport'].includes(g));
    if (!needsCalc || !weight || !height || !age) { setCalories(null); return; }
    const w = parseFloat(weight), h = parseInt(height), a = parseInt(age);
    if (isNaN(w) || isNaN(h) || isNaN(a)) { setCalories(null); return; }
    const bmr = 10 * w + 6.25 * h - 5 * a + (gender === 'male' ? 5 : -161);
    const actFactor = ACTIVITIES.find((x) => x.id === activity)?.factor || 1.55;
    const tdee = bmr * actFactor;
    let target = tdee;
    if (goals.includes('lose')) target = tdee - 400;
    else if (goals.includes('gain')) target = tdee + 400;
    else if (goals.includes('sport')) target = tdee * 1.15;
    setCalories(Math.round(target));
  }, [goals, weight, height, age, gender, activity]);

  const toggleGoal = (g: Goal) => setGoals((prev) => prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]);
  const toggleAllergy = (a: string) => setAllergies((prev) => prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]);
  const toggleStore = (s: string) => setStores((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]);

  const addCustomAllergy = () => {
    const v = customAllergy.trim();
    if (v && !allergies.includes(v)) { setAllergies((p) => [...p, v]); setCustomAllergy(''); }
  };
  const addCustomStore = () => {
    const v = customStore.trim();
    if (v && !stores.includes(v)) { setStores((p) => [...p, v]); setCustomStore(''); }
  };

  /* ─── save handlers ─── */
  const saveStep1 = async () => {
    if (!user) return;
    await supabase.from('profiles').update({ display_name: name, city, currency } as any).eq('user_id', user.id);
  };

  const saveStep2 = async () => {
    if (!user) return;
    const payload: any = {
      user_id: user.id,
      goals: goals,
      activity_level: activity,
      daily_calories_target: calories || 2000,
    };
    if (weight) payload.weight_kg = parseFloat(weight);
    if (height) payload.height_cm = parseInt(height);
    if (age) payload.age = parseInt(age);
    await supabase.from('user_goals').upsert(payload, { onConflict: 'user_id' });
    await supabase.from('profiles').update({ gender } as any).eq('user_id', user.id);
  };

  const saveStep3 = async () => {
    if (!user) return;
    await supabase.from('user_goals').upsert({
      user_id: user.id,
      household_size: householdSize,
      diet_type: dietType,
      allergies,
    } as any, { onConflict: 'user_id' });
  };

  const saveStep4 = async () => {
    if (!user) return;
    await supabase.from('user_goals').upsert({ user_id: user.id, stores } as any, { onConflict: 'user_id' });
  };

  const completeOnboarding = async () => {
    if (!user) return;
    await supabase.from('profiles').update({ onboarding_completed: true } as any).eq('user_id', user.id);
  };

  const handleNext = async () => {
    setSaving(true);
    try {
      if (step === 0) await saveStep1();
      else if (step === 1) await saveStep2();
      else if (step === 2) await saveStep3();
      else if (step === 3) { if (stores.length === 0) { toast.error(t.onboarding.selectStore); setSaving(false); return; } await saveStep4(); }
      else if (step === 4) { await completeOnboarding(); navigate('/dashboard'); return; }
      setStep((s) => s + 1);
    } catch (e) { console.error(e); toast.error(t.onboarding.errorSaving); }
    finally { setSaving(false); }
  };

  const needsBodyFields = goals.some((g) => ['lose', 'gain', 'sport'].includes(g));

  const InputField = ({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) => (
    <div className="space-y-1.5">
      <label className="text-sm font-medium" style={{ color: '#1E1B4B' }}>{label}</label>
      <input
        {...props}
        className="w-full h-12 px-4 rounded-xl border text-sm outline-none transition-colors focus:border-[#7C3AED]"
        style={{ backgroundColor: '#F5F3FF', borderColor: '#DDD6FE' }}
      />
    </div>
  );

  /* ───────── render ───────── */
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#F5F3FF' }}>
      {/* Progress bar */}
      <div className="h-1 w-full" style={{ backgroundColor: '#EDE9FE' }}>
        <motion.div
          className="h-full"
          style={{ backgroundColor: '#7C3AED' }}
          animate={{ width: `${((step + 1) / 5) * 100}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Step indicator */}
      <div className="flex justify-center gap-2 pt-6 pb-2">
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="w-2 h-2 rounded-full transition-colors"
            style={{ backgroundColor: i <= step ? '#7C3AED' : '#DDD6FE' }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 flex items-start justify-center px-6 pt-6 pb-32 overflow-y-auto">
        <div className="w-full max-w-[560px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.25 }}
            >
              {step === 0 && (
                <div className="space-y-5">
                  <h2 className="text-2xl font-bold mb-2" style={{ color: '#1E1B4B' }}>{t.onboarding.step1Title}</h2>
                  <p className="text-sm mb-6" style={{ color: '#6B7280' }}>{t.onboarding.step1Sub}</p>
                  <InputField label={t.onboarding.yourName} value={name} onChange={(e) => setName(e.target.value)} placeholder={t.onboarding.namePlaceholder} />
                  <InputField label={t.onboarding.city} value={city} onChange={(e) => setCity(e.target.value)} placeholder={t.onboarding.cityPlaceholder} />
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium" style={{ color: '#1E1B4B' }}>{t.onboarding.currency}</label>
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="w-full h-12 px-4 rounded-xl border text-sm outline-none focus:border-[#7C3AED] appearance-none"
                      style={{ backgroundColor: '#F5F3FF', borderColor: '#DDD6FE' }}
                    >
                      {['EUR', 'USD', 'GBP', 'PLN', 'UAH'].map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
              )}

              {step === 1 && (
                <div className="space-y-5">
                  <h2 className="text-2xl font-bold mb-2" style={{ color: '#1E1B4B' }}>{t.onboarding.step2Title}</h2>
                  <p className="text-sm mb-6" style={{ color: '#6B7280' }}>{t.onboarding.step2Sub}</p>
                  <div className="grid grid-cols-2 gap-3">
                    {GOALS.map((g) => (
                      <button
                        key={g.id}
                        onClick={() => toggleGoal(g.id)}
                        className="flex items-center gap-3 px-4 py-3.5 rounded-xl border-[1.5px] text-left transition-all"
                        style={{
                          borderColor: goals.includes(g.id) ? '#7C3AED' : '#DDD6FE',
                          backgroundColor: goals.includes(g.id) ? '#EDE9FE' : 'white',
                        }}
                      >
                        <span className="text-xl">{g.emoji}</span>
                        <span className="text-sm font-medium" style={{ color: '#1E1B4B' }}>{t.onboarding[g.labelKey]}</span>
                        {goals.includes(g.id) && <Check className="w-4 h-4 ml-auto" style={{ color: '#7C3AED' }} />}
                      </button>
                    ))}
                  </div>

                  {needsBodyFields && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-4 pt-2">
                      <div className="flex gap-3">
                        {(['female', 'male'] as const).map((g) => (
                          <button
                            key={g}
                            onClick={() => setGender(g)}
                            className="flex-1 py-2.5 rounded-xl border-[1.5px] text-sm font-medium transition-all"
                            style={{
                              borderColor: gender === g ? '#7C3AED' : '#DDD6FE',
                              backgroundColor: gender === g ? '#EDE9FE' : 'white',
                              color: '#1E1B4B',
                            }}
                          >
                            {g === 'female' ? t.onboarding.female : t.onboarding.male}
                          </button>
                        ))}
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <InputField label={t.onboarding.weightKg} type="number" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="65" />
                        <InputField label={t.onboarding.heightCm} type="number" value={height} onChange={(e) => setHeight(e.target.value)} placeholder="170" />
                        <InputField label={t.onboarding.age} type="number" value={age} onChange={(e) => setAge(e.target.value)} placeholder="28" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium" style={{ color: '#1E1B4B' }}>{t.onboarding.activityLevel}</label>
                        <div className="grid grid-cols-2 gap-2">
                          {ACTIVITIES.map((a) => (
                            <button
                              key={a.id}
                              onClick={() => setActivity(a.id)}
                              className="px-3 py-2.5 rounded-xl border-[1.5px] text-xs font-medium transition-all"
                              style={{
                                borderColor: activity === a.id ? '#7C3AED' : '#DDD6FE',
                                backgroundColor: activity === a.id ? '#EDE9FE' : 'white',
                                color: '#1E1B4B',
                              }}
                            >
                              {t.onboarding[a.labelKey]}
                            </button>
                          ))}
                        </div>
                      </div>
                      {calories && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="rounded-2xl p-5 text-center"
                          style={{ backgroundColor: '#EDE9FE' }}
                        >
                          <p className="text-sm mb-1" style={{ color: '#6B7280' }}>{t.onboarding.dailyTarget}</p>
                          <p className="text-3xl font-bold" style={{ color: '#7C3AED' }}>{calories} <span className="text-lg font-normal">{t.onboarding.kcalDay}</span></p>
                        </motion.div>
                      )}
                    </motion.div>
                  )}
                </div>
              )}

              {step === 2 && (
                <div className="space-y-5">
                  <h2 className="text-2xl font-bold mb-2" style={{ color: '#1E1B4B' }}>{t.onboarding.step3Title}</h2>
                  <p className="text-sm mb-6" style={{ color: '#6B7280' }}>{t.onboarding.step3Sub}</p>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium" style={{ color: '#1E1B4B' }}>{t.onboarding.cookingFor}</label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <button
                          key={n}
                          onClick={() => setHouseholdSize(n)}
                          className="w-12 h-12 rounded-xl border-[1.5px] text-sm font-semibold transition-all"
                          style={{
                            borderColor: householdSize === n ? '#7C3AED' : '#DDD6FE',
                            backgroundColor: householdSize === n ? '#EDE9FE' : 'white',
                            color: '#1E1B4B',
                          }}
                        >
                          {n}{n === 5 ? '+' : ''}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium" style={{ color: '#1E1B4B' }}>{t.onboarding.dietType}</label>
                    <div className="flex flex-wrap gap-2">
                      {DIETS.map((d) => (
                        <button
                          key={d.id}
                          onClick={() => setDietType(d.id)}
                          className="px-4 py-2.5 rounded-xl border-[1.5px] text-sm font-medium transition-all"
                          style={{
                            borderColor: dietType === d.id ? '#7C3AED' : '#DDD6FE',
                            backgroundColor: dietType === d.id ? '#EDE9FE' : 'white',
                            color: '#1E1B4B',
                          }}
                        >
                          {t.onboarding[d.labelKey]}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium" style={{ color: '#1E1B4B' }}>{t.onboarding.allergies}</label>
                    <div className="flex flex-wrap gap-2">
                      {ALLERGIES_EN.map((a) => (
                        <button
                          key={a}
                          onClick={() => toggleAllergy(a)}
                          className="px-3 py-2 rounded-full border-[1.5px] text-xs font-medium transition-all"
                          style={{
                            borderColor: allergies.includes(a) ? '#7C3AED' : '#DDD6FE',
                            backgroundColor: allergies.includes(a) ? '#EDE9FE' : 'white',
                            color: allergies.includes(a) ? '#7C3AED' : '#6B7280',
                          }}
                        >
                          {allergies.includes(a) && '✕ '}{a}
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-2 mt-2">
                      <input
                        value={customAllergy}
                        onChange={(e) => setCustomAllergy(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && addCustomAllergy()}
                        placeholder={t.onboarding.addCustom}
                        className="flex-1 h-10 px-3 rounded-lg border text-sm outline-none focus:border-[#7C3AED]"
                        style={{ borderColor: '#DDD6FE', backgroundColor: '#F5F3FF' }}
                      />
                      <button onClick={addCustomAllergy} className="px-3 rounded-lg text-sm font-medium text-white" style={{ backgroundColor: '#7C3AED' }}>{t.onboarding.addBtn}</button>
                    </div>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-5">
                  <h2 className="text-2xl font-bold mb-2" style={{ color: '#1E1B4B' }}>{t.onboarding.step4Title}</h2>
                  <p className="text-sm mb-6" style={{ color: '#6B7280' }}>{t.onboarding.step4Sub}</p>
                  <div className="grid grid-cols-2 gap-3">
                    {STORES.map((s) => (
                      <button
                        key={s}
                        onClick={() => toggleStore(s)}
                        className="flex items-center gap-3 px-4 py-3.5 rounded-xl border-[1.5px] text-left transition-all"
                        style={{
                          borderColor: stores.includes(s) ? '#7C3AED' : '#DDD6FE',
                          backgroundColor: stores.includes(s) ? '#EDE9FE' : 'white',
                        }}
                      >
                        <span className="text-sm font-medium" style={{ color: '#1E1B4B' }}>{s}</span>
                        {stores.includes(s) && <Check className="w-4 h-4 ml-auto" style={{ color: '#7C3AED' }} />}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      value={customStore}
                      onChange={(e) => setCustomStore(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addCustomStore()}
                      placeholder={t.onboarding.addStore}
                      className="flex-1 h-10 px-3 rounded-lg border text-sm outline-none focus:border-[#7C3AED]"
                      style={{ borderColor: '#DDD6FE', backgroundColor: '#F5F3FF' }}
                    />
                    <button onClick={addCustomStore} className="px-3 rounded-lg text-sm font-medium text-white" style={{ backgroundColor: '#7C3AED' }}>{t.onboarding.addBtn}</button>
                  </div>
                </div>
              )}

              {step === 4 && (
                <div className="text-center pt-8 relative">
                  <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    {Array.from({ length: 30 }).map((_, i) => (
                      <motion.div
                        key={i}
                        className="absolute w-2.5 h-2.5 rounded-full"
                        style={{
                          backgroundColor: i % 3 === 0 ? '#7C3AED' : i % 3 === 1 ? '#059669' : '#A78BFA',
                          left: `${Math.random() * 100}%`,
                          top: -10,
                        }}
                        animate={{
                          y: [0, 500 + Math.random() * 300],
                          x: [0, (Math.random() - 0.5) * 200],
                          rotate: [0, Math.random() * 720],
                          opacity: [1, 0],
                        }}
                        transition={{
                          duration: 2 + Math.random() * 2,
                          delay: Math.random() * 0.8,
                          ease: 'easeIn',
                        }}
                      />
                    ))}
                  </div>

                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200 }}>
                    <span className="text-6xl">🎉</span>
                  </motion.div>
                  <h2 className="text-3xl font-bold mt-6 mb-3" style={{ color: '#1E1B4B' }}>{t.onboarding.step5Title}</h2>
                  <p className="text-base mb-2" style={{ color: '#6B7280' }}>{t.onboarding.step5Sub}</p>
                  <div
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold mt-4"
                    style={{ backgroundColor: '#EDE9FE', color: '#7C3AED' }}
                  >
                    {t.onboarding.trialActivated}
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Bottom buttons */}
      <div className="fixed bottom-0 left-0 right-0 px-6 py-5" style={{ backgroundColor: 'rgba(245,243,255,0.95)', backdropFilter: 'blur(8px)' }}>
        <div className="max-w-[560px] mx-auto flex gap-3">
          {step > 0 && step < 4 && (
            <button
              onClick={() => setStep((s) => s - 1)}
              className="flex items-center gap-1 px-5 py-3 rounded-xl text-sm font-medium border"
              style={{ borderColor: '#DDD6FE', color: '#7C3AED' }}
            >
              <ArrowLeft className="w-4 h-4" /> {t.onboarding.back}
            </button>
          )}
          <button
            onClick={handleNext}
            disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl text-white text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: '#7C3AED' }}
          >
            {saving ? t.onboarding.saving : step === 4 ? t.onboarding.goToApp : t.onboarding.next}
            {!saving && step < 4 && <ArrowRight className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
