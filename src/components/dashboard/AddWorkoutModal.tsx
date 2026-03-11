import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Minus, Plus, X } from 'lucide-react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from '@/hooks/useTranslation';
import { toast } from 'sonner';
import type { TodayWorkout } from './WorkoutWidget';

const MET_VALUES: Record<string, Record<string, number>> = {
  running: { low: 6, medium: 9, high: 12 },
  cycling: { low: 4, medium: 6, high: 10 },
  swimming: { low: 5, medium: 7, high: 10 },
  strength: { low: 3, medium: 5, high: 7 },
  yoga: { low: 2.5, medium: 3.5, high: 4 },
  team_sport: { low: 5, medium: 7, high: 9 },
  martial_arts: { low: 5, medium: 8, high: 11 },
  walking: { low: 2.5, medium: 3.5, high: 4.5 },
  hiking: { low: 4, medium: 6, high: 8 },
  aerobics: { low: 4, medium: 6, high: 8 },
  tennis: { low: 5, medium: 7, high: 9 },
  other: { low: 4, medium: 6, high: 8 },
};

const WORKOUT_TYPES = [
  { key: 'running', emoji: '🏃' },
  { key: 'cycling', emoji: '🚴' },
  { key: 'swimming', emoji: '🏊' },
  { key: 'strength', emoji: '💪' },
  { key: 'yoga', emoji: '🧘' },
  { key: 'team_sport', emoji: '⚽️' },
  { key: 'martial_arts', emoji: '🥊' },
  { key: 'walking', emoji: '🚶' },
  { key: 'hiking', emoji: '🏔' },
  { key: 'aerobics', emoji: '🤸' },
  { key: 'tennis', emoji: '🎾' },
  { key: 'other', emoji: '🏂' },
];

const WORKOUT_LABELS: Record<string, Record<string, string>> = {
  running: { en: 'Running', ru: 'Бег', lv: 'Skriešana', uk: 'Біг' },
  cycling: { en: 'Cycling', ru: 'Велосипед', lv: 'Riteņbraukšana', uk: 'Велосипед' },
  swimming: { en: 'Swimming', ru: 'Плавание', lv: 'Peldēšana', uk: 'Плавання' },
  strength: { en: 'Strength', ru: 'Силовая', lv: 'Spēks', uk: 'Силова' },
  yoga: { en: 'Yoga', ru: 'Йога', lv: 'Joga', uk: 'Йога' },
  team_sport: { en: 'Team sport', ru: 'Командный спорт', lv: 'Komandu sports', uk: 'Командний спорт' },
  martial_arts: { en: 'Martial arts', ru: 'Единоборства', lv: 'Cīņas māksla', uk: 'Єдиноборства' },
  walking: { en: 'Walking', ru: 'Ходьба', lv: 'Iešana', uk: 'Ходьба' },
  hiking: { en: 'Hiking', ru: 'Хайкинг', lv: 'Pārgājiens', uk: 'Хайкінг' },
  aerobics: { en: 'Aerobics', ru: 'Аэробика', lv: 'Aerobika', uk: 'Аеробіка' },
  tennis: { en: 'Tennis', ru: 'Теннис', lv: 'Teniss', uk: 'Теніс' },
  other: { en: 'Other', ru: 'Другое', lv: 'Cits', uk: 'Інше' },
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
  editWorkout: TodayWorkout | null;
  plannedType: string | null;
  plannedIntensity: string | null;
  plannedDuration: number | null;
}

const AddWorkoutModal = ({ open, onOpenChange, onSaved, editWorkout, plannedType, plannedIntensity, plannedDuration }: Props) => {
  const { user } = useAuth();
  const { t, language } = useTranslation();
  const wt = (t as any).workout || {};

  const [step, setStep] = useState(1);
  const [workoutType, setWorkoutType] = useState('running');
  const [intensity, setIntensity] = useState<'low' | 'medium' | 'high'>('medium');
  const [duration, setDuration] = useState(45);
  const [weightKg, setWeightKg] = useState(70);
  const [currentTarget, setCurrentTarget] = useState(2000);
  const [saving, setSaving] = useState(false);
  const [recurOption, setRecurOption] = useState<'none' | 'weekly' | 'days'>('none');
  const [recurDays, setRecurDays] = useState<number[]>([]);

  useEffect(() => {
    if (!open) { setStep(1); setRecurOption('none'); setRecurDays([]); return; }
    if (editWorkout) {
      setWorkoutType(editWorkout.workout_type);
      setIntensity(editWorkout.intensity as any);
      setDuration(editWorkout.duration_min);
    } else if (plannedType) {
      setWorkoutType(plannedType);
      setIntensity((plannedIntensity || 'medium') as any);
      setDuration(plannedDuration || 45);
    } else {
      setWorkoutType('running');
      setIntensity('medium');
      setDuration(45);
    }

    // Load weight + current target
    if (user) {
      supabase.from('user_goals').select('weight_kg, daily_calories_target').eq('user_id', user.id).maybeSingle()
        .then(({ data }) => {
          if (data?.weight_kg) setWeightKg(Number(data.weight_kg));
          if (data?.daily_calories_target) setCurrentTarget(data.daily_calories_target);
        });
    }
  }, [open, user]);

  const met = MET_VALUES[workoutType]?.[intensity] || 6;
  const burned = Math.round(met * weightKg * (duration / 60));
  const newTarget = currentTarget + burned;

  const getLabel = (type: string) => WORKOUT_LABELS[type]?.[language] || WORKOUT_LABELS[type]?.en || type;
  const kcalLabel = (t as any).diary?.kcalUnit || 'kcal';
  const minLabel = wt.min || 'min';

  const intensityConfig = [
    { key: 'low' as const, color: '#22C55E', emoji: '🟢', label: wt.intensityLow || 'Light', sub: wt.intensityLowSub || 'Warm-up', met: '~4 MET' },
    { key: 'medium' as const, color: '#F97316', emoji: '🟡', label: wt.intensityMedium || 'Medium', sub: wt.intensityMediumSub || 'Normal', met: '~6 MET' },
    { key: 'high' as const, color: '#EF4444', emoji: '🔴', label: wt.intensityHigh || 'Intense', sub: wt.intensityHighSub || 'Hard', met: '~9 MET' },
  ];

  const dayLabels = (t as any).dayLabels || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  // Convert to JS day format (0=Sun): Mon=1, Tue=2...Sun=0
  const dayIndexMap = [1, 2, 3, 4, 5, 6, 0];

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const today = new Date().toISOString().split('T')[0];

    try {
      if (editWorkout) {
        await supabase.from('workouts').update({
          workout_type: workoutType,
          intensity,
          duration_min: duration,
          calories_burned: burned,
          weight_kg: weightKg,
        } as any).eq('id', editWorkout.id);
      } else {
        await supabase.from('workouts').insert({
          user_id: user.id,
          date: today,
          workout_type: workoutType,
          intensity,
          duration_min: duration,
          calories_burned: burned,
          weight_kg: weightKg,
        } as any);
      }

      // Save recurring if selected
      if (recurOption === 'weekly') {
        const todayDay = new Date().getDay();
        await supabase.from('recurring_workouts').insert({
          user_id: user.id,
          workout_type: workoutType,
          intensity,
          duration_min: duration,
          days_of_week: [todayDay],
        } as any);
      } else if (recurOption === 'days' && recurDays.length > 0) {
        await supabase.from('recurring_workouts').insert({
          user_id: user.id,
          workout_type: workoutType,
          intensity,
          duration_min: duration,
          days_of_week: recurDays,
        } as any);
      }

      // Clear calorie cache
      localStorage.removeItem(`tyana_calorie_recalc_${user.id}`);

      toast.success(wt.saved || 'Workout saved ✓');
      onSaved();
    } catch (e) {
      console.error('Save workout error:', e);
      toast.error(wt.saveFailed || 'Failed to save');
    }
    setSaving(false);
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh]">
        <DrawerHeader className="pb-2">
          <DrawerTitle className="text-lg">
            {editWorkout ? (wt.editWorkout || 'Edit workout') : (wt.whatWorkout || 'What workout?')}
          </DrawerTitle>
        </DrawerHeader>

        <div className="px-4 pb-6 overflow-y-auto">
          <AnimatePresence mode="wait">
            {/* STEP 1: Workout type */}
            {step === 1 && (
              <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <div className="grid grid-cols-4 gap-2 mb-4">
                  {WORKOUT_TYPES.map(wk => (
                    <button
                      key={wk.key}
                      onClick={() => setWorkoutType(wk.key)}
                      className={`flex flex-col items-center gap-1 p-3 rounded-xl text-xs font-medium transition-all border-2 ${
                        workoutType === wk.key
                          ? 'border-primary bg-accent text-primary'
                          : 'border-transparent bg-secondary text-foreground'
                      }`}
                    >
                      <span className="text-xl">{wk.emoji}</span>
                      <span className="text-[10px] leading-tight text-center">{getLabel(wk.key)}</span>
                    </button>
                  ))}
                </div>
                <button onClick={() => setStep(2)} className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm">
                  {(t.common as any)?.next || 'Next'} →
                </button>
              </motion.div>
            )}

            {/* STEP 2: Intensity */}
            {step === 2 && (
              <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <div className="flex gap-2 mb-4">
                  {intensityConfig.map(ic => (
                    <button
                      key={ic.key}
                      onClick={() => setIntensity(ic.key)}
                      className={`flex-1 flex flex-col items-center gap-1 p-3 rounded-xl transition-all border-2 ${
                        intensity === ic.key
                          ? 'border-primary bg-accent'
                          : 'border-transparent bg-secondary'
                      }`}
                    >
                      <span className="text-lg">{ic.emoji}</span>
                      <span className="text-xs font-semibold text-foreground">{ic.label}</span>
                      <span className="text-[10px] text-muted-foreground">{ic.sub}</span>
                      <span className="text-[9px] text-muted-foreground/60">{ic.met}</span>
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setStep(1)} className="flex-1 py-3 rounded-xl bg-secondary text-muted-foreground font-semibold text-sm">
                    ← {(t.common as any)?.back || 'Back'}
                  </button>
                  <button onClick={() => setStep(3)} className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm">
                    {(t.common as any)?.next || 'Next'} →
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 3: Duration */}
            {step === 3 && (
              <motion.div key="s3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <div className="flex items-center justify-center gap-6 my-6">
                  <button
                    onClick={() => setDuration(Math.max(10, duration - 5))}
                    className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center text-foreground"
                  >
                    <Minus className="w-5 h-5" />
                  </button>
                  <div className="text-center">
                    <span className="text-5xl font-bold text-foreground">{duration}</span>
                    <p className="text-sm text-muted-foreground mt-1">{minLabel}</p>
                  </div>
                  <button
                    onClick={() => setDuration(Math.min(180, duration + 5))}
                    className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center text-foreground"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setStep(2)} className="flex-1 py-3 rounded-xl bg-secondary text-muted-foreground font-semibold text-sm">
                    ← {(t.common as any)?.back || 'Back'}
                  </button>
                  <button onClick={() => setStep(4)} className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm">
                    {(t.common as any)?.next || 'Next'} →
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 4: Preview + Save */}
            {step === 4 && (
              <motion.div key="s4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <div className="rounded-2xl bg-secondary p-4 mb-4 space-y-2">
                  <p className="text-sm font-semibold text-foreground">
                    {WORKOUT_TYPES.find(w => w.key === workoutType)?.emoji} {getLabel(workoutType)} • {duration} {minLabel}
                  </p>
                  <p className="text-lg font-bold text-primary">
                    {(wt.caloriesBurned || 'Calories burned: ~{cal} kcal').replace('{cal}', String(burned))}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {(wt.goalWillIncrease || 'Your goal today will increase: {from} → {to} kcal')
                      .replace('{from}', String(currentTarget))
                      .replace('{to}', String(newTarget))}
                  </p>
                </div>

                {/* Recurring option */}
                {!editWorkout && (
                  <div className="mb-4">
                    <p className="text-xs font-semibold text-foreground mb-2">
                      {wt.repeatQuestion || 'Repeat this workout?'}
                    </p>
                    <div className="flex gap-2 mb-2">
                      {[
                        { key: 'none' as const, label: wt.repeatNo || 'No' },
                        { key: 'weekly' as const, label: wt.repeatWeekly || 'Weekly' },
                        { key: 'days' as const, label: wt.repeatByDays || 'By days' },
                      ].map(opt => (
                        <button
                          key={opt.key}
                          onClick={() => setRecurOption(opt.key)}
                          className={`flex-1 py-2 rounded-xl text-xs font-medium border-2 transition-all ${
                            recurOption === opt.key
                              ? 'border-primary bg-accent text-primary'
                              : 'border-transparent bg-secondary text-muted-foreground'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                    {recurOption === 'days' && (
                      <div className="flex gap-1.5 justify-center">
                        {dayLabels.map((label: string, i: number) => {
                          const dayIdx = dayIndexMap[i];
                          const selected = recurDays.includes(dayIdx);
                          return (
                            <button
                              key={i}
                              onClick={() => setRecurDays(selected ? recurDays.filter(d => d !== dayIdx) : [...recurDays, dayIdx])}
                              className={`w-9 h-9 rounded-full text-xs font-semibold transition-all ${
                                selected ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'
                              }`}
                            >
                              {label.slice(0, 2)}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                <div className="flex gap-2">
                  <button onClick={() => setStep(3)} className="flex-1 py-3 rounded-xl bg-secondary text-muted-foreground font-semibold text-sm">
                    ← {(t.common as any)?.back || 'Back'}
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm disabled:opacity-50"
                  >
                    {saving ? '...' : `✓ ${wt.saveWorkout || 'Save workout'}`}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default AddWorkoutModal;
