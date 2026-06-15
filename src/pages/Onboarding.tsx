import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/* ───────── types ───────── */
type Concern = 'stuck' | 'tired' | 'understand' | 'workouts';
type Gender = 'male' | 'female';
type Activity = 'low' | 'moderate' | 'active' | 'very_active';
type WeightUnit = 'kg' | 'lbs';
type HeightUnit = 'cm' | 'ft';
type SmartDevice = 'apple' | 'other' | 'none';

const TOTAL_STEPS = 4;

/* ───────── copy (EN) ───────── */
const CONCERNS: { id: Concern; emoji: string; title: string; desc: string }[] = [
  { id: 'stuck',      emoji: '😤', title: "I do everything right — but nothing changes", desc: "I eat well, I exercise. But my weight is stuck and I don't know why." },
  { id: 'tired',      emoji: '⚡', title: "I'm constantly tired and have no energy",      desc: "Even after a good night's sleep. By midday I'm already exhausted." },
  { id: 'understand', emoji: '🧠', title: "I want to understand how food affects me",     desc: "Not just calories — I want to know what's actually happening in my body." },
  { id: 'workouts',   emoji: '💪', title: "I want better results from my workouts",       desc: "I train hard but recovery is slow and progress is minimal." },
];

const ACTIVITY_OPTIONS: { id: Activity; emoji: string; label: string }[] = [
  { id: 'low',         emoji: '🛋', label: 'Low — mostly sitting' },
  { id: 'moderate',    emoji: '🚶', label: 'Light — occasional walks' },
  { id: 'active',      emoji: '🏃', label: 'Active — workouts 3-4x week' },
  { id: 'very_active', emoji: '🔥', label: 'Very active — daily intense training' },
];

const DEVICE_OPTIONS: { id: SmartDevice; emoji: string; title: string; desc: string }[] = [
  { id: 'apple', emoji: '⌚', title: 'Yes — Apple Watch',    desc: "We'll connect to Apple Health" },
  { id: 'other', emoji: '⌚', title: 'Yes — other tracker',  desc: 'Fitbit, Garmin, Samsung and others' },
  { id: 'none',  emoji: '📱', title: "No, I don't have one", desc: 'No problem — TYANA works great with just photos' },
];

const CONCERN_SUMMARY: Record<Concern, string> = {
  stuck:      'Focused on breaking through your plateau',
  tired:      'Optimised for steady energy throughout the day',
  understand: 'Tracking how each meal really affects you',
  workouts:   'Built for performance and faster recovery',
};

/* ───────── calorie / macro helpers ───────── */
const ACTIVITY_FACTORS: Record<Activity, number> = { low: 1.2, moderate: 1.375, active: 1.55, very_active: 1.725 };

const calcCalories = (gender: Gender, weightKg: number, heightCm: number, age: number, activity: Activity, concern: Concern): number => {
  const bmr = 10 * weightKg + 6.25 * heightCm - 5 * age + (gender === 'male' ? 5 : -161);
  const tdee = bmr * ACTIVITY_FACTORS[activity];
  let target = tdee;
  if (concern === 'stuck') target = tdee - 400;          // gentle deficit
  else if (concern === 'workouts') target = tdee + 200;  // light surplus
  // tired / understand → maintenance
  const minCal = gender === 'male' ? 1500 : 1200;
  return Math.round(Math.max(target, minCal));
};

const calcMacros = (cal: number, concern: Concern, weightKg: number) => {
  if (concern === 'workouts') {
    const proteinG = Math.round(weightKg * 2.0);
    const proteinCals = proteinG * 4;
    const remaining = Math.max(cal - proteinCals, 0);
    return {
      protein: proteinG,
      fat:   Math.round((remaining * 0.30) / 9),
      carbs: Math.round((remaining * 0.70) / 4),
    };
  }
  return {
    protein: Math.round((cal * 0.25) / 4),
    fat:     Math.round((cal * 0.30) / 9),
    carbs:   Math.round((cal * 0.45) / 4),
  };
};

const concernToGoal = (c: Concern): string =>
  c === 'stuck' ? 'lose_weight' : c === 'workouts' ? 'build_muscle' : 'balanced';

/* ───────── small UI bits ───────── */
const Dots = ({ active }: { active: number }) => (
  <div className="flex items-center gap-2">
    {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
      <div
        key={i}
        className={`h-2 rounded-full transition-all ${i === active ? 'w-6 bg-primary' : i < active ? 'w-2 bg-primary/60' : 'w-2 bg-muted'}`}
      />
    ))}
  </div>
);

const Confetti = () => {
  const particles = useMemo(() => Array.from({ length: 36 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    delay: Math.random() * 0.4,
    duration: 1.4 + Math.random() * 1.4,
    color: ['#A855F7', '#C084FC', '#7C3AED', '#DDD6FE', '#F0ABFC'][i % 5],
    size: 5 + Math.random() * 6,
    rotation: Math.random() * 360,
  })), []);
  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {particles.map(p => (
        <motion.div
          key={p.id}
          initial={{ y: -20, x: `${p.x}vw`, opacity: 1, rotate: 0 }}
          animate={{ y: '110vh', opacity: 0, rotate: p.rotation + 720 }}
          transition={{ duration: p.duration, delay: p.delay, ease: 'easeIn' }}
          style={{ position: 'absolute', width: p.size, height: p.size * 0.6, backgroundColor: p.color, borderRadius: 1 }}
        />
      ))}
    </div>
  );
};

/* ═══════════ MAIN ═══════════ */
const Onboarding = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [saving, setSaving] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  // Step 1
  const [concern, setConcern] = useState<Concern | null>(null);
  // Step 2
  const [gender, setGender] = useState<Gender | null>(null);
  const [age, setAge] = useState<string>('');
  const [weightVal, setWeightVal] = useState<string>('');
  const [weightUnit, setWeightUnit] = useState<WeightUnit>('kg');
  const [heightVal, setHeightVal] = useState<string>('');
  const [heightUnit, setHeightUnit] = useState<HeightUnit>('cm');
  const [activity, setActivity] = useState<Activity | null>(null);
  // Step 3
  const [device, setDevice] = useState<SmartDevice | null>(null);

  const goNext = () => { setDirection(1); setStep(s => Math.min(TOTAL_STEPS - 1, s + 1)); };
  const goBack = () => { setDirection(-1); setStep(s => Math.max(0, s - 1)); };

  const ageNum    = parseInt(age, 10) || 0;
  const weightRaw = parseFloat(weightVal) || 0;
  const heightRaw = parseFloat(heightVal) || 0;
  const weightKg  = weightUnit === 'kg' ? weightRaw : Math.round(weightRaw / 2.205);
  const heightCm  = heightUnit === 'cm' ? heightRaw : Math.round(heightRaw * 30.48); // ft → cm

  const canCalc =
    !!gender && ageNum >= 10 && ageNum <= 100 &&
    weightKg >= 30 && weightKg <= 300 &&
    heightCm >= 100 && heightCm <= 250 &&
    !!activity;

  const calories = (concern && canCalc)
    ? calcCalories(gender!, weightKg, heightCm, ageNum, activity!, concern)
    : 2000;
  const macros = concern ? calcMacros(calories, concern, weightKg || 70) : { protein: 0, fat: 0, carbs: 0 };

  // Step 1 auto-advance
  const selectConcern = (c: Concern) => {
    setConcern(c);
    setTimeout(goNext, 220);
  };

  // Step 3 auto-advance
  const selectDevice = (d: SmartDevice) => {
    setDevice(d);
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 2500);
    setTimeout(goNext, 250);
  };

  const persistAndGo = useCallback(async (destination: string) => {
    if (!user || !concern) return;
    setSaving(true);
    try {
      await supabase.from('profiles').update({
        gender,
        onboarding_completed: true,
      } as any).eq('user_id', user.id);

      try { await supabase.rpc('activate_trial' as any); } catch {}
      try { await supabase.rpc('assign_user_number', { p_user_id: user.id }); } catch {}

      await supabase.from('user_goals').upsert({
        user_id: user.id,
        goals: [concernToGoal(concern)],
        diet_type: 'omnivore',
        household_size: 1,
        allergies: [],
        disliked_foods: [],
        daily_calories_target: calories,
        weight_kg: weightKg,
        height_cm: heightCm,
        age: ageNum,
        activity_level: activity || 'moderate',
      } as any, { onConflict: 'user_id' });

      try {
        localStorage.setItem('tyana_smart_device', device || 'none');
        localStorage.setItem('tyana_primary_concern', concern);
      } catch {}

      supabase.functions.invoke('send-welcome-email', {
        body: { email: user.email, name: user.user_metadata?.full_name || user.email?.split('@')[0], language: 'en' },
      }).catch(() => {});

      navigate(destination);
    } catch (e) {
      console.error(e);
      toast.error('Error saving data');
    } finally {
      setSaving(false);
    }
  }, [user, concern, gender, calories, weightKg, heightCm, ageNum, activity, device, navigate]);

  const slide = {
    enter: (d: number) => ({ x: d > 0 ? 280 : -280, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: d > 0 ? -280 : 280, opacity: 0 }),
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {showConfetti && <Confetti />}

      {/* Header */}
      <div className="px-6 pt-5 pb-3">
        <div className="flex items-center justify-between mb-4">
          {step > 0 ? (
            <button onClick={goBack} aria-label="Back" className="p-2 -ml-2 text-foreground">
              <ArrowLeft className="w-5 h-5" />
            </button>
          ) : <div className="w-9" />}
          <Dots active={step} />
          <span className="text-xs text-muted-foreground w-16 text-right">Step {step + 1} of {TOTAL_STEPS}</span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 pb-10">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            variants={slide}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="w-full max-w-md mx-auto pt-4"
          >
            {/* ═══ STEP 1 — Concern ═══ */}
            {step === 0 && (
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground">What's been bothering you most?</h1>
                <p className="text-muted-foreground mt-2 mb-6 text-base">Choose the one that feels most like you</p>
                <div className="space-y-3">
                  {CONCERNS.map(c => {
                    const selected = concern === c.id;
                    return (
                      <motion.button
                        key={c.id}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => selectConcern(c.id)}
                        className={`w-full text-left p-5 rounded-2xl border-2 transition-all ${
                          selected
                            ? 'border-primary bg-primary/5'
                            : 'border-border bg-card hover:border-primary/40'
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          <span className="text-3xl shrink-0">{c.emoji}</span>
                          <div className="min-w-0">
                            <p className="font-semibold text-foreground text-base leading-snug">{c.title}</p>
                            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{c.desc}</p>
                          </div>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ═══ STEP 2 — Personal ═══ */}
            {step === 1 && (
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Let's calculate your personal daily goal</h1>
                <p className="text-muted-foreground mt-2 mb-6 text-base">This takes 30 seconds</p>

                {/* Gender */}
                <div className="grid grid-cols-2 gap-3 mb-5">
                  {(['female', 'male'] as Gender[]).map(g => (
                    <button
                      key={g}
                      onClick={() => setGender(g)}
                      className={`h-12 rounded-full font-medium text-base border-2 transition-all ${
                        gender === g ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-card text-foreground'
                      }`}
                    >
                      {g === 'female' ? 'Female' : 'Male'}
                    </button>
                  ))}
                </div>

                {/* Age */}
                <input
                  type="number"
                  inputMode="numeric"
                  value={age}
                  onChange={e => setAge(e.target.value)}
                  placeholder="Your age"
                  className="w-full h-14 rounded-2xl px-5 text-base bg-card border-2 border-border focus:border-primary outline-none mb-4 text-foreground placeholder:text-muted-foreground/70"
                />

                {/* Weight */}
                <div className="flex gap-2 mb-4">
                  <input
                    type="number"
                    inputMode="decimal"
                    value={weightVal}
                    onChange={e => setWeightVal(e.target.value)}
                    placeholder="Current weight"
                    className="flex-1 h-14 rounded-2xl px-5 text-base bg-card border-2 border-border focus:border-primary outline-none text-foreground placeholder:text-muted-foreground/70"
                  />
                  <div className="flex bg-muted rounded-2xl p-1">
                    {(['kg', 'lbs'] as WeightUnit[]).map(u => (
                      <button
                        key={u}
                        onClick={() => setWeightUnit(u)}
                        className={`px-4 rounded-xl text-sm font-medium transition-all ${
                          weightUnit === u ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'
                        }`}
                      >{u}</button>
                    ))}
                  </div>
                </div>

                {/* Height */}
                <div className="flex gap-2 mb-6">
                  <input
                    type="number"
                    inputMode="decimal"
                    value={heightVal}
                    onChange={e => setHeightVal(e.target.value)}
                    placeholder="Height"
                    className="flex-1 h-14 rounded-2xl px-5 text-base bg-card border-2 border-border focus:border-primary outline-none text-foreground placeholder:text-muted-foreground/70"
                  />
                  <div className="flex bg-muted rounded-2xl p-1">
                    {(['cm', 'ft'] as HeightUnit[]).map(u => (
                      <button
                        key={u}
                        onClick={() => setHeightUnit(u)}
                        className={`px-4 rounded-xl text-sm font-medium transition-all ${
                          heightUnit === u ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'
                        }`}
                      >{u}</button>
                    ))}
                  </div>
                </div>

                {/* Activity */}
                <p className="text-sm font-medium text-foreground mb-3">Activity level</p>
                <div className="grid grid-cols-2 gap-3 mb-8">
                  {ACTIVITY_OPTIONS.map(a => (
                    <button
                      key={a.id}
                      onClick={() => setActivity(a.id)}
                      className={`p-4 rounded-2xl border-2 text-left transition-all min-h-[72px] ${
                        activity === a.id ? 'border-primary bg-primary/10' : 'border-border bg-card'
                      }`}
                    >
                      <span className="text-xl block mb-1">{a.emoji}</span>
                      <span className="text-sm font-medium text-foreground leading-snug block">{a.label.replace(/^[^ ]+ /, '')}</span>
                    </button>
                  ))}
                </div>

                <button
                  disabled={!canCalc}
                  onClick={goNext}
                  className="w-full h-14 rounded-2xl bg-primary text-primary-foreground font-semibold text-base disabled:opacity-50 active:scale-[0.99] transition-transform"
                >
                  Calculate my goal →
                </button>
              </div>
            )}

            {/* ═══ STEP 3 — Smart device ═══ */}
            {step === 2 && (
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Do you wear a smartwatch or fitness tracker?</h1>
                <p className="text-muted-foreground mt-2 mb-6 text-base">TYANA can use your real data to give better tips</p>
                <div className="space-y-3">
                  {DEVICE_OPTIONS.map(d => {
                    const selected = device === d.id;
                    return (
                      <motion.button
                        key={d.id}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => selectDevice(d.id)}
                        className={`w-full text-left p-5 rounded-2xl border-2 transition-all ${
                          selected ? 'border-primary bg-primary/5' : 'border-border bg-card hover:border-primary/40'
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          <span className="text-3xl shrink-0">{d.emoji}</span>
                          <div className="min-w-0">
                            <p className="font-semibold text-foreground text-base">{d.title}</p>
                            <p className="text-sm text-muted-foreground mt-1">{d.desc}</p>
                          </div>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ═══ STEP 4 — Reveal ═══ */}
            {step === 3 && concern && (
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground text-center">Your personal profile is ready</h1>

                <motion.div
                  initial={{ y: 14, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="mt-6 p-6 rounded-3xl bg-card border-2 border-border text-center"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 280, delay: 0.2 }}
                    className="w-16 h-16 mx-auto rounded-full bg-primary flex items-center justify-center mb-4"
                  >
                    <span className="text-primary-foreground text-3xl leading-none">✓</span>
                  </motion.div>
                  <p className="text-sm text-muted-foreground">Daily calorie goal</p>
                  <p className="text-4xl font-bold text-foreground mt-1">
                    {calories.toLocaleString()} <span className="text-xl font-semibold text-muted-foreground">kcal</span>
                  </p>
                  <p className="text-sm text-muted-foreground mt-3">
                    Protein {macros.protein}g · Fat {macros.fat}g · Carbs {macros.carbs}g
                  </p>
                  <p className="text-sm text-primary font-medium mt-4">{CONCERN_SUMMARY[concern]}</p>
                </motion.div>

                <div
                  className="mt-5 p-4 rounded-2xl text-sm text-foreground leading-relaxed"
                  style={{ background: '#F3EEFF' }}
                >
                  💡 Most people notice a difference in energy within the first week of tracking with TYANA
                </div>

                <div className="my-6 h-px bg-border" />

                <p className="text-center text-muted-foreground mb-4 text-base">Now take your first photo — see what TYANA notices</p>

                <button
                  disabled={saving}
                  onClick={() => persistAndGo('/diary')}
                  className="w-full h-14 rounded-2xl bg-primary text-primary-foreground font-semibold text-base disabled:opacity-60 active:scale-[0.99] transition-transform"
                >
                  📸 Log my first meal →
                </button>
                <button
                  disabled={saving}
                  onClick={() => persistAndGo('/dashboard')}
                  className="block mx-auto mt-4 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Skip for now
                </button>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Onboarding;
