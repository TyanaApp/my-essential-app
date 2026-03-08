
-- App settings table for global counters
CREATE TABLE IF NOT EXISTS public.app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL DEFAULT '0',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Insert initial counter
INSERT INTO public.app_settings (key, value) VALUES ('total_registered_users', '0') ON CONFLICT (key) DO NOTHING;

-- Allow public read on app_settings (no auth needed for counter)
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read app_settings" ON public.app_settings FOR SELECT TO anon, authenticated USING (true);

-- Add founding member columns to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS user_number INTEGER;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_founding_member BOOLEAN DEFAULT false;

-- Support tickets table
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  email TEXT,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'new',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users insert own tickets" ON public.support_tickets FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users view own tickets" ON public.support_tickets FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Feedback table
CREATE TABLE IF NOT EXISTS public.feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  type TEXT DEFAULT 'suggestion',
  suggestion TEXT,
  rating INTEGER,
  importance_rating INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users insert own feedback" ON public.feedback FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users view own feedback" ON public.feedback FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Function to increment user counter and assign user_number on onboarding
CREATE OR REPLACE FUNCTION public.assign_user_number(p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_number INTEGER;
BEGIN
  -- Atomically increment counter
  UPDATE public.app_settings 
  SET value = (value::integer + 1)::text, updated_at = now()
  WHERE key = 'total_registered_users'
  RETURNING value::integer INTO new_number;

  -- Update profile with user number and founding status
  UPDATE public.profiles
  SET user_number = new_number,
      is_founding_member = (new_number <= 1000)
  WHERE user_id = p_user_id;

  RETURN json_build_object('user_number', new_number, 'is_founding_member', new_number <= 1000);
END;
$$;
