
-- 1. Add trial_used column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS trial_used boolean DEFAULT false;

-- 2. Fix grant_streak_reward with server-side streak verification and one-time-grant protection
CREATE OR REPLACE FUNCTION public.grant_streak_reward(p_plan text, p_trial_days integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_streak integer;
  v_badges text[];
  v_current_status text;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF p_plan NOT IN ('lite', 'pro_founding') THEN RAISE EXCEPTION 'Invalid plan'; END IF;
  IF p_trial_days < 1 OR p_trial_days > 30 THEN RAISE EXCEPTION 'Invalid trial days'; END IF;

  -- Fetch streak data for server-side verification
  SELECT streak_current, streak_badges, subscription_status
  INTO v_streak, v_badges, v_current_status
  FROM public.profiles WHERE user_id = v_user_id;

  -- Don't override active paid subscription
  IF v_current_status = 'active' THEN RETURN; END IF;

  -- Verify streak milestones server-side
  IF p_plan = 'lite' AND v_streak < 30 THEN
    RAISE EXCEPTION 'Streak milestone not reached (need 30, have %)', v_streak;
  END IF;
  IF p_plan = 'pro_founding' AND v_streak < 100 THEN
    RAISE EXCEPTION 'Streak milestone not reached (need 100, have %)', v_streak;
  END IF;

  -- Prevent duplicate reward grant using badge as proof
  IF p_plan = 'lite' AND '👑' = ANY(COALESCE(v_badges, '{}')) THEN RETURN; END IF;
  IF p_plan = 'pro_founding' AND '🏆' = ANY(COALESCE(v_badges, '{}')) THEN RETURN; END IF;

  PERFORM set_config('app.bypass_profile_protection', 'true', true);
  UPDATE public.profiles
  SET subscription_plan = p_plan, trial_end = now() + (p_trial_days || ' days')::interval
  WHERE user_id = v_user_id;
END;
$$;

-- 3. Harden activate_trial to prevent re-use
CREATE OR REPLACE FUNCTION public.activate_trial()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_current_status text;
  v_trial_end timestamptz;
  v_trial_used boolean;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  SELECT subscription_status, trial_end, trial_used
  INTO v_current_status, v_trial_end, v_trial_used
  FROM public.profiles WHERE user_id = v_user_id;

  -- Already on active paid subscription
  IF v_current_status = 'active' THEN RETURN; END IF;
  -- Already on active trial
  IF v_current_status = 'trial' AND v_trial_end > now() THEN RETURN; END IF;
  -- Trial already used - cannot re-activate
  IF v_trial_used = true THEN RAISE EXCEPTION 'Trial already used'; END IF;

  PERFORM set_config('app.bypass_profile_protection', 'true', true);
  UPDATE public.profiles
  SET subscription_plan = 'pro',
      subscription_status = 'trial',
      trial_end = now() + interval '7 days',
      trial_used = true
  WHERE user_id = v_user_id;
END;
$$;
