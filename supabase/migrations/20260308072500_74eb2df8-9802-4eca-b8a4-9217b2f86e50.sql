
-- Create families table
CREATE TABLE public.families (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  owner_id uuid NOT NULL,
  invite_code text NOT NULL UNIQUE,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Add family columns to profiles
ALTER TABLE public.profiles 
  ADD COLUMN family_id uuid REFERENCES public.families(id) ON DELETE SET NULL,
  ADD COLUMN family_role text DEFAULT NULL;

-- Enable RLS on families
ALTER TABLE public.families ENABLE ROW LEVEL SECURITY;

-- Security definer function to get family members
CREATE OR REPLACE FUNCTION public.get_family_id_for_user(p_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT family_id FROM public.profiles WHERE user_id = p_user_id
$$;

-- Families RLS: family members can read their family
CREATE POLICY "Family members can view their family"
  ON public.families FOR SELECT
  TO authenticated
  USING (id = public.get_family_id_for_user(auth.uid()));

-- Family owner can update
CREATE POLICY "Family owner can update"
  ON public.families FOR UPDATE
  TO authenticated
  USING (owner_id = auth.uid());

-- Family owner can delete
CREATE POLICY "Family owner can delete"
  ON public.families FOR DELETE
  TO authenticated
  USING (owner_id = auth.uid());

-- Anyone authenticated can create a family
CREATE POLICY "Authenticated users can create families"
  ON public.families FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = auth.uid());

-- Anyone authenticated can read families by invite code (for joining)
CREATE POLICY "Anyone can look up by invite code"
  ON public.families FOR SELECT
  TO authenticated
  USING (true);

-- Update inventory_items RLS: family members can read each other's items
CREATE POLICY "family_inventory_select"
  ON public.inventory_items FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() 
    OR (
      public.get_family_id_for_user(auth.uid()) IS NOT NULL 
      AND public.get_family_id_for_user(auth.uid()) = public.get_family_id_for_user(user_id)
    )
  );

-- Update shopping_items RLS: family members can read/update/delete each other's items
CREATE POLICY "family_shopping_select"
  ON public.shopping_items FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() 
    OR (
      public.get_family_id_for_user(auth.uid()) IS NOT NULL 
      AND public.get_family_id_for_user(auth.uid()) = public.get_family_id_for_user(user_id)
    )
  );

CREATE POLICY "family_shopping_update"
  ON public.shopping_items FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid() 
    OR (
      public.get_family_id_for_user(auth.uid()) IS NOT NULL 
      AND public.get_family_id_for_user(auth.uid()) = public.get_family_id_for_user(user_id)
    )
  );

CREATE POLICY "family_shopping_delete"
  ON public.shopping_items FOR DELETE
  TO authenticated
  USING (
    user_id = auth.uid() 
    OR (
      public.get_family_id_for_user(auth.uid()) IS NOT NULL 
      AND public.get_family_id_for_user(auth.uid()) = public.get_family_id_for_user(user_id)
    )
  );

-- Enable realtime for shopping_items
ALTER PUBLICATION supabase_realtime ADD TABLE public.shopping_items;
