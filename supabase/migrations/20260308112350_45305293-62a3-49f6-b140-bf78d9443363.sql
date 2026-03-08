
-- Add store_integration_waitlist column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS store_integration_waitlist boolean DEFAULT false;

-- Create a function to count waitlist users
CREATE OR REPLACE FUNCTION public.count_store_waitlist()
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT count(*)::integer FROM public.profiles WHERE store_integration_waitlist = true
$$;
