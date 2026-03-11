
-- Add new columns to profiles for usage tracking
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS fridge_scans_used integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS barcode_scans_used integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS monthly_fridge_scans integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS monthly_receipt_scans integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS monthly_reset_date date,
ADD COLUMN IF NOT EXISTS trial_started_at timestamptz;

-- Create usage_tracking table for daily limits
CREATE TABLE IF NOT EXISTS public.usage_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  gpt_calls_today integer NOT NULL DEFAULT 0,
  recipes_shown_today integer NOT NULL DEFAULT 0,
  last_reset_date date NOT NULL DEFAULT CURRENT_DATE,
  UNIQUE(user_id, date)
);

ALTER TABLE public.usage_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_usage_select" ON public.usage_tracking FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own_usage_insert" ON public.usage_tracking FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own_usage_update" ON public.usage_tracking FOR UPDATE USING (auth.uid() = user_id);

-- Update protect_profile_fields to also protect new scan fields from client manipulation
-- Actually scan counters can be client-updated since they're just counters, not subscription fields.

-- Update expire_trial RPC to set plan='free' properly
CREATE OR REPLACE FUNCTION public.expire_trial()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id uuid := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  PERFORM set_config('app.bypass_profile_protection', 'true', true);
  UPDATE public.profiles
  SET subscription_plan = 'free', subscription_status = 'free'
  WHERE user_id = v_user_id AND subscription_status IN ('trial', 'expired');
END;
$$;
