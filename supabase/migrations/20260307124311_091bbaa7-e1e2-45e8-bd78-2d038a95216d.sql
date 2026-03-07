ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS streak_current integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS streak_longest integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS streak_last_activity date,
  ADD COLUMN IF NOT EXISTS streak_badges text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS bonus_scans integer DEFAULT 0;