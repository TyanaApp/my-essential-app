
-- Workouts table
CREATE TABLE public.workouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  workout_type text NOT NULL,
  intensity text NOT NULL DEFAULT 'medium',
  duration_min integer NOT NULL DEFAULT 30,
  calories_burned integer NOT NULL DEFAULT 0,
  weight_kg numeric,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.workouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_workouts_select" ON public.workouts FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own_workouts_insert" ON public.workouts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own_workouts_update" ON public.workouts FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own_workouts_delete" ON public.workouts FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Recurring workouts table
CREATE TABLE public.recurring_workouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  workout_type text NOT NULL,
  intensity text NOT NULL DEFAULT 'medium',
  duration_min integer NOT NULL DEFAULT 30,
  days_of_week integer[] NOT NULL DEFAULT '{}',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.recurring_workouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_recurring_select" ON public.recurring_workouts FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own_recurring_insert" ON public.recurring_workouts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own_recurring_update" ON public.recurring_workouts FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own_recurring_delete" ON public.recurring_workouts FOR DELETE TO authenticated USING (auth.uid() = user_id);
