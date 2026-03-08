
-- Create calorie_history table
CREATE TABLE public.calorie_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  date DATE NOT NULL,
  target INTEGER NOT NULL,
  base_tdee INTEGER NOT NULL,
  adjustment INTEGER NOT NULL DEFAULT 0,
  avg_last_7_days INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, date)
);

ALTER TABLE public.calorie_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_calorie_history_select" ON public.calorie_history
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own_calorie_history_insert" ON public.calorie_history
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Create weight_history table
CREATE TABLE public.weight_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  weight NUMERIC NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, date)
);

ALTER TABLE public.weight_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_weight_history_select" ON public.weight_history
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own_weight_history_insert" ON public.weight_history
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own_weight_history_update" ON public.weight_history
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Add last_recalculated to user_goals
ALTER TABLE public.user_goals ADD COLUMN IF NOT EXISTS last_recalculated TIMESTAMP WITH TIME ZONE;
