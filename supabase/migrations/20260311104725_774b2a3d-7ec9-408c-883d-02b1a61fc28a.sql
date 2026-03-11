
-- Drop the overly permissive UPDATE policy
DROP POLICY IF EXISTS "family_members_update" ON public.family_members;

-- New policy: users can only update their OWN family_members record
CREATE POLICY "family_members_update_own"
ON public.family_members
FOR UPDATE
TO public
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Prevent is_owner escalation via trigger
CREATE OR REPLACE FUNCTION public.protect_family_member_fields()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  NEW.is_owner := OLD.is_owner;
  NEW.family_id := OLD.family_id;
  NEW.user_id := OLD.user_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_family_member_fields_trigger ON public.family_members;
CREATE TRIGGER protect_family_member_fields_trigger
  BEFORE UPDATE ON public.family_members
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_family_member_fields();
