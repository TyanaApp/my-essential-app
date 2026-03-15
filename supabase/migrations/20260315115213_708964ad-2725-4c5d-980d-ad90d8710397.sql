
CREATE TABLE public.watch_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  calories_burned integer,
  heart_rate integer,
  heart_rate_min integer,
  heart_rate_max integer,
  steps integer,
  sleep_hours numeric,
  sleep_quality text,
  stress_level integer,
  blood_oxygen integer,
  active_minutes integer,
  distance_km numeric,
  watch_brand text,
  confidence text,
  raw_metrics jsonb,
  advice jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, date)
);

ALTER TABLE public.watch_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_watch_data_select" ON public.watch_data FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own_watch_data_insert" ON public.watch_data FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own_watch_data_update" ON public.watch_data FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own_watch_data_delete" ON public.watch_data FOR DELETE USING (auth.uid() = user_id);
