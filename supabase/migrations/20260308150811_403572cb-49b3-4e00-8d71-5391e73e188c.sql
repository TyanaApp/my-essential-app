
CREATE TABLE public.family_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  user_id UUID NULL,
  name TEXT NOT NULL,
  avatar_emoji TEXT NOT NULL DEFAULT '👤',
  gender TEXT NULL,
  age INTEGER NULL,
  weight_kg NUMERIC NULL,
  height_cm INTEGER NULL,
  activity_level TEXT NULL DEFAULT 'moderate',
  goals TEXT[] NULL DEFAULT '{}',
  diet_type TEXT NULL DEFAULT 'omnivore',
  allergies TEXT[] NULL DEFAULT '{}',
  daily_calories_target INTEGER NULL DEFAULT 2000,
  is_owner BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;

-- Security definer function to get family_id for a user
CREATE OR REPLACE FUNCTION public.get_member_family_id(p_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT family_id FROM public.profiles WHERE user_id = p_user_id
$$;

CREATE POLICY "family_members_select" ON public.family_members
  FOR SELECT USING (family_id = public.get_member_family_id(auth.uid()));

CREATE POLICY "family_members_insert" ON public.family_members
  FOR INSERT WITH CHECK (family_id = public.get_member_family_id(auth.uid()));

CREATE POLICY "family_members_update" ON public.family_members
  FOR UPDATE USING (family_id = public.get_member_family_id(auth.uid()));

CREATE POLICY "family_members_delete" ON public.family_members
  FOR DELETE USING (family_id = public.get_member_family_id(auth.uid()));
