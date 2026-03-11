
-- 1. Trigger to protect sensitive profile fields from direct client updates
CREATE OR REPLACE FUNCTION public.protect_profile_fields()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF current_setting('app.bypass_profile_protection', true) IS DISTINCT FROM 'true' THEN
    NEW.family_id := OLD.family_id;
    NEW.family_role := OLD.family_role;
    NEW.subscription_plan := OLD.subscription_plan;
    NEW.subscription_status := OLD.subscription_status;
    NEW.trial_end := OLD.trial_end;
    NEW.stripe_customer_id := OLD.stripe_customer_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER protect_profile_fields_trigger
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_profile_fields();

-- 2. Create family RPC
CREATE OR REPLACE FUNCTION public.create_family_rpc(p_name text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_family_id uuid;
  v_invite_code text;
  v_display_name text;
  v_gender text;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN json_build_object('error', 'Not authenticated');
  END IF;
  PERFORM 1 FROM public.profiles WHERE user_id = v_user_id AND family_id IS NOT NULL;
  IF FOUND THEN
    RETURN json_build_object('error', 'Already in a family');
  END IF;
  v_invite_code := 'TYA-' || LPAD((floor(random() * 900) + 100)::text, 3, '0');
  INSERT INTO public.families (name, owner_id, invite_code)
  VALUES (p_name, v_user_id, v_invite_code)
  RETURNING id INTO v_family_id;
  PERFORM set_config('app.bypass_profile_protection', 'true', true);
  UPDATE public.profiles SET family_id = v_family_id, family_role = 'owner' WHERE user_id = v_user_id;
  SELECT display_name, gender INTO v_display_name, v_gender FROM public.profiles WHERE user_id = v_user_id;
  INSERT INTO public.family_members (family_id, user_id, name, avatar_emoji, is_owner)
  VALUES (v_family_id, v_user_id, COALESCE(v_display_name, 'Me'),
          CASE WHEN v_gender = 'female' THEN '👩' ELSE '👨' END, true);
  RETURN json_build_object('family_id', v_family_id, 'invite_code', v_invite_code);
END;
$$;

-- 3. Join family RPC
CREATE OR REPLACE FUNCTION public.join_family_by_invite(p_invite_code text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_family_id uuid;
  v_family_name text;
  v_user_id uuid := auth.uid();
  v_display_name text;
  v_gender text;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN json_build_object('error', 'Not authenticated');
  END IF;
  SELECT id, name INTO v_family_id, v_family_name FROM public.families WHERE invite_code = upper(trim(p_invite_code));
  IF v_family_id IS NULL THEN
    RETURN json_build_object('error', 'Invalid invite code');
  END IF;
  PERFORM 1 FROM public.profiles WHERE user_id = v_user_id AND family_id IS NOT NULL;
  IF FOUND THEN
    RETURN json_build_object('error', 'Already in a family');
  END IF;
  PERFORM set_config('app.bypass_profile_protection', 'true', true);
  UPDATE public.profiles SET family_id = v_family_id, family_role = 'member' WHERE user_id = v_user_id;
  SELECT display_name, gender INTO v_display_name, v_gender FROM public.profiles WHERE user_id = v_user_id;
  INSERT INTO public.family_members (family_id, user_id, name, avatar_emoji, is_owner)
  VALUES (v_family_id, v_user_id, COALESCE(v_display_name, 'Member'),
          CASE WHEN v_gender = 'female' THEN '👩' ELSE '👨' END, false);
  RETURN json_build_object('family_id', v_family_id, 'family_name', v_family_name);
END;
$$;

-- 4. Leave family RPC
CREATE OR REPLACE FUNCTION public.leave_family_rpc()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_family_id uuid;
  v_is_owner boolean;
BEGIN
  SELECT family_id INTO v_family_id FROM public.profiles WHERE user_id = v_user_id;
  IF v_family_id IS NULL THEN RETURN; END IF;
  SELECT (owner_id = v_user_id) INTO v_is_owner FROM public.families WHERE id = v_family_id;
  IF v_is_owner THEN
    PERFORM set_config('app.bypass_profile_protection', 'true', true);
    UPDATE public.profiles SET family_id = NULL, family_role = NULL WHERE family_id = v_family_id;
    DELETE FROM public.family_members WHERE family_id = v_family_id;
    DELETE FROM public.families WHERE id = v_family_id;
  ELSE
    DELETE FROM public.family_members WHERE user_id = v_user_id AND family_id = v_family_id;
    PERFORM set_config('app.bypass_profile_protection', 'true', true);
    UPDATE public.profiles SET family_id = NULL, family_role = NULL WHERE user_id = v_user_id;
  END IF;
END;
$$;

-- 5. Activate trial RPC
CREATE OR REPLACE FUNCTION public.activate_trial()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_current_status text;
  v_trial_end timestamptz;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT subscription_status, trial_end INTO v_current_status, v_trial_end FROM public.profiles WHERE user_id = v_user_id;
  IF v_current_status = 'active' THEN RETURN; END IF;
  IF v_current_status = 'trial' AND v_trial_end > now() THEN RETURN; END IF;
  PERFORM set_config('app.bypass_profile_protection', 'true', true);
  UPDATE public.profiles
  SET subscription_plan = 'pro', subscription_status = 'trial', trial_end = now() + interval '7 days'
  WHERE user_id = v_user_id;
END;
$$;

-- 6. Expire trial RPC
CREATE OR REPLACE FUNCTION public.expire_trial()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  PERFORM set_config('app.bypass_profile_protection', 'true', true);
  UPDATE public.profiles
  SET subscription_plan = 'free', subscription_status = 'expired'
  WHERE user_id = v_user_id AND subscription_status = 'trial';
END;
$$;

-- 7. Grant streak reward RPC
CREATE OR REPLACE FUNCTION public.grant_streak_reward(p_plan text, p_trial_days int)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF p_plan NOT IN ('lite', 'pro_founding') THEN RAISE EXCEPTION 'Invalid plan'; END IF;
  IF p_trial_days < 1 OR p_trial_days > 30 THEN RAISE EXCEPTION 'Invalid trial days'; END IF;
  PERFORM set_config('app.bypass_profile_protection', 'true', true);
  UPDATE public.profiles
  SET subscription_plan = p_plan, trial_end = now() + (p_trial_days || ' days')::interval
  WHERE user_id = v_user_id;
END;
$$;

-- 8. Find family by invite RPC
CREATE OR REPLACE FUNCTION public.find_family_by_invite(p_invite_code text)
RETURNS TABLE(id uuid, name text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT f.id, f.name FROM public.families f WHERE f.invite_code = upper(trim(p_invite_code));
$$;

-- 9. Drop overly broad families SELECT policy
DROP POLICY IF EXISTS "Anyone can look up by invite code" ON public.families;

-- 10. Fix family_members DELETE policy - only own record
DROP POLICY IF EXISTS "family_members_delete" ON public.family_members;
CREATE POLICY "family_members_delete_own"
  ON public.family_members FOR DELETE
  TO public
  USING (user_id = auth.uid());
