import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Pencil, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from '@/hooks/useTranslation';
import AddWorkoutModal from './AddWorkoutModal';
import { toast } from 'sonner';

const WORKOUT_EMOJIS: Record<string, string> = {
  running: '🏃', cycling: '🚴', swimming: '🏊', strength: '💪',
  yoga: '🧘', team_sport: '⚽️', martial_arts: '🥊', walking: '🚶',
  hiking: '🏔', aerobics: '🤸', tennis: '🎾', other: '🏂',
};

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

export interface TodayWorkout {
  id: string;
  workout_type: string;
  intensity: string;
  duration_min: number;
  calories_burned: number;
}

interface RecurringWorkout {
  id: string;
  workout_type: string;
  intensity: string;
  duration_min: number;
  days_of_week: number[];
}

interface Props {
  onCalorieAdjust: (burned: number) => void;
  fadeUp: (i: number) => any;
  cardClass: string;
}

const WorkoutWidget = ({ onCalorieAdjust, fadeUp, cardClass }: Props) => {
  const { user } = useAuth();
  const { t, language } = useTranslation();
  const wt = (t as any).workout || {};
  const [todayWorkout, setTodayWorkout] = useState<TodayWorkout | null>(null);
  const [planned, setPlanned] = useState<RecurringWorkout | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editWorkout, setEditWorkout] = useState<TodayWorkout | null>(null);
  const [loading, setLoading] = useState(true);

  const today = new Date().toISOString().split('T')[0];
  const dayOfWeek = new Date().getDay(); // 0=Sun

  const load = async () => {
    if (!user) return;
    setLoading(true);

    // Load today's workout
    const { data: workouts } = await supabase
      .from('workouts')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', today)
      .order('created_at', { ascending: false })
      .limit(1);

    const w = workouts?.[0] || null;
    setTodayWorkout(w);
    if (w) onCalorieAdjust(w.calories_burned);

    // Load recurring for today
    if (!w) {
      const { data: recurring } = await supabase
        .from('recurring_workouts')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true);

      const todayPlanned = recurring?.find((r: any) =>
        (r.days_of_week as number[])?.includes(dayOfWeek)
      );
      setPlanned(todayPlanned || null);
    } else {
      setPlanned(null);
    }

    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  const handleDelete = async () => {
    if (!todayWorkout || !user) return;
    await supabase.from('workouts').delete().eq('id', todayWorkout.id);
    setTodayWorkout(null);
    onCalorieAdjust(0);
    toast.success(wt.deleted || 'Workout deleted ✓');
    // Clear calorie cache to force recalculation
    localStorage.removeItem(`tyana_calorie_recalc_${user.id}`);
  };

  const handleCompletePlanned = async () => {
    if (!planned || !user) return;
    // Open modal pre-filled
    setEditWorkout(null);
    setModalOpen(true);
  };

  const handleDismissPlanned = () => {
    setPlanned(null);
  };

  const getLabel = (type: string) => WORKOUT_LABELS[type]?.[language] || WORKOUT_LABELS[type]?.en || type;
  const minLabel = wt.min || 'min';
  const kcalLabel = (t as any).diary?.kcalUnit || 'kcal';

  if (loading) return null;

  // Workout already added
  if (todayWorkout) {
    return (
      <motion.div {...fadeUp(1.3)} className={`${cardClass} p-4`} style={{ backgroundColor: 'hsl(var(--accent))' }}>
        <div className="flex items-center justify-between mb-1.5">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
            🏋️ {wt.added || 'Workout logged'}
          </h3>
          <div className="flex items-center gap-1.5">
            <button onClick={() => { setEditWorkout(todayWorkout); setModalOpen(true); }} className="p-1.5 rounded-lg hover:bg-secondary transition-colors">
              <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
            <button onClick={handleDelete} className="p-1.5 rounded-lg hover:bg-secondary transition-colors">
              <Trash2 className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          </div>
        </div>
        <p className="text-sm text-foreground">
          {WORKOUT_EMOJIS[todayWorkout.workout_type]} {getLabel(todayWorkout.workout_type)} • {todayWorkout.duration_min} {minLabel} • -{todayWorkout.calories_burned} {kcalLabel}
        </p>
        <p className="text-xs text-primary font-medium mt-1">
          {(wt.goalIncreased || 'Goal increased by +{cal} kcal').replace('{cal}', String(todayWorkout.calories_burned))}
        </p>

        <AddWorkoutModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          onSaved={() => { load(); setModalOpen(false); }}
          editWorkout={editWorkout}
          plannedType={null}
          plannedIntensity={null}
          plannedDuration={null}
        />
      </motion.div>
    );
  }

  // Planned recurring
  if (planned) {
    return (
      <motion.div {...fadeUp(1.3)} className={`${cardClass} p-4`} style={{ backgroundColor: 'hsl(var(--accent))' }}>
        <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5 mb-1">
          🏋️ {wt.plannedToday || 'Workout planned today'}
        </h3>
        <p className="text-sm text-muted-foreground mb-3">
          {WORKOUT_EMOJIS[planned.workout_type]} {getLabel(planned.workout_type)} • {planned.duration_min} {minLabel}
        </p>
        <div className="flex gap-2">
          <button
            onClick={handleCompletePlanned}
            className="flex-1 py-2 rounded-xl text-xs font-semibold bg-primary text-primary-foreground"
          >
            ✓ {wt.completed || 'Done'}
          </button>
          <button
            onClick={handleDismissPlanned}
            className="flex-1 py-2 rounded-xl text-xs font-semibold bg-secondary text-muted-foreground"
          >
            {wt.skip || 'Skip'}
          </button>
        </div>

        <AddWorkoutModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          onSaved={() => { load(); setModalOpen(false); }}
          editWorkout={null}
          plannedType={planned.workout_type}
          plannedIntensity={planned.intensity}
          plannedDuration={planned.duration_min}
        />
      </motion.div>
    );
  }

  // No workout yet
  return (
    <motion.div {...fadeUp(1.3)} className={`${cardClass} p-4`} style={{ backgroundColor: 'hsl(var(--accent))' }}>
      <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5 mb-2">
        🏋️ {wt.todayQuestion || 'Workout today?'}
      </h3>
      <button
        onClick={() => { setEditWorkout(null); setModalOpen(true); }}
        className="w-full py-2.5 rounded-xl text-sm font-semibold border-[1.5px] border-primary text-primary flex items-center justify-center gap-1.5"
      >
        + {wt.addWorkout || 'Add workout'}
      </button>

      <AddWorkoutModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSaved={() => { load(); setModalOpen(false); }}
        editWorkout={null}
        plannedType={null}
        plannedIntensity={null}
        plannedDuration={null}
      />
    </motion.div>
  );
};

export default WorkoutWidget;
